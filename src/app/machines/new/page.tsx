import { redirect } from "next/navigation";
import { requireCompany } from "@/lib/auth";
import { listMaterials, listProcessFormMeta } from "@/lib/process-meta";
import { NewMachineForm } from "./NewMachineForm";

export default async function NewMachinePage() {
  const { company } = await requireCompany();
  if (company.companyType === "BUYER") redirect("/dashboard");

  const [processes, materials] = await Promise.all([listProcessFormMeta(), listMaterials()]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="page-title">Add a machine</h1>
        <p className="mt-1 text-sm text-slate-500">
          Declare its real capability — this is what the matching engine checks RFQs against.
        </p>
      </div>
      <NewMachineForm processes={processes} materials={materials} />
    </div>
  );
}
