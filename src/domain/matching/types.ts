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

export interface MatchReason {
  key: string;
  label: string;
  passed: boolean;
  /** Whether a failure here disqualifies the machine outright. */
  gating: boolean;
  detail?: string;
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
