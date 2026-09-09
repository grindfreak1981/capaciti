"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { setMachineWeekAvailabilityAction } from "@/app/actions/machines";

export interface WeekRow {
  isoYear: number;
  isoWeek: number;
  label: string;
  status: "AVAILABLE" | "LIMITED" | "FULL" | null;
  estimatedHours: number | null;
}

/** One-click weekly capacity editor. Every change to a select or hours
 * input saves immediately via a server action — no separate submit step,
 * per the product requirement that updating availability should take as
 * few interactions as possible. */
export function AvailabilityGrid({ machineId, weeks }: { machineId: string; weeks: WeekRow[] }) {
  const [rows, setRows] = useState(weeks);
  const [pending, startTransition] = useTransition();
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const t = useTranslations("machines");
  const tCommon = useTranslations("common");

  function save(index: number, patch: Partial<WeekRow>) {
    const next = rows.slice();
    next[index] = { ...next[index], ...patch };
    setRows(next);

    const row = next[index];
    if (!row.status) return;
    const key = `${row.isoYear}-${row.isoWeek}`;
    setSavingKey(key);
    startTransition(async () => {
      await setMachineWeekAvailabilityAction({
        machineId,
        isoYear: row.isoYear,
        isoWeek: row.isoWeek,
        status: row.status as "AVAILABLE" | "LIMITED" | "FULL",
        estimatedHours: row.status === "FULL" ? null : row.estimatedHours,
      });
      setSavingKey((k) => (k === key ? null : k));
    });
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-slate-200 text-left text-slate-500">
          <th className="py-2 font-medium">{t("weekColumn")}</th>
          <th className="py-2 font-medium">{t("statusColumn")}</th>
          <th className="py-2 font-medium">{t("estHoursColumn")}</th>
          <th className="py-2"></th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => {
          const key = `${row.isoYear}-${row.isoWeek}`;
          return (
            <tr key={key} className="border-b border-slate-100 last:border-0">
              <td className="py-2 font-medium text-slate-800">{row.label}</td>
              <td className="py-2">
                <select
                  className="field-input"
                  value={row.status ?? ""}
                  onChange={(e) => save(i, { status: e.target.value as WeekRow["status"] })}
                >
                  <option value="" disabled>
                    {t("notSetOption")}
                  </option>
                  <option value="AVAILABLE">{tCommon("statusAvailable")}</option>
                  <option value="LIMITED">{tCommon("statusLimited")}</option>
                  <option value="FULL">{tCommon("statusFull")}</option>
                </select>
              </td>
              <td className="py-2">
                <input
                  type="number"
                  min={0}
                  max={500}
                  className="field-input w-24"
                  value={row.estimatedHours ?? ""}
                  disabled={!row.status || row.status === "FULL"}
                  onChange={(e) =>
                    save(i, { estimatedHours: e.target.value === "" ? null : Number(e.target.value) })
                  }
                />
              </td>
              <td className="w-16 py-2 text-xs text-slate-400">
                {pending && savingKey === key ? tCommon("saving") : null}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
