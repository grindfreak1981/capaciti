import { millingProcessDefinition } from "./milling";
import { turningProcessDefinition } from "./turning";
import type { ProcessDefinition } from "./types";

/** Registry of process-specific schemas, keyed by ManufacturingProcess.code.
 * This is the single place that knows about concrete processes; everything
 * else (Prisma schema, matching engine, generic form renderer) works off
 * ProcessDefinition without a CNC-specific assumption baked in. */
export const processRegistry: Record<string, ProcessDefinition<unknown, unknown>> = {
  [millingProcessDefinition.code]: millingProcessDefinition,
  [turningProcessDefinition.code]: turningProcessDefinition,
};

export function getProcessDefinition(code: string): ProcessDefinition<unknown, unknown> {
  const def = processRegistry[code];
  if (!def) {
    throw new Error(`Unknown manufacturing process code: ${code}`);
  }
  return def;
}

export function validateCapabilities(code: string, data: unknown) {
  return getProcessDefinition(code).capabilitiesSchema.parse(data);
}

export function validateRequirements(code: string, data: unknown) {
  return getProcessDefinition(code).requirementsSchema.parse(data);
}

export { millingProcessDefinition, turningProcessDefinition };
export * from "./codes";
export * from "./types";
export * from "./milling";
export * from "./turning";
