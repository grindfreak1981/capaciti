import { describe, expect, it } from "vitest";
import { matchRfqAgainstMachine, matchRfqAgainstMachines } from "./engine";
import { CNC_MILLING, CNC_TURNING } from "../processes/codes";
import type { MachineForMatching, RfqForMatching } from "./types";
import { toIsoWeekRef } from "./weeks";

const NOW = new Date("2026-09-09T00:00:00Z");
const currentWeek = toIsoWeekRef(NOW);

function millingRfq(overrides: Partial<RfqForMatching> = {}): RfqForMatching {
  return {
    id: "rfq-1",
    companyId: "buyer-1",
    manufacturingProcessId: "proc-milling",
    processCode: CNC_MILLING,
    materialId: "mat-aluminium",
    quantity: 50,
    requiredDeliveryDate: new Date("2026-09-25T00:00:00Z"),
    requirements: {
      requiredAxisCount: 5,
      partSizeXMm: 400,
      partSizeYMm: 300,
      partSizeZMm: 200,
      toleranceMm: 0.05,
    },
    ...overrides,
  };
}

function millingMachine(overrides: Partial<MachineForMatching> = {}): MachineForMatching {
  return {
    id: "machine-1",
    name: "DMG Mori DMU 50",
    companyId: "supplier-1",
    companyName: "Demo Precision d.o.o.",
    manufacturingProcessId: "proc-milling",
    processCode: CNC_MILLING,
    capabilities: {
      axisCount: 5,
      travelXMm: 650,
      travelYMm: 520,
      travelZMm: 475,
    },
    minimumBatchSize: null,
    maximumBatchSize: null,
    materialIds: ["mat-aluminium", "mat-steel"],
    availability: [{ ...currentWeek, status: "AVAILABLE", estimatedHours: 30 }],
    ...overrides,
  };
}

describe("matching engine — milling", () => {
  it("produces a full compatible match when everything lines up", () => {
    const result = matchRfqAgainstMachine(millingRfq(), millingMachine(), NOW);
    expect(result.compatible).toBe(true);
    expect(result.score).toBe(100);
    expect(result.availabilitySummary).toBe("AVAILABLE");
  });

  it("rejects on process mismatch", () => {
    const result = matchRfqAgainstMachine(
      millingRfq({ processCode: CNC_TURNING }),
      millingMachine(),
      NOW,
    );
    expect(result.compatible).toBe(false);
    expect(result.score).toBe(0);
    expect(result.reasons[0].key).toBe("process");
  });

  it("rejects when axis requirement is not met", () => {
    const result = matchRfqAgainstMachine(
      millingRfq({ requirements: { requiredAxisCount: 5 } }),
      millingMachine({ capabilities: { axisCount: 3, travelXMm: 650, travelYMm: 520, travelZMm: 475 } }),
      NOW,
    );
    expect(result.compatible).toBe(false);
    const axisReason = result.reasons.find((r) => r.key === "axis");
    expect(axisReason?.passed).toBe(false);
  });

  it("rejects when part does not fit machine travel in any orientation", () => {
    const result = matchRfqAgainstMachine(
      millingRfq({ requirements: { partSizeXMm: 900, partSizeYMm: 900, partSizeZMm: 900 } }),
      millingMachine(),
      NOW,
    );
    expect(result.compatible).toBe(false);
    expect(result.reasons.find((r) => r.key === "envelope")?.passed).toBe(false);
  });

  it("allows a rotated part to fit even if it doesn't fit axis-aligned", () => {
    // Machine travel: 650 x 520 x 475. Part 500 x 600 x 100 doesn't fit
    // X<->X, Y<->Y, but fits when X and Y are swapped.
    const result = matchRfqAgainstMachine(
      millingRfq({ requirements: { partSizeXMm: 500, partSizeYMm: 600, partSizeZMm: 100 } }),
      millingMachine(),
      NOW,
    );
    expect(result.reasons.find((r) => r.key === "envelope")?.passed).toBe(true);
  });

  it("rejects unsupported material", () => {
    const result = matchRfqAgainstMachine(
      millingRfq({ materialId: "mat-titanium" }),
      millingMachine(),
      NOW,
    );
    expect(result.compatible).toBe(false);
    expect(result.reasons.find((r) => r.key === "material")?.passed).toBe(false);
  });

  it("rejects a machine with no declared materials rather than assuming compatibility", () => {
    const result = matchRfqAgainstMachine(millingRfq(), millingMachine({ materialIds: [] }), NOW);
    expect(result.compatible).toBe(false);
    expect(result.reasons.find((r) => r.key === "material")?.passed).toBe(false);
  });

  it("excludes a FULL machine even if everything else matches", () => {
    const result = matchRfqAgainstMachine(
      millingRfq(),
      millingMachine({ availability: [{ ...currentWeek, status: "FULL", estimatedHours: null }] }),
      NOW,
    );
    expect(result.compatible).toBe(false);
    expect(result.availabilitySummary).toBe("FULL");
  });

  it("does not assume availability when no data has been published", () => {
    const result = matchRfqAgainstMachine(millingRfq(), millingMachine({ availability: [] }), NOW);
    expect(result.compatible).toBe(false);
    expect(result.availabilitySummary).toBe("UNKNOWN");
  });

  it("ranks AVAILABLE above LIMITED", () => {
    const available = matchRfqAgainstMachine(
      millingRfq(),
      millingMachine({ id: "m-avail", availability: [{ ...currentWeek, status: "AVAILABLE", estimatedHours: 20 }] }),
      NOW,
    );
    const limited = matchRfqAgainstMachine(
      millingRfq(),
      millingMachine({ id: "m-limited", availability: [{ ...currentWeek, status: "LIMITED", estimatedHours: 5 }] }),
      NOW,
    );
    expect(available.score).toBeGreaterThan(limited.score);

    const ranked = matchRfqAgainstMachines(
      millingRfq(),
      [
        millingMachine({ id: "m-limited", availability: [{ ...currentWeek, status: "LIMITED", estimatedHours: 5 }] }),
        millingMachine({ id: "m-avail", availability: [{ ...currentWeek, status: "AVAILABLE", estimatedHours: 20 }] }),
      ],
      NOW,
    );
    expect(ranked[0].machineId).toBe("m-avail");
    expect(ranked[1].machineId).toBe("m-limited");
  });

  it("enforces batch size bounds", () => {
    const tooSmall = matchRfqAgainstMachine(
      millingRfq({ quantity: 5 }),
      millingMachine({ minimumBatchSize: 10, maximumBatchSize: 1000 }),
      NOW,
    );
    expect(tooSmall.compatible).toBe(false);

    const tooLarge = matchRfqAgainstMachine(
      millingRfq({ quantity: 5000 }),
      millingMachine({ minimumBatchSize: 10, maximumBatchSize: 1000 }),
      NOW,
    );
    expect(tooLarge.compatible).toBe(false);

    const withinBounds = matchRfqAgainstMachine(
      millingRfq({ quantity: 50 }),
      millingMachine({ minimumBatchSize: 10, maximumBatchSize: 1000 }),
      NOW,
    );
    expect(withinBounds.compatible).toBe(true);
  });
});

