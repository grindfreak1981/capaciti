import { getTranslations } from "next-intl/server";

const AVAILABILITY_STYLES: Record<string, string> = {
  AVAILABLE: "bg-green-50 text-green-800 border-green-300",
  LIMITED: "bg-amber-50 text-amber-800 border-amber-300",
  FULL: "bg-red-50 text-red-800 border-red-300",
  UNKNOWN: "bg-slate-100 text-slate-600 border-slate-300",
};

const RFQ_STATUS_STYLES: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-700 border-slate-300",
  OPEN: "bg-blue-50 text-blue-800 border-blue-300",
  CLOSED: "bg-slate-100 text-slate-600 border-slate-300",
  CANCELLED: "bg-red-50 text-red-700 border-red-300",
};

function Badge({ label, className }: { label: string; className: string }) {
  return (
    <span
      className={`inline-flex items-center rounded border px-2 py-0.5 text-xs font-semibold uppercase tracking-wide ${className}`}
    >
      {label}
    </span>
  );
}

const AVAILABILITY_LABEL_KEYS: Record<string, string> = {
  AVAILABLE: "statusAvailable",
  LIMITED: "statusLimited",
  FULL: "statusFull",
  UNKNOWN: "statusUnknown",
};

const RFQ_STATUS_LABEL_KEYS: Record<string, string> = {
  DRAFT: "rfqStatusDraft",
  OPEN: "rfqStatusOpen",
  CLOSED: "rfqStatusClosed",
  CANCELLED: "rfqStatusCancelled",
};

export async function AvailabilityBadge({ status }: { status: string }) {
  const t = await getTranslations("common");
  const key = AVAILABILITY_LABEL_KEYS[status] ?? AVAILABILITY_LABEL_KEYS.UNKNOWN;
  return <Badge label={t(key)} className={AVAILABILITY_STYLES[status] ?? AVAILABILITY_STYLES.UNKNOWN} />;
}

export async function RfqStatusBadge({ status }: { status: string }) {
  const t = await getTranslations("common");
  const key = RFQ_STATUS_LABEL_KEYS[status] ?? RFQ_STATUS_LABEL_KEYS.DRAFT;
  return <Badge label={t(key)} className={RFQ_STATUS_STYLES[status] ?? RFQ_STATUS_STYLES.DRAFT} />;
}

export async function CompatibilityBadge({ compatible }: { compatible: boolean }) {
  const t = await getTranslations("common");
  return compatible ? (
    <Badge label={t("compatible")} className="bg-green-50 text-green-800 border-green-300" />
  ) : (
    <Badge label={t("notCompatible")} className="bg-slate-100 text-slate-600 border-slate-300" />
  );
}
