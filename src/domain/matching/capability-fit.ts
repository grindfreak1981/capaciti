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
function notSpecified(key: string, label: string): MatchReason {
  return { key, label, passed: true, gating: false, detail: "Not specified by buyer" };
}

export function evaluateAxisFit(
  capabilities: MillingCapabilities,
  requirements: MillingRequirements,
): MatchReason {
  if (requirements.requiredAxisCount == null) {
    return notSpecified("axis", "Axis requirement");
  }
  const passed = capabilities.axisCount >= requirements.requiredAxisCount;
  return {
    key: "axis",
    label: "Axis requirement",
    passed,
    gating: true,
    detail: passed
      ? `${requirements.requiredAxisCount}-axis requirement satisfied (machine has ${capabilities.axisCount})`
      : `Requires ${requirements.requiredAxisCount} axes, machine only has ${capabilities.axisCount}`,
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
    return notSpecified("envelope", "Part envelope");
  }

  const travel = [capabilities.travelXMm, capabilities.travelYMm, capabilities.travelZMm];
  const fits = permutationsFit(partDims, travel);

  return {
    key: "envelope",
    label: "Part envelope",
    passed: fits,
    gating: true,
    detail: fits
      ? `Part fits within machine travel (${travel.map((t) => t).join(" x ")} mm)`
      : `Part envelope (${partDims.join(" x ")} mm) does not fit machine travel (${travel
          .map((t) => t)
          .join(" x ")} mm) in any orientation`,
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
    return notSpecified("diameter", "Turning diameter");
  }
  const passed = capabilities.maxTurningDiameterMm >= requirements.partDiameterMm;
  return {
    key: "diameter",
    label: "Turning diameter",
    passed,
    gating: true,
    detail: passed
      ? `Part diameter ${requirements.partDiameterMm}mm fits max ${capabilities.maxTurningDiameterMm}mm`
      : `Part diameter ${requirements.partDiameterMm}mm exceeds max ${capabilities.maxTurningDiameterMm}mm`,
  };
}

export function evaluateLengthFit(
  capabilities: TurningCapabilities,
  requirements: TurningRequirements,
): MatchReason {
  if (requirements.partLengthMm == null) {
    return notSpecified("length", "Turning length");
  }
  const passed = capabilities.maxTurningLengthMm >= requirements.partLengthMm;
  return {
    key: "length",
    label: "Turning length",
    passed,
    gating: true,
    detail: passed
      ? `Part length ${requirements.partLengthMm}mm fits max ${capabilities.maxTurningLengthMm}mm`
      : `Part length ${requirements.partLengthMm}mm exceeds max ${capabilities.maxTurningLengthMm}mm`,
  };
}
