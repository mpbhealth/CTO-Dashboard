export interface SourceConfig {
  key: string;
  urlEnv: string;
  keyEnv: string;
  metrics: Array<{ table: string; metric: string }>;
}

export const CONNECTOR_SOURCES: SourceConfig[] = [
  {
    key: 'aryx_crm',
    urlEnv: 'ARYX_CRM_URL',
    keyEnv: 'ARYX_CRM_SERVICE_ROLE_KEY',
    metrics: [
      { table: 'crm_contacts', metric: 'crm_contact_count' },
      { table: 'lead_submissions', metric: 'crm_lead_count' },
      { table: 'crm_activities', metric: 'crm_activity_count' },
    ],
  },
  {
    key: 'aryx_enrollment',
    urlEnv: 'ARYX_ENROLLMENT_URL',
    keyEnv: 'ARYX_ENROLLMENT_SERVICE_ROLE_KEY',
    metrics: [
      { table: 'enrollments', metric: 'enrollment_count' },
      { table: 'members', metric: 'member_count' },
    ],
  },
  {
    key: 'mpb_member',
    urlEnv: 'MPB_MEMBER_URL',
    keyEnv: 'MPB_MEMBER_SERVICE_ROLE_KEY',
    metrics: [{ table: 'members', metric: 'member_app_count' }],
  },
  {
    key: 'it_ticketing',
    urlEnv: 'IT_TICKETING_URL',
    keyEnv: 'IT_TICKETING_SERVICE_ROLE_KEY',
    metrics: [{ table: 'tickets', metric: 'open_ticket_count' }],
  },
];
