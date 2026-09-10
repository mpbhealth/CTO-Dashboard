import { describe, expect, it } from 'vitest';
import { computeForecast } from './forecast';

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
  });
});
