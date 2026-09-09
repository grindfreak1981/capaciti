"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";

export function DeleteButton({
  action,
  confirmMessage,
  label,
}: {
  action: () => Promise<unknown>;
  confirmMessage: string;
  label?: string;
}) {
  const [pending, startTransition] = useTransition();
  const t = useTranslations("common");

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
      {pending ? t("deleting") : (label ?? t("delete"))}
    </button>
  );
}
