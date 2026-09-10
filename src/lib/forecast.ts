export interface ForecastAssumptions {
  horizonDays: number;
  weeklyWeeks: number;
  seasonality: number;
  monthlyChurn: number;
  winRate: number;
  pessimistic: number;
  optimistic: number;
}

interface ForecastInputs {
  pnl: Array<{ collected: number; vendor_cost: number; commissions: number; saas_cost: number; active_members: number }>;
  enroll: Array<{ new_count: number; inactive_count: number; mrr: number }>;
  pipe: Array<{ weighted_amount: number; premium_sum: number }>;
}

export function computeForecast(inputs: ForecastInputs, a: ForecastAssumptions) {
  const weeks = Math.max(1, a.weeklyWeeks);
  const weeklyCollected = (inputs.pnl[0]?.collected || 0) / 4;
  const runRate = weeklyCollected * (a.horizonDays / 7) * a.seasonality;
  const pipeline = Number(inputs.pipe[0]?.weighted_amount || 0);
  const quoted = Number(inputs.pipe[0]?.premium_sum || 0) * a.winRate;
  const revenueBase = runRate + pipeline;
  const membersNow = Number(inputs.pnl[0]?.active_members || 0);
  const newPerDay = inputs.enroll.slice(0, 30).reduce((s, row) => s + Number(row.new_count || 0), 0) / 30;
  const lostPerDay = inputs.enroll.slice(0, 30).reduce((s, row) => s + Number(row.inactive_count || 0), 0) / 30;
  const membersBase = membersNow * (1 - a.monthlyChurn * (a.horizonDays / 30)) + (newPerDay - lostPerDay) * a.horizonDays;
  const vendorUnit = membersNow > 0 ? Number(inputs.pnl[0]?.vendor_cost || 0) / membersNow : 0;
  const vendorBase = Math.max(0, membersBase) * vendorUnit;
  const commissions = Number(inputs.pnl[0]?.commissions || 0) * (a.horizonDays / 30);
  const saas = Number(inputs.pnl[0]?.saas_cost || 0) * (a.horizonDays / 30);

  const band = (base: number) => ({
    pessimistic: base * a.pessimistic,
    base,
    optimistic: base * a.optimistic + quoted * 0.25,
  });

  const revenue = band(revenueBase);
  return {
    members: band(Math.max(0, membersBase)),
    revenue,
    vendor: band(vendorBase),
    pnl: {
      pessimistic: revenue.pessimistic - vendorBase * a.pessimistic - commissions - saas,
      base: revenue.base - vendorBase - commissions - saas,
      optimistic: revenue.optimistic - vendorBase * a.optimistic - commissions - saas,
    },
    weeks,
  };
}
