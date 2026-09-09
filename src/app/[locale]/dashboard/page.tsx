import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { requireCompany } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toIsoWeekRef } from "@/domain/matching/weeks";
import { AvailabilityBadge, RfqStatusBadge } from "@/components/StatusBadge";

async function SupplierPanel({ companyId }: { companyId: string }) {
  const [machines, t] = await Promise.all([
    prisma.machine.findMany({
      where: { companyId },
      include: {
        availability: true,
        matches: { where: { compatible: true }, include: { rfq: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    getTranslations("dashboard"),
  ]);
  const currentWeek = toIsoWeekRef(new Date());
  const openMatches = machines.flatMap((m) => m.matches.filter((match) => match.rfq.status === "OPEN"));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card">
          <p className="section-title">{t("machinesCard")}</p>
          <p className="mt-1 text-3xl font-bold text-slate-900">{machines.length}</p>
        </div>
        <div className="card">
          <p className="section-title">{t("openMatchingRfqs")}</p>
          <p className="mt-1 text-3xl font-bold text-slate-900">{openMatches.length}</p>
        </div>
        <div className="card">
          <p className="section-title">{t("availableThisWeek")}</p>
          <p className="mt-1 text-3xl font-bold text-slate-900">
            {
              machines.filter((m) =>
                m.availability.some(
                  (a) => a.isoYear === currentWeek.isoYear && a.isoWeek === currentWeek.isoWeek && a.status === "AVAILABLE",
                ),
              ).length
            }
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="section-title">{t("machinesAvailabilityTitle")}</h2>
        <Link href="/machines" className="text-sm underline">
          {t("manageMachines")}
        </Link>
      </div>
      <div className="divide-y divide-slate-200 rounded border border-slate-200 bg-white">
        {machines.length === 0 && <p className="p-5 text-sm text-slate-500">{t("noMachinesYet")}</p>}
        {machines.map((machine) => {
          const current = machine.availability.find(
            (a) => a.isoYear === currentWeek.isoYear && a.isoWeek === currentWeek.isoWeek,
          );
          const openMatchCount = machine.matches.filter((m) => m.rfq.status === "OPEN").length;
          return (
            <Link
              key={machine.id}
              href={`/machines/${machine.id}`}
              className="flex items-center justify-between px-5 py-3 hover:bg-slate-50"
            >
              <span className="font-medium text-slate-800">{machine.name}</span>
              <div className="flex items-center gap-4">
                <span className="text-sm text-slate-500">
                  {t("matchingRfqsCount", { count: openMatchCount })}
                </span>
                <AvailabilityBadge status={current?.status ?? "UNKNOWN"} />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

async function BuyerPanel({ companyId }: { companyId: string }) {
  const [rfqs, t] = await Promise.all([
    prisma.rfq.findMany({
      where: { companyId },
      include: { _count: { select: { matches: { where: { compatible: true } } } } },
      orderBy: { createdAt: "desc" },
    }),
    getTranslations("dashboard"),
  ]);
  const openCount = rfqs.filter((r) => r.status === "OPEN").length;
  const totalMatches = rfqs.reduce((sum, r) => sum + r._count.matches, 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card">
          <p className="section-title">{t("rfqsCard")}</p>
          <p className="mt-1 text-3xl font-bold text-slate-900">{rfqs.length}</p>
        </div>
        <div className="card">
          <p className="section-title">{t("openRfqs")}</p>
          <p className="mt-1 text-3xl font-bold text-slate-900">{openCount}</p>
        </div>
        <div className="card">
          <p className="section-title">{t("compatibleMatchesFound")}</p>
          <p className="mt-1 text-3xl font-bold text-slate-900">{totalMatches}</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="section-title">{t("yourRfqsTitle")}</h2>
        <Link href="/rfqs/new" className="text-sm underline">
          {t("newRfq")}
        </Link>
      </div>
      <div className="divide-y divide-slate-200 rounded border border-slate-200 bg-white">
        {rfqs.length === 0 && <p className="p-5 text-sm text-slate-500">{t("noRfqsYet")}</p>}
        {rfqs.map((rfq) => (
          <Link key={rfq.id} href={`/rfqs/${rfq.id}`} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50">
            <span className="font-medium text-slate-800">{rfq.title}</span>
            <div className="flex items-center gap-4">
              {rfq.status === "OPEN" && (
                <span className="text-sm text-slate-500">{t("matchesCount", { count: rfq._count.matches })}</span>
              )}
              <RfqStatusBadge status={rfq.status} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default async function DashboardPage() {
  const { company } = await requireCompany();

  return (
    <div className="space-y-10">
      <div>
        <h1 className="page-title">{company.name}</h1>
        <p className="text-sm text-slate-500">{company.city}, {company.country}</p>
      </div>

      {(company.companyType === "SUPPLIER" || company.companyType === "BOTH") && (
        <SupplierPanel companyId={company.id} />
      )}
      {(company.companyType === "BUYER" || company.companyType === "BOTH") && (
        <BuyerPanel companyId={company.id} />
      )}
    </div>
  );
}
