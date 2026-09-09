import { getTranslations } from "next-intl/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { RfqStatusBadge } from "@/components/StatusBadge";

export default async function AdminRfqsPage() {
  await requireAdmin();
  const [rfqs, t, tProcesses] = await Promise.all([
    prisma.rfq.findMany({
      include: {
        company: true,
        manufacturingProcess: true,
        _count: { select: { matches: { where: { compatible: true } } } },
      },
      orderBy: { createdAt: "desc" },
    }),
    getTranslations("admin"),
    getTranslations("processes"),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="page-title">{t("rfqsTitle")}</h1>
      <div className="overflow-x-auto rounded border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-4 py-2">{t("titleColumn")}</th>
              <th className="px-4 py-2">{t("buyerColumn")}</th>
              <th className="px-4 py-2">{t("processColumn")}</th>
              <th className="px-4 py-2">{t("statusColumn")}</th>
              <th className="px-4 py-2">{t("matchesColumn")}</th>
            </tr>
          </thead>
          <tbody>
            {rfqs.map((rfq) => (
              <tr key={rfq.id} className="border-t border-slate-100">
                <td className="px-4 py-2 font-medium text-slate-800">{rfq.title}</td>
                <td className="px-4 py-2">{rfq.company.name}</td>
                <td className="px-4 py-2">{tProcesses(rfq.manufacturingProcess.code)}</td>
                <td className="px-4 py-2">
                  <RfqStatusBadge status={rfq.status} />
                </td>
                <td className="px-4 py-2">{rfq._count.matches}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
