import { getTranslations } from "next-intl/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const COMPANY_TYPE_KEYS: Record<string, string> = {
  BUYER: "companyTypeBuyer",
  SUPPLIER: "companyTypeSupplier",
  BOTH: "companyTypeBoth",
};

export default async function AdminCompaniesPage() {
  await requireAdmin();
  const [companies, t, tCommon] = await Promise.all([
    prisma.company.findMany({
      include: { _count: { select: { users: true, machines: true, rfqs: true } } },
      orderBy: { createdAt: "desc" },
    }),
    getTranslations("admin"),
    getTranslations("common"),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="page-title">{t("companiesTitle")}</h1>
      <div className="overflow-x-auto rounded border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-4 py-2">{t("nameColumn")}</th>
              <th className="px-4 py-2">{t("typeColumn")}</th>
              <th className="px-4 py-2">{t("locationColumn")}</th>
              <th className="px-4 py-2">{t("usersColumn")}</th>
              <th className="px-4 py-2">{t("machinesColumn")}</th>
              <th className="px-4 py-2">{t("rfqsColumn")}</th>
            </tr>
          </thead>
          <tbody>
            {companies.map((c) => (
              <tr key={c.id} className="border-t border-slate-100">
                <td className="px-4 py-2 font-medium text-slate-800">{c.name}</td>
                <td className="px-4 py-2">{tCommon(COMPANY_TYPE_KEYS[c.companyType] ?? "companyTypeBoth")}</td>
                <td className="px-4 py-2">{c.city}, {c.country}</td>
                <td className="px-4 py-2">{c._count.users}</td>
                <td className="px-4 py-2">{c._count.machines}</td>
                <td className="px-4 py-2">{c._count.rfqs}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
