export function isActiveVendorStatus(status: unknown): boolean {
  return String(status || '').trim().toLowerCase() === 'active';
}

export function commissionMonthKey(value: unknown): string | null {
  const raw = String(value || '').trim();
  const match = raw.match(/^(\d{4}-\d{2})(?:-\d{2})?/);
  return match ? match[1] : null;
}

export function billingMonthKey(value: unknown): string | null {
  const raw = String(value || '').trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 7);
  return commissionMonthKey(raw);
}

export function isPaidCommissionStatus(status: unknown): boolean {
  return String(status || '').trim().toLowerCase() === 'paid';
}

export function isPendingCommissionStatus(status: unknown): boolean {
  return String(status || '').trim().toLowerCase() === 'pending';
}

export function vendorUnitCost(cost: unknown, tobacco: unknown, isSmoker: unknown): number {
  const base = Number(cost || 0) || 0;
  const smoker = isSmoker === true || isSmoker === 'true' || isSmoker === 't';
  return smoker ? base + (Number(tobacco || 0) || 0) : base;
}

export interface VendorCostRow {
  product_id?: unknown;
  iua_id?: unknown;
  cost?: unknown;
  tobacco_surcharge?: unknown;
  status?: unknown;
  not_offered?: unknown;
}

export function matchVendorUnit(
  rows: VendorCostRow[],
  productId: string,
  opts: { iuaId?: string; isSmoker?: unknown } = {},
): { unit: number; estimated: boolean } | null {
  if (!productId) return null;
  const active = rows.filter((row) => (
    isActiveVendorStatus(row.status)
    && row.not_offered !== true
    && String(row.product_id || '') === productId
  ));
  if (active.length === 0) return null;

  let pool = active;
  const iuaId = opts.iuaId ? String(opts.iuaId) : '';
  if (iuaId) {
    const tight = active.filter((row) => String(row.iua_id || '') === iuaId);
    if (tight.length > 0) pool = tight;
  }

  const units = pool.map((row) => vendorUnitCost(row.cost, row.tobacco_surcharge, opts.isSmoker));
  if (units.length === 1) return { unit: units[0], estimated: false };

  const sorted = [...units].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  return { unit: median, estimated: true };
}

export function vendorCoveragePct(matched: number, total: number): number {
  if (total <= 0) return 100;
  return Number(((matched / total) * 100).toFixed(1));
}

export function quarterStart(monthStart: string): string {
  const year = Number(monthStart.slice(0, 4));
  const month = Number(monthStart.slice(5, 7));
  const quarterMonth = Math.floor((month - 1) / 3) * 3 + 1;
  return `${year}-${String(quarterMonth).padStart(2, '0')}-01`;
}

export function yearStart(monthStart: string): string {
  return `${monthStart.slice(0, 4)}-01-01`;
}

export interface PnlParts {
  collected: number;
  pending: number;
  failed: number;
  vendor_cost: number;
  commissions: number;
  saas_cost: number;
  enrollment_count: number;
  active_members: number;
  commissions_pending: number;
  missing_vendor_matches: number;
  vendor_coverage_pct: number;
}

export function emptyPnl(): PnlParts {
  return {
    collected: 0,
    pending: 0,
    failed: 0,
    vendor_cost: 0,
    commissions: 0,
    saas_cost: 0,
    enrollment_count: 0,
    active_members: 0,
    commissions_pending: 0,
    missing_vendor_matches: 0,
    vendor_coverage_pct: 100,
  };
}

export function rollupPnlMonths(months: PnlParts[]): PnlParts {
  const latest = months[months.length - 1] || emptyPnl();
  return months.reduce((acc, row, index) => ({
    collected: acc.collected + row.collected,
    pending: acc.pending + row.pending,
    failed: acc.failed + row.failed,
    commissions: acc.commissions + row.commissions,
    commissions_pending: acc.commissions_pending + row.commissions_pending,
    enrollment_count: acc.enrollment_count + row.enrollment_count,
    vendor_cost: index === months.length - 1 ? row.vendor_cost : acc.vendor_cost,
    saas_cost: index === months.length - 1 ? row.saas_cost : acc.saas_cost,
    active_members: index === months.length - 1 ? row.active_members : acc.active_members,
    missing_vendor_matches: latest.missing_vendor_matches,
    vendor_coverage_pct: latest.vendor_coverage_pct,
  }), emptyPnl());
}

export function pnlNet(row: Pick<PnlParts, 'collected' | 'vendor_cost' | 'commissions' | 'saas_cost'>): {
  gross: number;
  net: number;
} {
  const gross = row.collected - row.vendor_cost - row.commissions;
  return { gross, net: gross - row.saas_cost };
}
