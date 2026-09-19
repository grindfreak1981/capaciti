"use client";

import { useFormState } from "react-dom";
import { useTranslations } from "next-intl";
import { updateMachineAction } from "@/app/actions/machines";
import { initialActionState } from "@/lib/action-state";
import { FieldErrors, FormMessage } from "@/components/FormMessage";
import { SubmitButton } from "@/components/SubmitButton";
import { ProcessFieldsInput } from "@/components/ProcessFieldsInput";
import type { ProcessFormMeta } from "@/lib/process-meta";

export function EditMachineForm({
  machineId,
  process,
  materials,
  machine,
  selectedMaterialIds,
}: {
  machineId: string;
  process: ProcessFormMeta;
  materials: { id: string; name: string; code: string }[];
  machine: {
    name: string;
    manufacturer: string | null;
    model: string | null;
    description: string | null;
    capabilities: unknown;
    minimumBatchSize: number | null;
    maximumBatchSize: number | null;
  };
  selectedMaterialIds: string[];
}) {
  const boundAction = updateMachineAction.bind(null, machineId);
  const [state, formAction] = useFormState(boundAction, initialActionState);
  const t = useTranslations("machines");
  const tProcesses = useTranslations("processes");
  const tMaterials = useTranslations("materials");

  return (
    <form action={formAction} className="card space-y-5">
      <FormMessage state={state} />

      <div>
        <label className="field-label" htmlFor="name">{t("nameLabel")}</label>
        <input className="field-input" id="name" name="name" required defaultValue={machine.name} />
        <FieldErrors state={state} name="name" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="field-label" htmlFor="manufacturer">{t("manufacturerLabel")}</label>
          <input className="field-input" id="manufacturer" name="manufacturer" defaultValue={machine.manufacturer ?? ""} />
        </div>
        <div>
          <label className="field-label" htmlFor="model">{t("modelLabel")}</label>
          <input className="field-input" id="model" name="model" defaultValue={machine.model ?? ""} />
        </div>
      </div>

      <div>
        <p className="field-label">{t("processLabel")}</p>
        <p className="text-sm text-slate-600">{t("processFixedAfterCreation", { process: tProcesses(process.code) })}</p>
      </div>

      <div>
        <p className="section-title mb-2">{t("capabilitiesTitle")}</p>
        <ProcessFieldsInput
          fields={process.capabilityFields}
          defaults={machine.capabilities as Record<string, unknown>}
        />
      </div>

      <div>
        <p className="section-title mb-2">{t("materialsTitle")}</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
          {materials.map((m) => (
            <label key={m.id} className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                name="materialIds"
                value={m.id}
                defaultChecked={selectedMaterialIds.includes(m.id)}
                className="h-4 w-4 rounded border-slate-300"
              />
              {tMaterials(m.code)}
            </label>
          ))}
        </div>
        <FieldErrors state={state} name="materialIds" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="field-label" htmlFor="minimumBatchSize">{t("minBatchLabel")}</label>
          <input
            className="field-input"
            id="minimumBatchSize"
            name="minimumBatchSize"
            type="number"
            min={1}
            defaultValue={machine.minimumBatchSize ?? undefined}
          />
        </div>
        <div>
          <label className="field-label" htmlFor="maximumBatchSize">{t("maxBatchLabel")}</label>
          <input
            className="field-input"
            id="maximumBatchSize"
            name="maximumBatchSize"
            type="number"
            min={1}
            defaultValue={machine.maximumBatchSize ?? undefined}
          />
        </div>
      </div>

      <div>
        <label className="field-label" htmlFor="description">{t("descriptionLabel")}</label>
        <textarea className="field-input" id="description" name="description" rows={3} defaultValue={machine.description ?? ""} />
      </div>

      <SubmitButton>{t("submitSave")}</SubmitButton>
    </form>
  );
}
