import { z } from "zod";
import { CNC_MILLING } from "./codes";
import type { FieldSpec, ProcessDefinition } from "./types";

export const MillingCapabilitiesSchema = z.object({
  axisCount: z.number().int().min(2).max(12),
  travelXMm: z.number().positive(),
  travelYMm: z.number().positive(),
  travelZMm: z.number().positive(),
});
export type MillingCapabilities = z.infer<typeof MillingCapabilitiesSchema>;

export const MillingRequirementsSchema = z.object({
  requiredAxisCount: z.number().int().min(2).max(12).optional(),
  partSizeXMm: z.number().positive().optional(),
  partSizeYMm: z.number().positive().optional(),
  partSizeZMm: z.number().positive().optional(),
  toleranceMm: z.number().positive().optional(),
});
export type MillingRequirements = z.infer<typeof MillingRequirementsSchema>;

const capabilityFields: FieldSpec[] = [
  { key: "axisCount", label: "Axis count", type: "integer", required: true, min: 2 },
  { key: "travelXMm", label: "Travel X", type: "number", unit: "mm", required: true, min: 0 },
  { key: "travelYMm", label: "Travel Y", type: "number", unit: "mm", required: true, min: 0 },
  { key: "travelZMm", label: "Travel Z", type: "number", unit: "mm", required: true, min: 0 },
];

const requirementFields: FieldSpec[] = [
  { key: "requiredAxisCount", label: "Required axis count", type: "integer", min: 2 },
  { key: "partSizeXMm", label: "Part size X", type: "number", unit: "mm", min: 0 },
  { key: "partSizeYMm", label: "Part size Y", type: "number", unit: "mm", min: 0 },
  { key: "partSizeZMm", label: "Part size Z", type: "number", unit: "mm", min: 0 },
  { key: "toleranceMm", label: "Tolerance", type: "number", unit: "mm", min: 0 },
];

export const millingProcessDefinition: ProcessDefinition<
  MillingCapabilities,
  MillingRequirements
> = {
  code: CNC_MILLING,
  label: "CNC Milling",
  capabilitiesSchema: MillingCapabilitiesSchema,
  requirementsSchema: MillingRequirementsSchema,
  capabilityFields,
  requirementFields,
};
