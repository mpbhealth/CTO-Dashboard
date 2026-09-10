import { describe, expect, it } from 'vitest';
import {
  commissionMonthKey,
  isActiveVendorStatus,
  matchVendorUnit,
  rollupPnlMonths,
  vendorCoveragePct,
  vendorUnitCost,
} from '../../../supabase/functions/_shared/moneyMatch';

describe('vendor match', () => {
  it('treats Active/active/ACTIVE as live and ignores inactive', () => {
    expect(isActiveVendorStatus('Active')).toBe(true);
    expect(isActiveVendorStatus('active')).toBe(true);
    expect(isActiveVendorStatus('ACTIVE')).toBe(true);
    expect(isActiveVendorStatus('Inactive')).toBe(false);
  });

  it('adds tobacco only for smokers', () => {
    expect(vendorUnitCost(100, 25, false)).toBe(100);
    expect(vendorUnitCost(100, 25, true)).toBe(125);
  });

  it('does not invent $0 when status is active', () => {
    const match = matchVendorUnit(
      [{ product_id: 'p1', cost: 40, tobacco_surcharge: 10, status: 'active' }],
      'p1',
      { isSmoker: false },
    );
    expect(match).toEqual({ unit: 40, estimated: false });
  });

  it('prefers iua rows and medians remaining age bands', () => {
    const match = matchVendorUnit([
      { product_id: 'p1', iua_id: 'i1', cost: 10, status: 'Active' },
      { product_id: 'p1', iua_id: 'i1', cost: 30, status: 'Active' },
      { product_id: 'p1', iua_id: 'i2', cost: 90, status: 'Active' },
    ], 'p1', { iuaId: 'i1' });
    expect(match?.estimated).toBe(true);
    expect(match?.unit).toBe(20);
  });
});

describe('commission months', () => {
  it('matches YYYY-MM and YYYY-MM-01', () => {
    expect(commissionMonthKey('2026-08')).toBe('2026-08');
    expect(commissionMonthKey('2026-08-01')).toBe('2026-08');
    expect(commissionMonthKey('')).toBeNull();
  });
});

describe('pnl rollup', () => {
  it('sums cash lines and keeps the latest vendor book', () => {
    const rolled = rollupPnlMonths([
      { collected: 100, pending: 0, failed: 0, vendor_cost: 0, commissions: 5, saas_cost: 0, enrollment_count: 2, active_members: 10, commissions_pending: 1, missing_vendor_matches: 0, vendor_coverage_pct: 100 },
      { collected: 80, pending: 4, failed: 1, vendor_cost: 20, commissions: 0, saas_cost: 3, enrollment_count: 1, active_members: 12, commissions_pending: 8, missing_vendor_matches: 2, vendor_coverage_pct: 90 },
    ]);
    expect(rolled.collected).toBe(180);
    expect(rolled.commissions).toBe(5);
    expect(rolled.vendor_cost).toBe(20);
    expect(rolled.saas_cost).toBe(3);
    expect(rolled.active_members).toBe(12);
    expect(vendorCoveragePct(9, 10)).toBe(90);
  });
});
