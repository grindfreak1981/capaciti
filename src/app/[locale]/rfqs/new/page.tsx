import { getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/redirect";
import { requireCompany } from "@/lib/auth";
import { listMaterials, listProcessFormMeta } from "@/lib/process-meta";
import { NewRfqForm } from "./NewRfqForm";

export default async function NewRfqPage() {
  const { company } = await requireCompany();
  if (company.companyType === "SUPPLIER") await redirect("/dashboard");

  const [processes, materials, t] = await Promise.all([
    listProcessFormMeta(),
    listMaterials(),
    getTranslations("rfqs"),
  ]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="page-title">{t("newRfqTitle")}</h1>
        <p className="mt-1 text-sm text-slate-500">{t("newRfqSubtitle")}</p>
      </div>
      <NewRfqForm processes={processes} materials={materials} />
    </div>
  );
}
