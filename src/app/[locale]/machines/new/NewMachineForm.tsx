"use client";

import { useMemo, useState } from "react";
import { useFormState } from "react-dom";
import { useTranslations } from "next-intl";
import { createMachineAction } from "@/app/actions/machines";
import { initialActionState } from "@/lib/action-state";
import { FieldErrors, FormMessage } from "@/components/FormMessage";
import { SubmitButton } from "@/components/SubmitButton";
import { ProcessFieldsInput } from "@/components/ProcessFieldsInput";
import type { ProcessFormMeta } from "@/lib/process-meta";

export function NewMachineForm({
  processes,
  materials,
}: {
  processes: ProcessFormMeta[];
  materials: { id: string; name: string; code: string }[];
}) {
  const [state, formAction] = useFormState(createMachineAction, initialActionState);
  const [processId, setProcessId] = useState(processes[0]?.id ?? "");
  const selectedProcess = useMemo(() => processes.find((p) => p.id === processId), [processId, processes]);
  const t = useTranslations("machines");
  const tProcesses = useTranslations("processes");
  const tMaterials = useTranslations("materials");

  return (
    <form action={formAction} className="card space-y-5">
      <FormMessage state={state} />

      <div>
        <label className="field-label" htmlFor="name">{t("nameLabel")}</label>
        <input className="field-input" id="name" name="name" required placeholder={t("namePlaceholder")} />
        <FieldErrors state={state} name="name" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="field-label" htmlFor="manufacturer">{t("manufacturerLabel")}</label>
          <input className="field-input" id="manufacturer" name="manufacturer" />
        </div>
        <div>
          <label className="field-label" htmlFor="model">{t("modelLabel")}</label>
          <input className="field-input" id="model" name="model" />
        </div>
      </div>

      <div>
        <label className="field-label" htmlFor="manufacturingProcessId">{t("processLabel")}</label>
        <select
          className="field-input"
          id="manufacturingProcessId"
          name="manufacturingProcessId"
          value={processId}
          onChange={(e) => setProcessId(e.target.value)}
        >
          {processes.map((p) => (
            <option key={p.id} value={p.id}>
              {tProcesses(p.code)}
            </option>
          ))}
        </select>
      </div>

      {selectedProcess && (
        <div>
          <p className="section-title mb-2">{t("capabilitiesTitle")}</p>
          <ProcessFieldsInput fields={selectedProcess.capabilityFields} />
        </div>
      )}

      <div>
        <p className="section-title mb-2">{t("materialsTitle")}</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
          {materials.map((m) => (
            <label key={m.id} className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" name="materialIds" value={m.id} className="h-4 w-4 rounded border-slate-300" />
              {tMaterials(m.code)}
            </label>
          ))}
        </div>
        <FieldErrors state={state} name="materialIds" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="field-label" htmlFor="minimumBatchSize">{t("minBatchLabel")}</label>
          <input className="field-input" id="minimumBatchSize" name="minimumBatchSize" type="number" min={1} />
        </div>
        <div>
          <label className="field-label" htmlFor="maximumBatchSize">{t("maxBatchLabel")}</label>
          <input className="field-input" id="maximumBatchSize" name="maximumBatchSize" type="number" min={1} />
        </div>
      </div>

      <div>
        <label className="field-label" htmlFor="description">{t("descriptionLabel")}</label>
        <textarea className="field-input" id="description" name="description" rows={3} />
      </div>

      <SubmitButton>{t("submitAdd")}</SubmitButton>
    </form>
  );
}
