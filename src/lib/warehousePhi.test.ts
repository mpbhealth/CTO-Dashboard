import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const FORBIDDEN = /\b(email|first_name|last_name|full_name|date_of_birth|dob|phone|ssn|address)\b/i;

function tableBlocks(sql: string): Array<{ name: string; body: string }> {
  return sql.split(/create table if not exists public\./i).slice(1).map((block) => {
    const name = block.slice(0, block.indexOf('(')).trim();
    const body = block.slice(block.indexOf('('), block.indexOf(';'));
    return { name, body };
  });
}

describe('warehouse schema', () => {
  const dir = resolve(process.cwd(), 'supabase/migrations');
  const files = readdirSync(dir).filter((name) => name.endsWith('.sql') && !name.includes('_legacy'));

  it('does not declare person columns on fact tables', () => {
    for (const file of files) {
      const sql = readFileSync(resolve(dir, file), 'utf8');
      for (const { name, body } of tableBlocks(sql)) {
        if (!name.startsWith('fact_') && name !== 'forecast_runs') continue;
        expect(body, `${file}:${name}`).not.toMatch(FORBIDDEN);
      }
    }
  });

  it('forbids person identifiers on book tables besides display_name', () => {
    for (const file of files) {
      const sql = readFileSync(resolve(dir, file), 'utf8');
      for (const { name, body } of tableBlocks(sql)) {
        if (!name.startsWith('book_')) continue;
        expect(body, `${file}:${name}`).not.toMatch(FORBIDDEN);
      }
    }
  });
});
