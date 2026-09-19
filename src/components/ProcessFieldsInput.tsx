"use client";

import { useTranslations } from "next-intl";
import type { FieldSpec } from "@/domain/processes/types";

/** Renders form inputs for a process's capability/requirement fields.
 * Field shape comes entirely from FieldSpec metadata, so a new
 * manufacturing process never needs a new form component. */
export function ProcessFieldsInput({
  fields,
  defaults,
}: {
  fields: FieldSpec[];
  defaults?: Record<string, unknown>;
}) {
  const t = useTranslations("fields");
  return (
    <div className="grid grid-cols-2 gap-4">
      {fields.map((field) => {
        const defaultValue = defaults?.[field.key];
        if (field.type === "boolean") {
          return (
            <label key={field.key} className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                name={field.key}
                defaultChecked={Boolean(defaultValue)}
                className="h-4 w-4 rounded border-slate-300"
              />
              {t(field.key)}
            </label>
          );
        }
        return (
          <div key={field.key}>
            <label className="field-label" htmlFor={field.key}>
              {t(field.key)}
              {field.unit ? ` (${field.unit})` : ""}
              {field.required ? " *" : ""}
            </label>
            <input
              className="field-input"
              id={field.key}
              name={field.key}
              type="number"
              step={field.type === "integer" ? 1 : "any"}
              min={field.min}
              required={field.required}
              defaultValue={typeof defaultValue === "number" ? defaultValue : undefined}
            />
          </div>
        );
      })}
    </div>
  );
}
