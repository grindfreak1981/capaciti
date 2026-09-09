import { addWeeks, getISOWeek, getISOWeekYear, startOfISOWeek } from "date-fns";

export interface IsoWeekRef {
  isoYear: number;
  isoWeek: number;
}

export function toIsoWeekRef(date: Date): IsoWeekRef {
  return { isoYear: getISOWeekYear(date), isoWeek: getISOWeek(date) };
}

export function isoWeekKey(ref: IsoWeekRef): string {
  return `${ref.isoYear}-${String(ref.isoWeek).padStart(2, "0")}`;
}

/**
 * Enumerate every ISO week from `from` up to and including `to`.
 * If `to` is before `from` (delivery date in the past), only the
 * current week is returned so callers still get a well-defined,
 * non-empty window instead of silently matching everything.
 * Capped at 60 weeks — availability is a short-term planning tool,
 * not a long-range production schedule.
 */
export function enumerateIsoWeeks(from: Date, to: Date, maxWeeks = 60): IsoWeekRef[] {
  const start = startOfISOWeek(from);
  const end = startOfISOWeek(to < from ? from : to);
  const weeks: IsoWeekRef[] = [];
  let cursor = start;
  let guard = 0;
  while (cursor <= end && guard < maxWeeks) {
    weeks.push(toIsoWeekRef(cursor));
    cursor = addWeeks(cursor, 1);
    guard += 1;
  }
  if (weeks.length === 0) {
    weeks.push(toIsoWeekRef(start));
  }
  return weeks;
}