describe("matching engine — turning", () => {
  function turningRfq(overrides: Partial<RfqForMatching> = {}): RfqForMatching {
    return {
      id: "rfq-2",
      companyId: "buyer-1",
      manufacturingProcessId: "proc-turning",
      processCode: CNC_TURNING,
      materialId: "mat-steel",
      quantity: 100,
      requiredDeliveryDate: new Date("2026-09-25T00:00:00Z"),
      requirements: { partDiameterMm: 40, partLengthMm: 150, toleranceMm: 0.02 },
      ...overrides,
    };
  }

  function turningMachine(overrides: Partial<MachineForMatching> = {}): MachineForMatching {
    return {
      id: "machine-2",
      name: "Mazak Quick Turn",
      companyId: "supplier-2",
      companyName: "Turnco d.o.o.",
      manufacturingProcessId: "proc-turning",
      processCode: CNC_TURNING,
      capabilities: {
        maxTurningDiameterMm: 65,
        maxTurningLengthMm: 300,
        barCapacityMm: 51,
        liveTooling: true,
      },
      minimumBatchSize: null,
      maximumBatchSize: null,
      materialIds: ["mat-steel"],
      availability: [{ ...currentWeek, status: "AVAILABLE", estimatedHours: 40 }],
      ...overrides,
    };
  }

  it("matches when diameter and length are within capacity", () => {
    const result = matchRfqAgainstMachine(turningRfq(), turningMachine(), NOW);
    expect(result.compatible).toBe(true);
  });

  it("rejects when part diameter exceeds machine capacity", () => {
    const result = matchRfqAgainstMachine(turningRfq({ requirements: { partDiameterMm: 100 } }), turningMachine(), NOW);
    expect(result.compatible).toBe(false);
    expect(result.reasons.find((r) => r.key === "diameter")?.passed).toBe(false);
  });

  it("rejects when part length exceeds machine capacity", () => {
    const result = matchRfqAgainstMachine(turningRfq({ requirements: { partLengthMm: 500 } }), turningMachine(), NOW);
    expect(result.compatible).toBe(false);
    expect(result.reasons.find((r) => r.key === "length")?.passed).toBe(false);
  });
});
