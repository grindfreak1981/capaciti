"use client";

import { useMemo, useState } from "react";
import { useFormState } from "react-dom";
import { useTranslations } from "next-intl";
import { createRfqAction } from "@/app/actions/rfqs";
import { initialActionState } from "@/lib/action-state";
import { FieldErrors, FormMessage } from "@/components/FormMessage";
import { SubmitButton } from "@/components/SubmitButton";
import { ProcessFieldsInput } from "@/components/ProcessFieldsInput";
import type { ProcessFormMeta } from "@/lib/process-meta";

export function NewRfqForm({
  processes,
  materials,
}: {
  processes: ProcessFormMeta[];
  materials: { id: string; name: string; code: string }[];
}) {
  const [state, formAction] = useFormState(createRfqAction, initialActionState);
  const [processId, setProcessId] = useState(processes[0]?.id ?? "");
  const selectedProcess = useMemo(() => processes.find((p) => p.id === processId), [processId, processes]);
  const t = useTranslations("rfqs");
  const tProcesses = useTranslations("processes");
  const tMaterials = useTranslations("materials");

  return (
    <form action={formAction} className="card space-y-5" encType="multipart/form-data">
      <FormMessage state={state} />

      <div>
        <label className="field-label" htmlFor="title">{t("titleLabel")}</label>
        <input className="field-input" id="title" name="title" required placeholder={t("titlePlaceholder")} />
        <FieldErrors state={state} name="title" />
      </div>

      <div className="grid grid-cols-2 gap-4">
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
        <div>
          <label className="field-label" htmlFor="materialId">{t("materialLabel")}</label>
          <select className="field-input" id="materialId" name="materialId" required defaultValue="">
            <option value="" disabled>
              {t("selectMaterial")}
            </option>
            {materials.map((m) => (
              <option key={m.id} value={m.id}>
                {tMaterials(m.code)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="field-label" htmlFor="quantity">{t("quantityLabel")}</label>
          <input className="field-input" id="quantity" name="quantity" type="number" min={1} required />
          <FieldErrors state={state} name="quantity" />
        </div>
        <div>
          <label className="field-label" htmlFor="requiredDeliveryDate">{t("requiredDeliveryDateLabel")}</label>
          <input className="field-input" id="requiredDeliveryDate" name="requiredDeliveryDate" type="date" required />
          <FieldErrors state={state} name="requiredDeliveryDate" />
        </div>
      </div>

      {selectedProcess && (
        <div>
          <p className="section-title mb-2">{t("technicalRequirementsTitle")}</p>
          <ProcessFieldsInput fields={selectedProcess.requirementFields} />
        </div>
      )}

      <div>
        <label className="field-label" htmlFor="description">{t("descriptionLabel")}</label>
        <textarea className="field-input" id="description" name="description" rows={3} />
      </div>

      <div>
        <label className="field-label" htmlFor="files">{t("filesLabel")}</label>
        <input className="field-input" id="files" name="files" type="file" multiple accept=".step,.stp,.dxf,.pdf" />
        <p className="mt-1 text-xs text-slate-500">{t("filesHint")}</p>
      </div>

      <SubmitButton>{t("submitCreate")}</SubmitButton>
    </form>
  );
}
