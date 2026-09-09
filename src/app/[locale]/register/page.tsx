import { getTranslations } from "next-intl/server";
import { RegisterForm } from "./RegisterForm";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: { role?: string };
}) {
  const defaultRole = searchParams.role === "SUPPLIER" ? "SUPPLIER" : "BUYER";
  const t = await getTranslations("auth");

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div>
        <h1 className="page-title">{t("registerTitle")}</h1>
        <p className="mt-1 text-sm text-slate-500">{t("registerSubtitle")}</p>
      </div>
      <RegisterForm defaultRole={defaultRole} />
    </div>
  );
}
