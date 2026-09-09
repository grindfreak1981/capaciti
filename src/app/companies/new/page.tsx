import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { CompanyForm } from "./CompanyForm";

export default async function NewCompanyPage() {
  const user = await requireUser();
  if (user.companyId) redirect("/dashboard");

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="page-title">Set up your company</h1>
        <p className="mt-1 text-sm text-slate-500">
          This profile is shown to counterparties on matches and RFQs.
        </p>
      </div>
      <CompanyForm userRole={user.role} />
    </div>
  );
}
