import { describe, expect, it } from 'vitest';
import { buildTideSeries, projectTideMembers, rollupTideMonths } from './movementTide';

const today = new Date('2026-09-11T12:00:00Z');

describe('rollupTideMonths', () => {
  it('folds org rows onto YYYY-MM and sorts', () => {
    const rows = rollupTideMonths([
      { month: '2026-02-01', enrollments: 8, terminations: 3 },
      { month: '2026-01-15', enrollments: 10, terminations: 2 },
      { month: '2026-01-01', enrollments: 5, terminations: 1 },
    ]);
    expect(rows).toEqual([
      { month: '2026-01', gained: 15, lost: 3 },
      { month: '2026-02', gained: 8, lost: 3 },
    ]);
  });
});

describe('buildTideSeries', () => {
  it('averages the last three complete months and appends a 90-day cone', () => {
    const series = buildTideSeries([
      { month: '2026-06', gained: 80, lost: 60 },
      { month: '2026-07', gained: 90, lost: 45 },
      { month: '2026-08', gained: 110, lost: 55 },
      { month: '2026-09', gained: 20, lost: 10 },
    ], { today });

    const projected = series.filter((row) => row.projected);
    expect(projected.map((row) => row.month)).toEqual(['2026-10', '2026-11', '2026-12']);
    expect(projected[0]?.gained).toBeCloseTo(93.333, 2);
    expect(projected[0]?.lost).toBeCloseTo(53.333, 2);
    expect(projected[0]?.gainedLo).toBeLessThan(projected[0]!.gained);
    expect(projected[0]?.gainedHi).toBeGreaterThan(projected[0]!.gained);
    expect(projected[0]?.lostHi).toBeGreaterThan(projected[0]!.lost);
  });
});

describe('projectTideMembers', () => {
  it('applies the cone to the live book', () => {
    const band = projectTideMembers(1000, [
      { month: '2026-10', gained: 90, lost: 50, gainedLo: 63, gainedHi: 112, lostLo: 35, lostHi: 62, projected: true },
    ]);
    expect(band.base).toBe(1040);
    expect(band.pessimistic).toBe(1001);
    expect(band.optimistic).toBe(1077);
  });
});
