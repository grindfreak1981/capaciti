import { getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/redirect";
import { requireCompany } from "@/lib/auth";
import { listMaterials, listProcessFormMeta } from "@/lib/process-meta";
import { NewMachineForm } from "./NewMachineForm";

export default async function NewMachinePage() {
  const { company } = await requireCompany();
  if (company.companyType === "BUYER") await redirect("/dashboard");

  const [processes, materials, t] = await Promise.all([
    listProcessFormMeta(),
    listMaterials(),
    getTranslations("machines"),
  ]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="page-title">{t("addMachineTitle")}</h1>
        <p className="mt-1 text-sm text-slate-500">{t("addMachineSubtitle")}</p>
      </div>
      <NewMachineForm processes={processes} materials={materials} />
    </div>
  );
}
