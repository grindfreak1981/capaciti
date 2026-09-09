import { describe, expect, it } from "vitest";
import { MillingCapabilitiesSchema, MillingRequirementsSchema } from "./milling";
import { TurningCapabilitiesSchema, TurningRequirementsSchema } from "./turning";

describe("milling capability validation", () => {
  it("accepts a complete valid capability set", () => {
    const result = MillingCapabilitiesSchema.safeParse({
      axisCount: 5,
      travelXMm: 650,
      travelYMm: 520,
      travelZMm: 475,
    });
    expect(result.success).toBe(true);
  });

  it("rejects a missing required field", () => {
    const result = MillingCapabilitiesSchema.safeParse({ axisCount: 5, travelXMm: 650, travelYMm: 520 });
    expect(result.success).toBe(false);
  });

  it("rejects zero or negative travel", () => {
    const result = MillingCapabilitiesSchema.safeParse({
      axisCount: 3,
      travelXMm: 0,
      travelYMm: 100,
      travelZMm: 100,
    });
    expect(result.success).toBe(false);
  });

  it("rejects axis count outside plausible range", () => {
    expect(MillingCapabilitiesSchema.safeParse({ axisCount: 1, travelXMm: 1, travelYMm: 1, travelZMm: 1 }).success).toBe(false);
    expect(MillingCapabilitiesSchema.safeParse({ axisCount: 20, travelXMm: 1, travelYMm: 1, travelZMm: 1 }).success).toBe(false);
  });

  it("requirements are all optional — an empty RFQ requirement set is valid", () => {
    expect(MillingRequirementsSchema.safeParse({}).success).toBe(true);
  });

  it("rejects a negative part dimension", () => {
    expect(MillingRequirementsSchema.safeParse({ partSizeXMm: -10 }).success).toBe(false);
  });
});

describe("turning capability validation", () => {
  it("accepts a complete valid capability set", () => {
    const result = TurningCapabilitiesSchema.safeParse({
      maxTurningDiameterMm: 65,
      maxTurningLengthMm: 300,
      barCapacityMm: 51,
      liveTooling: true,
    });
    expect(result.success).toBe(true);
  });

  it("requires liveTooling to be an explicit boolean", () => {
    const result = TurningCapabilitiesSchema.safeParse({
      maxTurningDiameterMm: 65,
      maxTurningLengthMm: 300,
    });
    expect(result.success).toBe(false);
  });

  it("rejects non-positive diameter/length", () => {
    expect(
      TurningCapabilitiesSchema.safeParse({ maxTurningDiameterMm: 0, maxTurningLengthMm: 100, liveTooling: false })
        .success,
    ).toBe(false);
  });

  it("requirements are all optional", () => {
    expect(TurningRequirementsSchema.safeParse({}).success).toBe(true);
  });
});
