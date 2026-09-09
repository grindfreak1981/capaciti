import { getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/redirect";
import { requireUser } from "@/lib/auth";
import { CompanyForm } from "./CompanyForm";

export default async function NewCompanyPage() {
  const user = await requireUser();
  if (user.companyId) await redirect("/dashboard");
  const t = await getTranslations("company");

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="page-title">{t("setupTitle")}</h1>
        <p className="mt-1 text-sm text-slate-500">{t("setupSubtitle")}</p>
      </div>
      <CompanyForm userRole={user.role} />
    </div>
  );
}
