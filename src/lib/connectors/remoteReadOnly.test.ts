import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('remote extractors stay read-only', () => {
  it('forbids write verbs against remotes', () => {
    const remote = readFileSync(resolve(process.cwd(), 'supabase/functions/_shared/remote.ts'), 'utf8');
    expect(remote).toContain("method: 'GET'");
    expect(remote).toContain('READ_RPCS');
    expect(remote).toContain('remote_write_forbidden');
    expect(remote).toContain('restGetOrgOrNull');
    expect(remote).toContain('SHARED_CATALOG_TABLES');
    expect(remote).not.toMatch(/method:\s*'PATCH'/);
    expect(remote).not.toMatch(/method:\s*'PUT'/);
    expect(remote).not.toMatch(/method:\s*'DELETE'/);
  });

  it('does not copy contact PII from ITSTS tickets into COS', () => {
    const src = readFileSync(resolve(process.cwd(), 'supabase/functions/_shared/extractors.ts'), 'utf8');
    expect(src).toMatch(/TICKET_SAFE_SELECT = 'id,ticket_number,subject,status/);
    const start = src.indexOf('export async function extractTickets');
    const end = src.indexOf('export async function extractTraffic');
    const body = src.slice(start, end);
    expect(body).toContain('book_tickets');
    expect(body).not.toMatch(/submitter_email|submitter_phone|satisfaction_comment|resolution_notes/i);
  });

  it('does not copy contact PII from AdvisorIQ into COS', () => {
    const src = readFileSync(resolve(process.cwd(), 'supabase/functions/_shared/extractors.ts'), 'utf8');
    const start = src.indexOf('export async function extractAdvisorIq');
    const end = src.indexOf('export async function extractTickets');
    const body = src.slice(start, end);
    expect(body).toContain('display_name');
    expect(body).not.toMatch(/\b(email|phone|ssn|date_of_birth|address)\b/i);
  });

  it('does not write into EnrollFlow or CRM from COS functions', () => {
    const files = [
      'supabase/functions/_shared/extractors.ts',
      'supabase/functions/crm-proxy/index.ts',
      'supabase/functions/connector-sync/index.ts',
    ];
    for (const file of files) {
      const src = readFileSync(resolve(process.cwd(), file), 'utf8');
      expect(src, file).not.toMatch(/method:\s*'(PATCH|PUT|DELETE)'/);
    }
  });
});
