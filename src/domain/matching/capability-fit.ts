import type { MillingCapabilities, MillingRequirements } from "../processes/milling";
import type { TurningCapabilities, TurningRequirements } from "../processes/turning";
import type { MatchReason } from "./types";

/**
 * A requirement that was never specified by the buyer is treated as
 * "not applicable" rather than "assumed compatible": it is reported as a
 * passing, non-gating, informational reason so the score isn't punished
 * for missing optional data, while the UI can still show that nothing was
 * actually verified for that dimension.
 */
function notSpecified(key: string): MatchReason {
  return { key, passed: true, gating: false, detailCode: "notSpecified" };
}

export function evaluateAxisFit(
  capabilities: MillingCapabilities,
  requirements: MillingRequirements,
): MatchReason {
  if (requirements.requiredAxisCount == null) {
    return notSpecified("axis");
  }
  const passed = capabilities.axisCount >= requirements.requiredAxisCount;
  return {
    key: "axis",
    passed,
    gating: true,
    detailCode: passed ? "axisSatisfied" : "axisInsufficient",
    detailParams: { required: requirements.requiredAxisCount, actual: capabilities.axisCount },
  };
}

/**
 * Checks whether a part with the given (partial) envelope fits within the
 * machine's travel, trying every possible assignment of the specified part
 * dimensions to the machine's travel axes — parts can be oriented on the
 * table, so we shouldn't assume X maps to X.
 */
export function evaluatePartEnvelopeFit(
  capabilities: MillingCapabilities,
  requirements: MillingRequirements,
): MatchReason {
  const partDims = [
    requirements.partSizeXMm,
    requirements.partSizeYMm,
    requirements.partSizeZMm,
  ].filter((v): v is number => typeof v === "number");

  if (partDims.length === 0) {
    return notSpecified("envelope");
  }

  const travel = [capabilities.travelXMm, capabilities.travelYMm, capabilities.travelZMm];
  const fits = permutationsFit(partDims, travel);
  const travelStr = travel.join(" x ");

  return {
    key: "envelope",
    passed: fits,
    gating: true,
    detailCode: fits ? "envelopeFits" : "envelopeDoesNotFit",
    detailParams: fits ? { travel: travelStr } : { part: partDims.join(" x "), travel: travelStr },
  };
}

/** True if there exists an ordering of `travel` slots such that every
 * value in `dims` fits (<=) into the corresponding slot. */
function permutationsFit(dims: number[], travel: number[]): boolean {
  const indices = travel.map((_, i) => i);
  return permutations(indices, dims.length).some((combo) =>
    dims.every((d, i) => d <= travel[combo[i]]),
  );
}

function permutations(items: number[], length: number): number[][] {
  if (length === 0) return [[]];
  const result: number[][] = [];
  for (let i = 0; i < items.length; i++) {
    const rest = items.slice(0, i).concat(items.slice(i + 1));
    for (const perm of permutations(rest, length - 1)) {
      result.push([items[i], ...perm]);
    }
  }
  return result;
}

export function evaluateDiameterFit(
  capabilities: TurningCapabilities,
  requirements: TurningRequirements,
): MatchReason {
  if (requirements.partDiameterMm == null) {
    return notSpecified("diameter");
  }
  const passed = capabilities.maxTurningDiameterMm >= requirements.partDiameterMm;
  return {
    key: "diameter",
    passed,
    gating: true,
    detailCode: passed ? "diameterFits" : "diameterExceeds",
    detailParams: { part: requirements.partDiameterMm, max: capabilities.maxTurningDiameterMm },
  };
}

export function evaluateLengthFit(
  capabilities: TurningCapabilities,
  requirements: TurningRequirements,
): MatchReason {
  if (requirements.partLengthMm == null) {
    return notSpecified("length");
  }
  const passed = capabilities.maxTurningLengthMm >= requirements.partLengthMm;
  return {
    key: "length",
    passed,
    gating: true,
    detailCode: passed ? "lengthFits" : "lengthExceeds",
    detailParams: { part: requirements.partLengthMm, max: capabilities.maxTurningLengthMm },
  };
}
