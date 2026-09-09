"use client";

import { useFormState } from "react-dom";
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
  materials: { id: string; name: string }[];
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

  return (
    <form action={formAction} className="card space-y-5">
      <FormMessage state={state} />

      <div>
        <label className="field-label" htmlFor="name">Machine name</label>
        <input className="field-input" id="name" name="name" required defaultValue={machine.name} />
        <FieldErrors state={state} name="name" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="field-label" htmlFor="manufacturer">Manufacturer</label>
          <input className="field-input" id="manufacturer" name="manufacturer" defaultValue={machine.manufacturer ?? ""} />
        </div>
        <div>
          <label className="field-label" htmlFor="model">Model</label>
          <input className="field-input" id="model" name="model" defaultValue={machine.model ?? ""} />
        </div>
      </div>

      <div>
        <p className="field-label">Manufacturing process</p>
        <p className="text-sm text-slate-600">{process.name} (fixed after creation)</p>
      </div>

      <div>
        <p className="section-title mb-2">Technical capabilities</p>
        <ProcessFieldsInput
          fields={process.capabilityFields}
          defaults={machine.capabilities as Record<string, unknown>}
        />
      </div>

      <div>
        <p className="section-title mb-2">Supported materials</p>
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
              {m.name}
            </label>
          ))}
        </div>
        <FieldErrors state={state} name="materialIds" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="field-label" htmlFor="minimumBatchSize">Minimum batch size (optional)</label>
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
          <label className="field-label" htmlFor="maximumBatchSize">Maximum batch size (optional)</label>
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
        <label className="field-label" htmlFor="description">Description (optional)</label>
        <textarea className="field-input" id="description" name="description" rows={3} defaultValue={machine.description ?? ""} />
      </div>

      <SubmitButton>Save changes</SubmitButton>
    </form>
  );
}
