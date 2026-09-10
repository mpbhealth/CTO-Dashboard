export interface OrgFilter {
  column: string;
  value: string;
}

const ORG_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function requireOrgFilter(filter: OrgFilter | null | undefined): OrgFilter {
  if (!filter?.column?.trim() || !filter?.value?.trim()) {
    throw new Error('org_filter_required');
  }
  if (/[&?=()]/.test(filter.column) || /[&?=(),\s/]/.test(filter.value)) {
    throw new Error('org_filter_invalid');
  }
  if (filter.column.endsWith('_id') || filter.column === 'organization_id' || filter.column === 'team_id' || filter.column === 'org_id') {
    if (!ORG_ID_RE.test(filter.value)) throw new Error('org_filter_invalid');
  }
  return filter;
}

export function withOrgFilter(path: string, filter: OrgFilter): string {
  const safe = requireOrgFilter(filter);
  const joiner = path.includes('?') ? '&' : '?';
  return `${path}${joiner}${encodeURIComponent(safe.column)}=eq.${encodeURIComponent(safe.value)}`;
}

const SHARED_CATALOG_TABLES = new Set(['vendor_costs', 'products']);

export function withOrgOrNullFilter(path: string, filter: OrgFilter): string {
  const safe = requireOrgFilter(filter);
  const table = path.split('?')[0];
  if (!SHARED_CATALOG_TABLES.has(table)) throw new Error('remote_shared_catalog_forbidden');
  const rest = path.includes('?') ? path.slice(path.indexOf('?') + 1) : '';
  return `${table}?or=(${safe.column}.is.null,${safe.column}.eq.${safe.value})${rest ? `&${rest}` : ''}`;
}
