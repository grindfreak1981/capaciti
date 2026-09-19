import type { ActionState } from "@/lib/action-state";

export function FieldErrors({ state, name }: { state: ActionState; name: string }) {
  const errors = state.fieldErrors?.[name];
  if (!errors?.length) return null;
  return <p className="field-error">{errors[0]}</p>;
}

export function FormMessage({ state }: { state: ActionState }) {
  if (!state.message) return null;
  return (
    <p className={`rounded border px-3 py-2 text-sm ${state.ok ? "border-green-300 bg-green-50 text-green-800" : "border-red-300 bg-red-50 text-red-800"}`}>
      {state.message}
    </p>
  );
}
