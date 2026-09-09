import type { MatchReason } from "@/domain/matching/types";
import { CompatibilityBadge } from "./StatusBadge";

export interface MatchResultCardProps {
  machineName: string;
  companyName?: string;
  score: number;
  compatible: boolean;
  reasons: MatchReason[];
}

export function MatchResultCard({ machineName, companyName, score, compatible, reasons }: MatchResultCardProps) {
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
        {reasons.map((reason) => (
          <li key={reason.key} className="flex items-start gap-2">
            <span className={reason.passed ? "text-green-600" : "text-red-600"} aria-hidden>
              {reason.passed ? "✓" : "✗"}
            </span>
            <span className={reason.passed ? "text-slate-700" : "text-slate-800 font-medium"}>
              {reason.label}
              {reason.detail ? <span className="text-slate-500"> — {reason.detail}</span> : null}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
