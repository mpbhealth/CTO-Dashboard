export interface TideMonth {
  month: string;
  gained: number;
  lost: number;
}

export interface TidePoint extends TideMonth {
  projected?: boolean;
  gainedLo?: number;
  gainedHi?: number;
  lostLo?: number;
  lostHi?: number;
}

export interface TideMemberBand {
  pessimistic: number;
  base: number;
  optimistic: number;
}

export function rollupTideMonths(
  rows: Array<{ month: string; enrollments?: number | null; terminations?: number | null; gained?: number | null; lost?: number | null }>,
): TideMonth[] {
  const map = new Map<string, TideMonth>();
  for (const row of rows) {
    const month = String(row.month || '').slice(0, 7);
    if (!/^\d{4}-\d{2}$/.test(month)) continue;
    const cur = map.get(month) || { month, gained: 0, lost: 0 };
    cur.gained += Number(row.enrollments ?? row.gained ?? 0);
    cur.lost += Number(row.terminations ?? row.lost ?? 0);
    map.set(month, cur);
  }
  return [...map.values()].sort((a, b) => a.month.localeCompare(b.month));
}

export function addMonthKey(yyyyMm: string, delta: number): string {
  const [year, month] = yyyyMm.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1 + delta, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

export function currentMonthKey(today = new Date()): string {
  return `${today.getUTCFullYear()}-${String(today.getUTCMonth() + 1).padStart(2, '0')}`;
}

export function buildTideSeries(
  history: TideMonth[],
  opts?: { horizonMonths?: number; today?: Date; pessimistic?: number; optimistic?: number },
): TidePoint[] {
  if (history.length === 0) return [];
  const horizon = opts?.horizonMonths ?? 3;
  const today = opts?.today ?? new Date();
  const current = currentMonthKey(today);
  const complete = history.filter((row) => row.month < current);
  const basis = complete.length >= 3
    ? complete.slice(-3)
    : (complete.length > 0 ? complete : history);
  const count = Math.max(1, basis.length);
  const avgGained = basis.reduce((sum, row) => sum + row.gained, 0) / count;
  const avgLost = basis.reduce((sum, row) => sum + row.lost, 0) / count;
  const pessimistic = opts?.pessimistic ?? 0.7;
  const optimistic = opts?.optimistic ?? 1.25;
  const last = history[history.length - 1].month;
  const projected: TidePoint[] = [];
  for (let i = 1; i <= horizon; i += 1) {
    projected.push({
      month: addMonthKey(last, i),
      gained: avgGained,
      lost: avgLost,
      projected: true,
      gainedLo: avgGained * pessimistic,
      gainedHi: avgGained * optimistic,
      lostLo: avgLost * pessimistic,
      lostHi: avgLost * optimistic,
    });
  }
  return [...history.map((row) => ({ ...row })), ...projected];
}

export function projectTideMembers(membersNow: number, projected: TidePoint[]): TideMemberBand {
  const baseNet = projected.reduce((sum, row) => sum + row.gained - row.lost, 0);
  const pessNet = projected.reduce((sum, row) => sum + (row.gainedLo ?? row.gained) - (row.lostHi ?? row.lost), 0);
  const optNet = projected.reduce((sum, row) => sum + (row.gainedHi ?? row.gained) - (row.lostLo ?? row.lost), 0);
  return {
    pessimistic: Math.max(0, membersNow + pessNet),
    base: Math.max(0, membersNow + baseNet),
    optimistic: Math.max(0, membersNow + optNet),
  };
}

export function tideWindowStart(months = 18, today = new Date()): string {
  return `${addMonthKey(currentMonthKey(today), -months)}-01`;
}
