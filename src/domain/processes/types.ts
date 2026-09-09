import { z } from "zod";

/** Metadata describing a single capability/requirement field, used to drive
 * generic form rendering without hardcoding per-process UI. */
export interface FieldSpec {
  key: string;
  label: string;
  type: "integer" | "number" | "boolean";
  unit?: string;
  required?: boolean;
  min?: number;
}

export interface ProcessDefinition<
  Capabilities = Record<string, unknown>,
  Requirements = Record<string, unknown>,
> {
  code: string;
  label: string;
  capabilitiesSchema: z.ZodType<Capabilities>;
  requirementsSchema: z.ZodType<Requirements>;
  capabilityFields: FieldSpec[];
  requirementFields: FieldSpec[];
}
