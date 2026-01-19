/**
 * Assignment Types
 * Type definitions for the assignments module
 */

/** Data required to create a new assignment */
export interface AssignmentCreateData {
  title: string;
  description?: string;
  project_id?: string;
  status: string;
  due_date?: string;
  employee_email?: string;
}
