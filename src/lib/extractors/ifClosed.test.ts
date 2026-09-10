import { describe, expect, it } from 'vitest';
import {
  findStage,
  ifClosed,
  isClosedStage,
  pickWeightedAmount,
  quotedPremium,
  stageProbability,
} from '../../../supabase/functions/_shared/ifClosed';

describe('quotedPremium', () => {
  it('prefers the first positive premium field', () => {
    expect(quotedPremium({ premium_amount: 120, monthly_premium: '90' })).toBe(120);
    expect(quotedPremium({ premium_amount: 0, monthly_premium: '$1,250.50' })).toBe(1250.5);
    expect(quotedPremium({ monthly_premium: 'abc' })).toBe(0);
    expect(quotedPremium({ monthly_premium: '999999999999999999999' })).toBe(0);
  });
});

describe('ifClosed', () => {
  it('uses stage probability and skips closed stages', () => {
    const working = { name: 'working', probability: 25, is_won_stage: false, is_lost_stage: false };
    expect(ifClosed(400, stageProbability(working))).toBe(100);
    expect(isClosedStage({ name: 'won', is_won_stage: true, is_lost_stage: false })).toBe(true);
    expect(isClosedStage({ name: 'converted', probability: null })).toBe(true);
    expect(isClosedStage(working)).toBe(false);
  });

  it('defaults missing probability to 25% and prefers deal weight when open deals have amount', () => {
    expect(stageProbability({ name: 'converted', probability: null })).toBe(0.25);
    expect(pickWeightedAmount(80, 400, 2)).toBe(80);
    expect(pickWeightedAmount(0, 400, 0)).toBe(400);
  });

  it('matches stages by id or name', () => {
    const stages = [
      { id: 's1', name: 'quoted', display_name: 'Quoted', probability: 50 },
    ];
    expect(findStage(stages, { pipeline_stage_id: 's1' })?.name).toBe('quoted');
    expect(findStage(stages, { pipeline_stage: 'Quoted' })?.name).toBe('quoted');
  });
});
