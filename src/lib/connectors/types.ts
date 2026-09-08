export type ConnectorKey = 'aryx_crm' | 'aryx_enrollment' | 'mpb_member' | 'it_ticketing' | 'all';

export interface ConnectorMetric {
  source: string;
  metric_key: string;
  value: number;
  period_start: string;
}

export interface ConnectorResult {
  source: string;
  status: 'healthy' | 'degraded' | 'error' | 'unconfigured';
  metrics: ConnectorMetric[];
  error?: string;
}
