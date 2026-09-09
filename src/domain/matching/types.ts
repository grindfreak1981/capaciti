export type AvailabilityStatusValue = "AVAILABLE" | "LIMITED" | "FULL";

export interface MachineAvailabilityWindow {
  isoYear: number;
  isoWeek: number;
  status: AvailabilityStatusValue;
  estimatedHours: number | null;
}

export interface MachineForMatching {
  id: string;
  name: string;
  companyId: string;
  companyName: string;
  manufacturingProcessId: string;
  processCode: string;
  capabilities: unknown;
  minimumBatchSize: number | null;
  maximumBatchSize: number | null;
  materialIds: string[];
  availability: MachineAvailabilityWindow[];
}

export interface RfqForMatching {
  id: string;
  companyId: string;
  manufacturingProcessId: string;
  processCode: string;
  materialId: string;
  quantity: number;
  requiredDeliveryDate: Date;
  requirements: unknown;
}

/**
 * Reasons are stored (and persisted to the DB) as translation keys plus
 * interpolation params rather than rendered English text, so the same
 * MatchResult can be displayed in any supported UI language.
 */
export interface MatchReason {
  key: string;
  passed: boolean;
  /** Whether a failure here disqualifies the machine outright. */
  gating: boolean;
  detailCode: string;
  detailParams?: Record<string, string | number>;
}

export type AvailabilitySummary = "AVAILABLE" | "LIMITED" | "FULL" | "UNKNOWN";

export interface MachineMatchResult {
  machineId: string;
  machineName: string;
  companyId: string;
  companyName: string;
  compatible: boolean;
  score: number;
  availabilitySummary: AvailabilitySummary;
  reasons: MatchReason[];
}
