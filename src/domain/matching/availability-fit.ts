import { enumerateIsoWeeks, isoWeekKey } from "./weeks";
import type { AvailabilitySummary, MachineAvailabilityWindow, MatchReason } from "./types";

export interface AvailabilityEvaluation {
  summary: AvailabilitySummary;
  reason: MatchReason;
}

/**
 * Evaluates machine capacity against the RFQ's required delivery window.
 *
 * FULL weeks never produce a positive match, and a week with no recorded
 * availability is treated as unknown — never silently assumed available.
 * If any week in the window is AVAILABLE that's the best outcome; failing
 * that, any LIMITED week still allows a (lower-ranked) match; otherwise the
 * machine is excluded.
 */
export function evaluateAvailabilityFit(
  now: Date,
  requiredDeliveryDate: Date,
  availability: MachineAvailabilityWindow[],
): AvailabilityEvaluation {
  const window = enumerateIsoWeeks(now, requiredDeliveryDate);
  const byWeek = new Map(availability.map((a) => [isoWeekKey(a), a]));

  const relevant = window.map((w) => byWeek.get(isoWeekKey(w)) ?? null);

  const hasAvailable = relevant.some((a) => a?.status === "AVAILABLE");
  const hasLimited = relevant.some((a) => a?.status === "LIMITED");
  const hasAnyData = relevant.some((a) => a != null);

  if (hasAvailable) {
    const hours = relevant.find((a) => a?.status === "AVAILABLE")?.estimatedHours;
    return {
      summary: "AVAILABLE",
      reason: {
        key: "availability",
        passed: true,
        gating: true,
        detailCode: hours != null ? "availableWithHours" : "availableNoHours",
        detailParams: hours != null ? { hours } : undefined,
      },
    };
  }

  if (hasLimited) {
    return {
      summary: "LIMITED",
      reason: {
        key: "availability",
        passed: true,
        gating: true,
        detailCode: "limitedAvailability",
      },
    };
  }

  if (hasAnyData) {
    return {
      summary: "FULL",
      reason: {
        key: "availability",
        passed: false,
        gating: true,
        detailCode: "fullyBooked",
      },
    };
  }

  return {
    summary: "UNKNOWN",
    reason: {
      key: "availability",
      passed: false,
      gating: true,
      detailCode: "noAvailabilityPublished",
    },
  };
}
