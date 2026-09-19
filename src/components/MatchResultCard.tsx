import { getTranslations } from "next-intl/server";
import type { MatchReason } from "@/domain/matching/types";
import { CompatibilityBadge } from "./StatusBadge";

export interface MatchResultCardProps {
  machineName: string;
  companyName?: string;
  score: number;
  compatible: boolean;
  reasons: MatchReason[];
}

const PROCESS_PARAM_KEYS = ["process", "machineProcess", "rfqProcess"];

export async function MatchResultCard({ machineName, companyName, score, compatible, reasons }: MatchResultCardProps) {
  const [tReasons, tDetail, tProcesses] = await Promise.all([
    getTranslations("match.reasons"),
    getTranslations("match.detail"),
    getTranslations("processes"),
  ]);

  return (
    <div className={`card ${compatible ? "border-slate-200" : "border-slate-200 opacity-70"}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-semibold text-slate-900">{machineName}</p>
          {companyName && <p className="text-sm text-slate-500">{companyName}</p>}
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="text-2xl font-bold tabular-nums text-slate-900">{score}%</span>
          <CompatibilityBadge compatible={compatible} />
        </div>
      </div>
      <ul className="mt-4 space-y-1.5 text-sm">
        {reasons.map((reason) => {
          const params: Record<string, string | number> = {};
          for (const [k, v] of Object.entries(reason.detailParams ?? {})) {
            params[k] = PROCESS_PARAM_KEYS.includes(k) ? tProcesses(String(v)) : v;
          }
          return (
            <li key={reason.key} className="flex items-start gap-2">
              <span className={reason.passed ? "text-green-600" : "text-red-600"} aria-hidden>
                {reason.passed ? "✓" : "✗"}
              </span>
              <span className={reason.passed ? "text-slate-700" : "text-slate-800 font-medium"}>
                {tReasons(reason.key)}
                <span className="text-slate-500"> — {tDetail(reason.detailCode, params)}</span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
