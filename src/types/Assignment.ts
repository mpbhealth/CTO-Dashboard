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
}

export interface AssignmentCreateData {
  title: string;
  description?: string;
  project_id?: string;
  status: AssignmentStatus;
  due_date?: string;
}

export interface AssignmentUpdateData extends Partial<AssignmentCreateData> {
  updated_at?: string;
}