"use client";

import { useFormStatus } from "react-dom";
import { useTranslations } from "next-intl";

export function SubmitButton({
  children,
  className = "btn-primary",
  pendingLabel,
}: {
  children: React.ReactNode;
  className?: string;
  pendingLabel?: string;
}) {
  const { pending } = useFormStatus();
  const t = useTranslations("common");
  return (
    <button type="submit" className={className} disabled={pending}>
      {pending ? (pendingLabel ?? t("saving")) : children}
    </button>
  );
}
