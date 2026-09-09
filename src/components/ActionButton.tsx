"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ActionState } from "@/lib/action-state";

export function ActionButton({
  action,
  label,
  pendingLabel,
  className = "btn-primary",
  confirmMessage,
}: {
  action: () => Promise<ActionState>;
  label: string;
  pendingLabel?: string;
  className?: string;
  confirmMessage?: string;
}) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<ActionState | null>(null);
  const router = useRouter();

  return (
    <div className="space-y-2">
      <button
        type="button"
        className={className}
        disabled={pending}
        onClick={() => {
          if (confirmMessage && !window.confirm(confirmMessage)) return;
          startTransition(async () => {
            const res = await action();
            setResult(res);
            if (res.ok) router.refresh();
          });
        }}
      >
        {pending ? (pendingLabel ?? "Working…") : label}
      </button>
      {result?.message && (
        <p className={`text-sm ${result.ok ? "text-green-700" : "text-red-700"}`}>{result.message}</p>
      )}
    </div>
  );
}
