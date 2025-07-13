export interface User {
  id: string;
  name: string;
  role: 'admin' | 'executive' | 'board';
  avatar?: string;
}

export interface KPIData {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'stable';
}

export interface TechStackItem {
  id: string;
  name: string;
  category: string;
  version: string;
  owner: string;
  status: 'Active' | 'Experimental' | 'Deprecated';
  notes: string;
}

export interface RoadmapItem {
  id: string;
  title: string;
  quarter: string;
  status: 'Backlog' | 'In Progress' | 'Complete';
  priority: 'Low' | 'Medium' | 'High';
  owner: string;
  department: string;
  dependencies: string[];
  description: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: 'Planning' | 'Building' | 'Live';
  team: string[];
  github_link: string;
  monday_link: string;
  website_url: string;
  progress: number;
}

export interface Vendor {
  id: string;
  name: string;
  category: string;
  cost: number;
  billing_cycle: 'Monthly' | 'Yearly';
  renewal_date: string;
  owner: string;
  justification: string;
}

export interface AIAgent {
  id: string;
  name: string;
  role: string;
  status: 'Live' | 'Inactive';
  prompt: string;
  dataset_refs: string[];
  environment: string;
  last_updated: string;
}

export interface APIStatus {
  id: string;
  name: string;
  url: string;
  status: 'Healthy' | 'Warning' | 'Down';
  last_checked: string;
  response_time: number;
}

export interface DeploymentLog {
  id: string;
  project: string;
  env: string;
  timestamp: string;
  status: 'Success' | 'Failed' | 'In Progress';
  log: string;
}