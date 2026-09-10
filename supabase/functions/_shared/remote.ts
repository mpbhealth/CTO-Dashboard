export interface OrgFilter {
  column: string;
  value: string;
}

const READ_RPCS = new Set([
  'crm_pipeline_breakdown',
  'get_sla_compliance_percentage',
]);

// Accept seeded sister-app IDs (version nibble may be 0), not only RFC 4122.
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

function assertReadPath(path: string) {
  const table = path.split('?')[0].toLowerCase();
  if (table.includes('/rpc/')) throw new Error('remote_write_forbidden');
  if (!/^[a-z_][a-z0-9_]*$/.test(table)) throw new Error('remote_table_invalid');
}

function readHeaders(serviceKey: string): HeadersInit {
  return {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    Prefer: 'count=exact',
    Accept: 'application/json',
  };
}

async function getJson<T>(url: string, serviceKey: string, label: string): Promise<T> {
  const res = await fetch(url, { method: 'GET', headers: readHeaders(serviceKey) });
  if (!res.ok) throw new Error(`${label}_${res.status}`);
  return await res.json() as T;
}

export async function restGet<T>(
  baseUrl: string,
  serviceKey: string,
  path: string,
  filter: OrgFilter,
): Promise<T> {
  assertReadPath(path);
  const url = `${baseUrl.replace(/\/$/, '')}/rest/v1/${withOrgFilter(path.replace(/^\//, ''), filter)}`;
  return await getJson<T>(url, serviceKey, 'remote_http');
}

export async function restGetOrgOrNull<T>(
  baseUrl: string,
  serviceKey: string,
  path: string,
  filter: OrgFilter,
): Promise<T> {
  assertReadPath(path);
  const url = `${baseUrl.replace(/\/$/, '')}/rest/v1/${withOrgOrNullFilter(path.replace(/^\//, ''), filter)}`;
  return await getJson<T>(url, serviceKey, 'remote_http');
}

export async function restGetPages<T extends Array<Record<string, unknown>>>(
  baseUrl: string,
  serviceKey: string,
  path: string,
  filter: OrgFilter,
  pageSize = 1000,
): Promise<T> {
  const rows: Array<Record<string, unknown>> = [];
  let offset = 0;
  while (offset < 20000) {
    const joiner = path.includes('?') ? '&' : '?';
    const page = await restGet<T>(
      baseUrl,
      serviceKey,
      `${path}${joiner}limit=${pageSize}&offset=${offset}`,
      filter,
    );
    if (!Array.isArray(page) || page.length === 0) break;
    rows.push(...page);
    if (page.length < pageSize) break;
    offset += pageSize;
  }
  return rows as T;
}

export async function restRpc<T>(
  baseUrl: string,
  serviceKey: string,
  rpcName: string,
  body: Record<string, unknown>,
  orgParam: string,
  orgValue: string,
): Promise<T> {
  if (!READ_RPCS.has(rpcName)) throw new Error('remote_rpc_forbidden');
  requireOrgFilter({ column: orgParam, value: orgValue });
  if (body[orgParam] !== orgValue) throw new Error('org_filter_required');
  const url = `${baseUrl.replace(/\/$/, '')}/rest/v1/rpc/${rpcName}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { ...readHeaders(serviceKey), 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`remote_rpc_${res.status}`);
  return await res.json() as T;
}

export async function countFiltered(
  baseUrl: string,
  serviceKey: string,
  table: string,
  filter: OrgFilter,
  extraQuery = '',
): Promise<number> {
  if (!/^[a-z_][a-z0-9_]*$/i.test(table)) throw new Error('remote_table_invalid');
  const extra = extraQuery ? `&${extraQuery.replace(/^\?/, '').replace(/^&/, '')}` : '';
  if (/(insert|upsert|update|delete|patch|or=|organization_id|org_id|team_id|select=)/i.test(extra)) {
    throw new Error('remote_write_forbidden');
  }
  const path = `${table}?select=*&limit=1${extra}`;
  const url = `${baseUrl.replace(/\/$/, '')}/rest/v1/${withOrgFilter(path, filter)}`;
  const res = await fetch(url, { method: 'GET', headers: readHeaders(serviceKey) });
  if (!res.ok) throw new Error(`remote_count_${res.status}`);
  const range = res.headers.get('content-range') || '0-0/0';
  return Number(range.split('/')[1] || 0);
}
