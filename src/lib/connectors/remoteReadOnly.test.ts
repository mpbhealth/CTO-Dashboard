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
