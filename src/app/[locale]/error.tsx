"use client";

import { useTranslations } from "next-intl";

export default function GlobalError() {
  const t = useTranslations("errors");
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <h1 className="page-title">{t("somethingWentWrong")}</h1>
      <p className="mt-2 text-sm text-slate-600">{t("unexpectedError")}</p>
    </div>
  );
}
