const MAX_MONTHLY_PREMIUM = 50_000;

export function parseMoney(value: unknown): number {
  if (value == null || value === '') return 0;
  if (typeof value === 'number') {
    return Number.isFinite(value) && value > 0 && value <= MAX_MONTHLY_PREMIUM ? value : 0;
  }
  const parsed = Number(String(value).replace(/[^0-9.-]/g, ''));
  return Number.isFinite(parsed) && parsed > 0 && parsed <= MAX_MONTHLY_PREMIUM ? parsed : 0;
}

export function quotedPremium(row: { premium_amount?: unknown; monthly_premium?: unknown }): number {
  const premium = parseMoney(row.premium_amount);
  if (premium > 0) return premium;
  return parseMoney(row.monthly_premium);
}

export interface PipelineStage {
  id?: unknown;
  name?: unknown;
  display_name?: unknown;
  probability?: unknown;
  is_won_stage?: unknown;
  is_lost_stage?: unknown;
}

export function isClosedStage(stage: PipelineStage | undefined, stageName?: unknown): boolean {
  const name = String(stage?.name || stageName || '').trim().toLowerCase();
  if (stage?.is_won_stage === true || stage?.is_lost_stage === true) return true;
  return name === 'won' || name === 'lost' || name === 'converted';
}

export function stageProbability(stage: PipelineStage | undefined): number {
  if (stage?.probability == null || stage.probability === '') return 0.25;
  const raw = Number(stage.probability);
  if (!Number.isFinite(raw) || raw < 0) return 0.25;
  return raw / 100;
}

export function ifClosed(quoted: number, probability: number): number {
  if (quoted <= 0 || probability <= 0) return 0;
  return quoted * probability;
}

export function pickWeightedAmount(
  dealWeighted: number,
  leadIfClosed: number,
  openDealsWithAmount: number,
): number {
  return openDealsWithAmount > 0 ? dealWeighted : leadIfClosed;
}

export function findStage(
  stages: PipelineStage[],
  row: { pipeline_stage?: unknown; pipeline_stage_id?: unknown },
): PipelineStage | undefined {
  const id = String(row.pipeline_stage_id || '');
  if (id) {
    const byId = stages.find((stage) => String(stage.id || '') === id);
    if (byId) return byId;
  }
  const name = String(row.pipeline_stage || '').trim().toLowerCase();
  if (!name) return undefined;
  return stages.find((stage) => {
    const slug = String(stage.name || '').trim().toLowerCase();
    const label = String(stage.display_name || '').trim().toLowerCase();
    return slug === name || label === name;
  });
}
