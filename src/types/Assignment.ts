export type AssignmentStatus = 'todo' | 'in_progress' | 'done';

export interface Assignment {
  id: string;
  title: string;
  description?: string;
  assigned_to: string;
  project_id?: string;
  status: AssignmentStatus;
  due_date?: string; // ISO date string
  created_at: string;
  updated_at: string;
  // Employee information (joined from users table)
  employee_email?: string;
  employee_name?: string;
  teams_user_id?: string;
}

export interface AssignmentCreateData {
  title: string;
  description?: string;
  project_id?: string;
  status: AssignmentStatus;
  due_date?: string;
  assigned_to?: string;
}

export interface AssignmentUpdateData extends Partial<AssignmentCreateData> {
  updated_at?: string;
}