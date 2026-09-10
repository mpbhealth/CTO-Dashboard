export type ConnectorKey =
  | 'aryx_crm'
  | 'aryx_enrollment'
  | 'aryx_advisoriq'
  | 'mpb_member'
  | 'it_ticketing'
  | 'marketflo'
  | 'saas_internal'
  | 'all';

export interface ConnectorMetric {
  source: string;
  metric_key: string;
  value: number;
  period_start?: string;
}

export interface ConnectorResult {
  source: string;
  status: 'healthy' | 'degraded' | 'error' | 'unconfigured' | 'skipped';
  metrics: ConnectorMetric[];
  error?: string;
}
