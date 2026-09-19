import { z } from "zod";
import { CNC_TURNING } from "./codes";
import type { FieldSpec, ProcessDefinition } from "./types";

export const TurningCapabilitiesSchema = z.object({
  maxTurningDiameterMm: z.number().positive(),
  maxTurningLengthMm: z.number().positive(),
  barCapacityMm: z.number().positive().optional(),
  liveTooling: z.boolean(),
});
export type TurningCapabilities = z.infer<typeof TurningCapabilitiesSchema>;

export const TurningRequirementsSchema = z.object({
  partDiameterMm: z.number().positive().optional(),
  partLengthMm: z.number().positive().optional(),
  toleranceMm: z.number().positive().optional(),
});
export type TurningRequirements = z.infer<typeof TurningRequirementsSchema>;

const capabilityFields: FieldSpec[] = [
  {
    key: "maxTurningDiameterMm",
    label: "Max turning diameter",
    type: "number",
    unit: "mm",
    required: true,
    min: 0,
  },
  {
    key: "maxTurningLengthMm",
    label: "Max turning length",
    type: "number",
    unit: "mm",
    required: true,
    min: 0,
  },
  { key: "barCapacityMm", label: "Bar capacity", type: "number", unit: "mm", min: 0 },
  { key: "liveTooling", label: "Live tooling", type: "boolean" },
];

const requirementFields: FieldSpec[] = [
  { key: "partDiameterMm", label: "Part diameter", type: "number", unit: "mm", min: 0 },
  { key: "partLengthMm", label: "Part length", type: "number", unit: "mm", min: 0 },
  { key: "toleranceMm", label: "Tolerance", type: "number", unit: "mm", min: 0 },
];

export const turningProcessDefinition: ProcessDefinition<
  TurningCapabilities,
  TurningRequirements
> = {
  code: CNC_TURNING,
  label: "CNC Turning",
  capabilitiesSchema: TurningCapabilitiesSchema,
  requirementsSchema: TurningRequirementsSchema,
  capabilityFields,
  requirementFields,
};
