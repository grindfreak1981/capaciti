import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { redirect } from "@/i18n/redirect";
import { requireCompany } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { RfqStatusBadge } from "@/components/StatusBadge";

export default async function RfqsPage() {
  const { company } = await requireCompany();
  if (company.companyType === "SUPPLIER") await redirect("/dashboard");

  const [rfqs, t, tProcesses, tMaterials] = await Promise.all([
    prisma.rfq.findMany({
      where: { companyId: company.id },
      include: {
        manufacturingProcess: true,
        material: true,
        _count: { select: { matches: { where: { compatible: true } } } },
      },
      orderBy: { createdAt: "desc" },
    }),
    getTranslations("rfqs"),
    getTranslations("processes"),
    getTranslations("materials"),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="page-title">{t("title")}</h1>
        <Link href="/rfqs/new" className="btn-primary">
          {t("newRfq")}
        </Link>
      </div>

      {rfqs.length === 0 ? (
        <div className="card text-sm text-slate-500">{t("noRfqsEmpty")}</div>
      ) : (
        <div className="divide-y divide-slate-200 rounded border border-slate-200 bg-white">
          {rfqs.map((rfq) => (
            <Link
              key={rfq.id}
              href={`/rfqs/${rfq.id}`}
              className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-slate-50"
            >
              <div>
                <p className="font-semibold text-slate-900">{rfq.title}</p>
                <p className="text-sm text-slate-500">
                  {tProcesses(rfq.manufacturingProcess.code)} · {tMaterials(rfq.material.code)} ·{" "}
                  {t("quantityAbbrev", { quantity: rfq.quantity })}
                </p>
              </div>
              <div className="flex items-center gap-4">
                {rfq.status === "OPEN" && (
                  <span className="text-sm text-slate-600">{t("matchesCount", { count: rfq._count.matches })}</span>
                )}
                <RfqStatusBadge status={rfq.status} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
