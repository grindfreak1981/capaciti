"use client";

import { useTransition } from "react";

export function DeleteButton({
  action,
  confirmMessage,
  label = "Delete",
}: {
  action: () => Promise<unknown>;
  confirmMessage: string;
  label?: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      className="btn-danger"
      disabled={pending}
      onClick={() => {
        if (!window.confirm(confirmMessage)) return;
        startTransition(() => {
          void action();
        });
      }}
    >
      {pending ? "Deleting…" : label}
    </button>
  );
}
