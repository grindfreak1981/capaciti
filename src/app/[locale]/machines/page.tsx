import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { redirect } from "@/i18n/redirect";
import { requireCompany } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toIsoWeekRef } from "@/domain/matching/weeks";
import { AvailabilityBadge } from "@/components/StatusBadge";

export default async function MachinesPage() {
  const { company } = await requireCompany();
  if (company.companyType === "BUYER") await redirect("/dashboard");

  const [machines, t, tProcesses] = await Promise.all([
    prisma.machine.findMany({
      where: { companyId: company.id },
      include: { manufacturingProcess: true, availability: true },
      orderBy: { createdAt: "desc" },
    }),
    getTranslations("machines"),
    getTranslations("processes"),
  ]);

  const currentWeek = toIsoWeekRef(new Date());

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="page-title">{t("title")}</h1>
        <Link href="/machines/new" className="btn-primary">
          {t("addMachine")}
        </Link>
      </div>

      {machines.length === 0 ? (
        <div className="card text-sm text-slate-500">{t("noMachinesEmpty")}</div>
      ) : (
        <div className="divide-y divide-slate-200 rounded border border-slate-200 bg-white">
          {machines.map((machine) => {
            const currentAvailability = machine.availability.find(
              (a) => a.isoYear === currentWeek.isoYear && a.isoWeek === currentWeek.isoWeek,
            );
            return (
              <Link
                key={machine.id}
                href={`/machines/${machine.id}`}
                className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-slate-50"
              >
                <div>
                  <p className="font-semibold text-slate-900">{machine.name}</p>
                  <p className="text-sm text-slate-500">
                    {machine.manufacturer} {machine.model} · {tProcesses(machine.manufacturingProcess.code)}
                  </p>
                </div>
                <AvailabilityBadge status={currentAvailability?.status ?? "UNKNOWN"} />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
