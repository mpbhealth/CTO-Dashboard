import { describe, expect, it } from 'vitest';
import { shouldQueryCosTable } from './cosPublicTables';

describe('shouldQueryCosTable', () => {
  it('allows COS warehouse and identity tables', () => {
    expect(shouldQueryCosTable('projects')).toBe(true);
    expect(shouldQueryCosTable('roadmap_items')).toBe(true);
    expect(shouldQueryCosTable('audit_events')).toBe(true);
    expect(shouldQueryCosTable('analytics_snapshots')).toBe(true);
  });

  it('blocks leftover MPB tables that 404 on COS', () => {
    for (const table of [
      'apps',
      'user_app_pins',
      'notifications',
      'notification_preferences',
      'security_audit_log',
      'kpis',
      'team_members',
      'departments',
      'employee_profiles',
      'department_metrics',
      'tickets_cache',
      'compliance_audits',
    ]) {
      expect(shouldQueryCosTable(table)).toBe(false);
    }
  });
});
