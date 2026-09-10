import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const FORBIDDEN = /\b(email|first_name|last_name|full_name|date_of_birth|dob|phone|ssn|address)\b/i;

describe('warehouse schema', () => {
  it('does not declare person columns on fact tables', () => {
    const sql = readFileSync(
      resolve(process.cwd(), 'supabase/migrations/20260910160000_cos_executive_tenancy_warehouse.sql'),
      'utf8',
    );
    const blocks = sql.split(/create table if not exists public\./i).slice(1);
    for (const block of blocks) {
      const name = block.slice(0, block.indexOf('(')).trim();
      if (!name.startsWith('fact_') && name !== 'advisor_scorecards' && name !== 'forecast_runs') continue;
      const body = block.slice(block.indexOf('('), block.indexOf(';'));
      expect(body, name).not.toMatch(FORBIDDEN);
    }
  });
});
