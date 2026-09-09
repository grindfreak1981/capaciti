import { notFound } from "next/navigation";
import { format } from "date-fns";
import { getLocale, getTranslations } from "next-intl/server";
import { requireCompany, ForbiddenError } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { processRegistry } from "@/domain/processes/registry";
import { dateFnsLocale } from "@/lib/date-locale";
import { RfqStatusBadge } from "@/components/StatusBadge";
import { MatchResultCard } from "@/components/MatchResultCard";
import { ActionButton } from "@/components/ActionButton";
import { submitRfqAction, cancelRfqAction, rerunMatchingAction } from "@/app/actions/rfqs";
import type { MatchReason } from "@/domain/matching/types";

export default async function RfqDetailPage({ params }: { params: { id: string } }) {
  const { user } = await requireCompany();

  const rfq = await prisma.rfq.findUnique({
    where: { id: params.id },
    include: {
      company: true,
      manufacturingProcess: true,
      material: true,
      files: true,
      matches: {
        include: { machine: { include: { company: true } } },
        orderBy: [{ compatible: "desc" }, { score: "desc" }],
      },
    },
  });
  if (!rfq) notFound();
  if (user.role !== "ADMIN" && user.companyId !== rfq.companyId) {
    throw new ForbiddenError();
  }

  const [t, tFields, tProcesses, tMaterials, locale] = await Promise.all([
    getTranslations("rfqs"),
    getTranslations("fields"),
    getTranslations("processes"),
    getTranslations("materials"),
    getLocale(),
  ]);

  const requirementFields = processRegistry[rfq.manufacturingProcess.code]?.requirementFields ?? [];
  const requirements = rfq.requirements as Record<string, unknown>;

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="page-title">{rfq.title}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {tProcesses(rfq.manufacturingProcess.code)} · {tMaterials(rfq.material.code)} ·{" "}
            {t("quantityAbbrev", { quantity: rfq.quantity })} ·{" "}
            {t("dueDate", { date: format(rfq.requiredDeliveryDate, "d MMM yyyy", { locale: dateFnsLocale(locale) }) })}
          </p>
        </div>
        <RfqStatusBadge status={rfq.status} />
      </div>

      <section className="card space-y-3">
        <h2 className="section-title">{t("requirementsTitle")}</h2>
        {rfq.description && <p className="text-sm text-slate-700">{rfq.description}</p>}
        <dl className="grid grid-cols-2 gap-2 text-sm">
          {requirementFields.map((field) => {
            const value = requirements[field.key];
            if (value == null || value === "") return null;
            return (
              <div key={field.key} className="flex justify-between border-b border-slate-100 py-1">
                <dt className="text-slate-500">{tFields(field.key)}</dt>
                <dd className="font-medium text-slate-800">
                  {String(value)} {field.unit ?? ""}
                </dd>
              </div>
            );
          })}
        </dl>
      </section>

      <section className="card space-y-2">
        <h2 className="section-title">{t("technicalFilesTitle")}</h2>
        {rfq.files.length === 0 ? (
          <p className="text-sm text-slate-500">{t("noFilesUploaded")}</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {rfq.files.map((file) => (
              <li key={file.id}>
                <a
                  href={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/files/${file.id}`}
                  className="text-slate-800 underline hover:text-slate-950"
                >
                  {file.originalName}
                </a>{" "}
                <span className="text-slate-400">{t("fileSize", { size: Math.ceil(file.sizeBytes / 1024) })}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-wrap items-center gap-3">
        {rfq.status === "DRAFT" && (
          <ActionButton
            action={submitRfqAction.bind(null, rfq.id)}
            label={t("submitAndMatch")}
            pendingLabel={t("matchingInProgress")}
          />
        )}
        {rfq.status === "OPEN" && (
          <>
            <ActionButton
              action={rerunMatchingAction.bind(null, rfq.id)}
              label={t("refreshMatches")}
              className="btn-secondary"
            />
            <ActionButton
              action={cancelRfqAction.bind(null, rfq.id)}
              label={t("cancelRfq")}
              className="btn-danger"
              confirmMessage={t("cancelConfirm")}
            />
          </>
        )}
      </section>

      {rfq.status === "OPEN" && (
        <section>
          <h2 className="section-title mb-3">{t("matchedSuppliersTitle")}</h2>
          {rfq.matches.filter((m) => m.compatible).length === 0 ? (
            <div className="card text-sm text-slate-500">{t("noCompatibleFound")}</div>
          ) : (
            <div className="space-y-3">
              {rfq.matches
                .filter((m) => m.compatible)
                .map((match) => (
                  <MatchResultCard
                    key={match.id}
                    machineName={match.machine.name}
                    companyName={match.machine.company.name}
                    score={match.score}
                    compatible={match.compatible}
                    reasons={match.reasons as unknown as MatchReason[]}
                  />
                ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
