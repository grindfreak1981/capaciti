import type { FieldSpec } from "@/domain/processes/types";

/** Reads process-specific capability/requirement fields out of a FormData
 * according to their FieldSpec, coercing to the right JS type. Used for
 * both machine capabilities and RFQ requirements so a new process only
 * needs a new FieldSpec list, never a new form-parsing code path. */
export function readFieldsFromFormData(
  fields: FieldSpec[],
  formData: FormData,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const field of fields) {
    const raw = formData.get(field.key);
    if (field.type === "boolean") {
      result[field.key] = raw === "on" || raw === "true";
      continue;
    }
    if (raw == null || raw === "") {
      continue; // leave optional fields absent rather than forcing 0/NaN
    }
    const num = Number(raw);
    if (!Number.isNaN(num)) {
      result[field.key] = num;
    }
  }
  return result;
}
