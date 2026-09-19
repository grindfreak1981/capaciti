import { notFound } from "next/navigation";
import { addWeeks, format, startOfISOWeek, type Locale } from "date-fns";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { requireCompany, ForbiddenError } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { processRegistry } from "@/domain/processes/registry";
import { listMaterials } from "@/lib/process-meta";
import { toIsoWeekRef } from "@/domain/matching/weeks";
import { dateFnsLocale } from "@/lib/date-locale";
import { EditMachineForm } from "./EditMachineForm";
import { AvailabilityGrid, type WeekRow } from "@/components/AvailabilityGrid";
import { DeleteButton } from "@/components/DeleteButton";
import { RfqStatusBadge } from "@/components/StatusBadge";
import { deleteMachineAction } from "@/app/actions/machines";

const UPCOMING_WEEKS = 12;

function buildUpcomingWeeks(
  existing: { isoYear: number; isoWeek: number; status: string; estimatedHours: number | null }[],
  weekLabel: (params: { week: number }) => string,
  locale: Locale,
) {
  const start = startOfISOWeek(new Date());
  const byKey = new Map(existing.map((e) => [`${e.isoYear}-${e.isoWeek}`, e]));

  return Array.from({ length: UPCOMING_WEEKS }, (_, i) => {
    const date = addWeeks(start, i);
    const ref = toIsoWeekRef(date);
    const key = `${ref.isoYear}-${ref.isoWeek}`;
    const record = byKey.get(key);
    return {
      isoYear: ref.isoYear,
      isoWeek: ref.isoWeek,
      label: `${weekLabel({ week: ref.isoWeek })} · ${format(date, "MMM d", { locale })}`,
      status: (record?.status as WeekRow["status"]) ?? null,
      estimatedHours: record?.estimatedHours ?? null,
    } satisfies WeekRow;
  });
}

export default async function MachineDetailPage({ params }: { params: { id: string } }) {
  const { user } = await requireCompany();

  const machine = await prisma.machine.findUnique({
    where: { id: params.id },
    include: {
      manufacturingProcess: true,
      materials: true,
      availability: true,
      matches: {
        where: { compatible: true },
        include: { rfq: { include: { company: true } } },
        orderBy: { score: "desc" },
      },
    },
  });
  if (!machine) notFound();
  if (user.role !== "ADMIN" && user.companyId !== machine.companyId) {
    throw new ForbiddenError();
  }

  const [materials, t, tProcesses, locale] = await Promise.all([
    listMaterials(),
    getTranslations("machines"),
    getTranslations("processes"),
    getLocale(),
  ]);
  const processMeta = {
    id: machine.manufacturingProcess.id,
    code: machine.manufacturingProcess.code,
    name: machine.manufacturingProcess.name,
    capabilityFields: processRegistry[machine.manufacturingProcess.code]?.capabilityFields ?? [],
    requirementFields: [],
  };

  const weeks = buildUpcomingWeeks(
    machine.availability,
    (params) => t("weekLabel", params),
    dateFnsLocale(locale),
  );

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">{machine.name}</h1>
          <p className="text-sm text-slate-500">{tProcesses(machine.manufacturingProcess.code)}</p>
        </div>
        <DeleteButton
          action={deleteMachineAction.bind(null, machine.id)}
          confirmMessage={t("deleteConfirm", { name: machine.name })}
        />
      </div>

      <section>
        <h2 className="section-title mb-3">{t("detailsAndCapabilityTitle")}</h2>
        <EditMachineForm
          machineId={machine.id}
          process={processMeta}
          materials={materials}
          machine={machine}
          selectedMaterialIds={machine.materials.map((m) => m.materialId)}
        />
      </section>

      <section>
        <h2 className="section-title mb-3">{t("weeklyAvailabilityTitle")}</h2>
        <div className="card">
          <AvailabilityGrid machineId={machine.id} weeks={weeks} />
        </div>
      </section>

      <section>
        <h2 className="section-title mb-3">{t("matchingRfqsTitle")}</h2>
        {machine.matches.length === 0 ? (
          <div className="card text-sm text-slate-500">{t("noMatchingRfqsYet")}</div>
        ) : (
          <div className="divide-y divide-slate-200 rounded border border-slate-200 bg-white">
            {machine.matches.map((match) => (
              <Link
                key={match.id}
                href={`/rfqs/${match.rfqId}`}
                className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-slate-50"
              >
                <div>
                  <p className="font-semibold text-slate-900">{match.rfq.title}</p>
                  <p className="text-sm text-slate-500">{match.rfq.company.name}</p>
                </div>
                <div className="flex items-center gap-3">
                  <RfqStatusBadge status={match.rfq.status} />
                  <span className="text-lg font-bold text-slate-900">{match.score}%</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
