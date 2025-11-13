import { supabase } from '../supabase';

export interface Department {
  id: string;
  name: string;
  description?: string;
  manager_id?: string;
  parent_department_id?: string;
  budget?: number;
  headcount?: number;
  created_at: string;
  updated_at: string;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  title?: string;
  department_id?: string;
  manager_id?: string;
  hire_date?: string;
  status: 'active' | 'inactive' | 'on-leave';
  created_at: string;
  updated_at: string;
}

export async function getDepartments() {
  const { data, error } = await supabase
    .from('departments')
    .select('*')
    .order('name', { ascending: true });

  if (error) throw error;
  return data as Department[];
}

export async function getEmployees() {
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .order('name', { ascending: true });

  if (error) throw error;
  return data as Employee[];
}

export async function getDepartmentById(id: string) {
  const { data, error } = await supabase
    .from('departments')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data as Department | null;
}

export async function getEmployeeById(id: string) {
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data as Employee | null;
}

export async function createDepartment(dept: Omit<Department, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('departments')
    .insert(dept)
    .select()
    .single();

  if (error) throw error;
  return data as Department;
}

export async function createEmployee(emp: Omit<Employee, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('employees')
    .insert(emp)
    .select()
    .single();

  if (error) throw error;
  return data as Employee;
}

export async function updateDepartment(id: string, updates: Partial<Department>) {
  const { data, error } = await supabase
    .from('departments')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Department;
}

export async function updateEmployee(id: string, updates: Partial<Employee>) {
  const { data, error } = await supabase
    .from('employees')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Employee;
}
