import { describe, expect, it } from 'vitest';
import { requireOrgFilter, withOrgFilter, withOrgOrNullFilter } from './requireOrgFilter';

describe('requireOrgFilter', () => {
  it('throws when the org filter is missing', () => {
    expect(() => requireOrgFilter(null)).toThrow('org_filter_required');
    expect(() => requireOrgFilter({ column: '', value: 'x' })).toThrow('org_filter_required');
    expect(() => requireOrgFilter({ column: 'org_id', value: '' })).toThrow('org_filter_required');
  });

  it('rejects injection-shaped column names', () => {
    expect(() => requireOrgFilter({ column: 'org_id=eq.1&email', value: 'x' })).toThrow('org_filter_invalid');
  });

  it('appends a scoped equality predicate', () => {
    expect(withOrgFilter('enrollments?select=id', { column: 'organization_id', value: 'a0000000-0000-0000-0000-000000000001' }))
      .toContain('organization_id=eq.a0000000-0000-0000-0000-000000000001');
  });

  it('accepts seeded sister-app org ids and rejects injection in the value', () => {
    expect(() => requireOrgFilter({
      column: 'organization_id',
      value: 'a0000000-0000-0000-0000-000000000001',
    })).not.toThrow();
    expect(() => requireOrgFilter({
      column: 'organization_id',
      value: 'a0000000-0000-0000-0000-000000000001&or=(organization_id.eq.x)',
    })).toThrow('org_filter_invalid');
  });

  it('allows shared catalog rows for vendor_costs without other-tenant ids', () => {
    const path = withOrgOrNullFilter('vendor_costs?select=product_id,cost,status', {
      column: 'organization_id',
      value: 'a0000000-0000-0000-0000-000000000001',
    });
    expect(path).toContain('or=(organization_id.is.null,organization_id.eq.a0000000-0000-0000-0000-000000000001)');
    expect(() => withOrgOrNullFilter('commissions', {
      column: 'organization_id',
      value: 'a0000000-0000-0000-0000-000000000001',
    })).toThrow('remote_shared_catalog_forbidden');
  });
});
