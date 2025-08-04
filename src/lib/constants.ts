// Application Constants
export const APP_CONFIG = {
  NAME: 'MPB Health CTO Dashboard',
  VERSION: '1.0.0',
  DESCRIPTION: 'Executive Technology Leadership Dashboard',
  AUTHOR: 'Vinnie R. Tannous, CTO',
  ORGANIZATION: 'MPB Health',
} as const;

// Database Table Names
export const TABLES = {
  KPI_DATA: 'kpi_data',
  TEAM_MEMBERS: 'team_members', 
  TECH_STACK: 'tech_stack',
  ROADMAP_ITEMS: 'roadmap_items',
  PROJECTS: 'projects',
  VENDORS: 'vendors',
  AI_AGENTS: 'ai_agents',
  API_STATUSES: 'api_statuses',
  DEPLOYMENT_LOGS: 'deployment_logs',
  ASSIGNMENTS: 'assignments',
  NOTES: 'notes',
  QUICK_LINKS: 'quick_links',
  SAAS_EXPENSES: 'saas_expenses',
  MARKETING_PROPERTIES: 'marketing_properties',
  MARKETING_METRICS: 'marketing_metrics',
} as const;

// UI Constants
export const UI_CONSTANTS = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_UPLOAD_SIZE: 10 * 1024 * 1024, // 10MB
  SUPPORTED_FILE_TYPES: ['.csv', '.pdf', '.doc', '.docx', '.xls', '.xlsx'],
  DEBOUNCE_DELAY: 300,
} as const;

// Color Palettes
export const COLORS = {
  PRIMARY: '#4F46E5',
  SECONDARY: '#10B981', 
  ACCENT: '#F59E0B',
  SUCCESS: '#10B981',
  WARNING: '#F59E0B',
  ERROR: '#EF4444',
  INFO: '#3B82F6',
} as const;

// Status Types
export const STATUS_TYPES = {
  ASSIGNMENT: ['todo', 'in_progress', 'done'] as const,
  PROJECT: ['Planning', 'Building', 'Live'] as const,
  ROADMAP: ['Backlog', 'In Progress', 'Complete'] as const,
  TECH_STACK: ['Active', 'Experimental', 'Deprecated'] as const,
  TEAM_MEMBER: ['Available', 'In Meeting', 'Focus Time', 'Away'] as const,
} as const;