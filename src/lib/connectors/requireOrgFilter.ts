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
