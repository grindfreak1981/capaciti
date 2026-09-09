import { getProcessDefinition } from "../processes/registry";
import { CNC_MILLING, CNC_TURNING } from "../processes/codes";
import type { MillingCapabilities, MillingRequirements } from "../processes/milling";
import type { TurningCapabilities, TurningRequirements } from "../processes/turning";
import {
  evaluateAxisFit,
  evaluateDiameterFit,
  evaluateLengthFit,
  evaluatePartEnvelopeFit,
} from "./capability-fit";
import { evaluateAvailabilityFit } from "./availability-fit";
import type { MachineForMatching, MachineMatchResult, MatchReason, RfqForMatching } from "./types";

// Scoring weights. They sum to 100 when every applicable check passes with
// the best possible availability outcome. Kept as named constants so the
// scoring model is easy to reason about and to unit test.
const WEIGHTS = {
  material: 20,
  primaryDimension: 15, // axis count (milling) / diameter (turning)
  secondaryDimension: 15, // part envelope (milling) / length (turning)
  batchSize: 10,
  availabilityAvailable: 40,
  availabilityLimited: 24, // 60% of the full availability weight
};

function evaluateProcessMatch(rfq: RfqForMatching, machine: MachineForMatching): MatchReason {
  const passed = rfq.processCode === machine.processCode;
  return {
    key: "process",
    passed,
    gating: true,
    detailCode: passed ? "processSupported" : "processMismatch",
    detailParams: passed
      ? { process: machine.processCode }
      : { machineProcess: machine.processCode, rfqProcess: rfq.processCode },
  };
}

function evaluateMaterialMatch(rfq: RfqForMatching, machine: MachineForMatching): MatchReason {
  if (machine.materialIds.length === 0) {
    return {
      key: "material",
      passed: false,
      gating: true,
      detailCode: "materialNoneDeclared",
    };
  }
  const passed = machine.materialIds.includes(rfq.materialId);
  return {
    key: "material",
    passed,
    gating: true,
    detailCode: passed ? "materialSupported" : "materialNotSupported",
  };
}

function evaluateBatchSize(rfq: RfqForMatching, machine: MachineForMatching): MatchReason {
  const { minimumBatchSize, maximumBatchSize } = machine;
  if (minimumBatchSize == null && maximumBatchSize == null) {
    return {
      key: "batch",
      passed: true,
      gating: false,
      detailCode: "batchNoRestriction",
    };
  }
  if (minimumBatchSize != null && rfq.quantity < minimumBatchSize) {
    return {
      key: "batch",
      passed: false,
      gating: true,
      detailCode: "batchBelowMinimum",
      detailParams: { quantity: rfq.quantity, minimum: minimumBatchSize },
    };
  }
  if (maximumBatchSize != null && rfq.quantity > maximumBatchSize) {
    return {
      key: "batch",
      passed: false,
      gating: true,
      detailCode: "batchAboveMaximum",
      detailParams: { quantity: rfq.quantity, maximum: maximumBatchSize },
    };
  }
  return {
    key: "batch",
    passed: true,
    gating: false,
    detailCode: "batchWithinRange",
    detailParams: { quantity: rfq.quantity },
  };
}

interface DimensionalReasons {
  primary: MatchReason;
  secondary: MatchReason;
}

function evaluateDimensionalFit(rfq: RfqForMatching, machine: MachineForMatching): DimensionalReasons {
  const def = getProcessDefinition(rfq.processCode);
  const requirements = def.requirementsSchema.parse(rfq.requirements);
  const capabilities = def.capabilitiesSchema.parse(machine.capabilities);

  if (rfq.processCode === CNC_MILLING) {
    return {
      primary: evaluateAxisFit(capabilities as MillingCapabilities, requirements as MillingRequirements),
      secondary: evaluatePartEnvelopeFit(
        capabilities as MillingCapabilities,
        requirements as MillingRequirements,
      ),
    };
  }
  if (rfq.processCode === CNC_TURNING) {
    return {
      primary: evaluateDiameterFit(capabilities as TurningCapabilities, requirements as TurningRequirements),
      secondary: evaluateLengthFit(capabilities as TurningCapabilities, requirements as TurningRequirements),
    };
  }
  throw new Error(`No dimensional fit evaluator registered for process ${rfq.processCode}`);
}

export function matchRfqAgainstMachine(
  rfq: RfqForMatching,
  machine: MachineForMatching,
  now: Date = new Date(),
): MachineMatchResult {
  const processReason = evaluateProcessMatch(rfq, machine);

  // If the process doesn't match, none of the process-specific schemas
  // apply — short-circuit rather than trying to parse incompatible shapes.
  if (!processReason.passed) {
    return {
      machineId: machine.id,
      machineName: machine.name,
      companyId: machine.companyId,
      companyName: machine.companyName,
      compatible: false,
      score: 0,
      availabilitySummary: "UNKNOWN",
      reasons: [processReason],
    };
  }

  const materialReason = evaluateMaterialMatch(rfq, machine);
  const batchReason = evaluateBatchSize(rfq, machine);
  const { primary, secondary } = evaluateDimensionalFit(rfq, machine);
  const availability = evaluateAvailabilityFit(now, rfq.requiredDeliveryDate, machine.availability);

  const reasons: MatchReason[] = [
    processReason,
    materialReason,
    primary,
    secondary,
    batchReason,
    availability.reason,
  ];

  const compatible = reasons.every((r) => !r.gating || r.passed);

  let score = 0;
  if (materialReason.passed) score += WEIGHTS.material;
  if (primary.passed) score += WEIGHTS.primaryDimension;
  if (secondary.passed) score += WEIGHTS.secondaryDimension;
  if (batchReason.passed) score += WEIGHTS.batchSize;
  if (availability.summary === "AVAILABLE") score += WEIGHTS.availabilityAvailable;
  else if (availability.summary === "LIMITED") score += WEIGHTS.availabilityLimited;

  return {
    machineId: machine.id,
    machineName: machine.name,
    companyId: machine.companyId,
    companyName: machine.companyName,
    compatible,
    score: Math.round(score),
    availabilitySummary: availability.summary,
    reasons,
  };
}

/** Matches an RFQ against a set of candidate machines and returns results
 * ranked by score (compatible machines first, highest score first). */
export function matchRfqAgainstMachines(
  rfq: RfqForMatching,
  machines: MachineForMatching[],
  now: Date = new Date(),
): MachineMatchResult[] {
  return machines
    .map((machine) => matchRfqAgainstMachine(rfq, machine, now))
    .sort((a, b) => {
      if (a.compatible !== b.compatible) return a.compatible ? -1 : 1;
      return b.score - a.score;
    });
}
