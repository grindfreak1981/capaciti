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
        label: "Availability",
        passed: true,
        gating: true,
        detail:
          hours != null
            ? `Capacity available before deadline (~${hours}h free)`
            : "Capacity available before deadline",
      },
    };
  }

  if (hasLimited) {
    return {
      summary: "LIMITED",
      reason: {
        key: "availability",
        label: "Availability",
        passed: true,
        gating: true,
        detail: "Limited capacity available before deadline",
      },
    };
  }

  if (hasAnyData) {
    return {
      summary: "FULL",
      reason: {
        key: "availability",
        label: "Availability",
        passed: false,
        gating: true,
        detail: "Machine is fully booked for the required period",
      },
    };
  }

  return {
    summary: "UNKNOWN",
    reason: {
      key: "availability",
      label: "Availability",
      passed: false,
      gating: true,
      detail: "Supplier has not published availability for the required period",
    },
  };
}
