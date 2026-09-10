import { describe, expect, it } from 'vitest';
import { computeForecast, forecastSentence, preferCompleteMonth, priorForecastDelta } from './forecast';

describe('computeForecast', () => {
  it('returns pessimistic < base < optimistic revenue', () => {
    const result = computeForecast({
      pnl: [{ collected: 4000, vendor_cost: 800, commissions: 200, saas_cost: 100, active_members: 40 }],
      enroll: [{ new_count: 2, inactive_count: 1, mrr: 100 }],
      pipe: [{ weighted_amount: 500, premium_sum: 1000 }],
    }, {
      horizonDays: 90,
      weeklyWeeks: 8,
      seasonality: 1,
      monthlyChurn: 0.03,
      winRate: 0.25,
      pessimistic: 0.7,
      optimistic: 1.25,
    });

    expect(result.revenue.pessimistic).toBeLessThan(result.revenue.base);
    expect(result.revenue.base).toBeLessThan(result.revenue.optimistic);
    expect(result.members.base).toBeGreaterThan(0);
    expect(result.commissions).toBeGreaterThan(0);
    expect(result.saas).toBeGreaterThan(0);
  });

  it('compares current base net to a prior saved run', () => {
    const current = { pnl: { pessimistic: 70, base: 100, optimistic: 130 } };
    expect(priorForecastDelta(current, { pnl: { base: 80 } })).toBe(20);
    expect(priorForecastDelta(current, null)).toBeNull();
    expect(forecastSentence(90, current.pnl, (value) => `$${value}`))
      .toBe('At this pace, 90-day net is $100 ($70–$130).');
  });

  it('skips the in-progress month when a prior month exists', () => {
    const rows = preferCompleteMonth([
      { period_start: '2026-09-01', collected: 780 },
      { period_start: '2026-08-01', collected: 71841 },
    ], new Date('2026-09-10T00:00:00Z'));
    expect(rows[0]?.period_start).toBe('2026-08-01');
  });
});
