import { redirect } from "next/navigation";
import { requireCompany } from "@/lib/auth";
import { listMaterials, listProcessFormMeta } from "@/lib/process-meta";
import { NewRfqForm } from "./NewRfqForm";

export default async function NewRfqPage() {
  const { company } = await requireCompany();
  if (company.companyType === "SUPPLIER") redirect("/dashboard");

  const [processes, materials] = await Promise.all([listProcessFormMeta(), listMaterials()]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="page-title">New RFQ</h1>
        <p className="mt-1 text-sm text-slate-500">
          Saved as a draft first — you&apos;ll submit it to run matching once it&apos;s ready.
        </p>
      </div>
      <NewRfqForm processes={processes} materials={materials} />
    </div>
  );
}
