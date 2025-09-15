export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      assignments: {
        Row: {
          id: string
          title: string
          description: string | null
          assigned_to: string | null
          project_id: string | null
          status: 'todo' | 'in_progress' | 'done'
          due_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          assigned_to?: string | null
          project_id?: string | null
          status?: 'todo' | 'in_progress' | 'done'
          due_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          assigned_to?: string | null
          project_id?: string | null
          status?: 'todo' | 'in_progress' | 'done'
          due_date?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      marketing_properties: {
        Row: {
          id: string
          user_id: string
          name: string
          website_url: string | null
          ga_property_id: string | null
          ga_measurement_id: string | null
          ga_connected: boolean
          fb_pixel_id: string | null
          fb_connected: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          website_url?: string | null
          ga_property_id?: string | null
          ga_measurement_id?: string | null
          ga_connected?: boolean
          fb_pixel_id?: string | null
          fb_connected?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          website_url?: string | null
          ga_property_id?: string | null
          ga_measurement_id?: string | null
          ga_connected?: boolean
          fb_pixel_id?: string | null
          fb_connected?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      marketing_metrics: {
        Row: {
          id: string
          property_id: string
          date: string
          sessions: number
          users: number
          pageviews: number
          bounce_rate: number
          conversions: number
          avg_session_duration: number
          traffic_source: string | null
          campaign_name: string | null
          revenue: number
          created_at: string
          conversion_type: string | null
        }
        Insert: {
          id?: string
          property_id: string
          date: string
          sessions?: number
          users?: number
          pageviews?: number
          bounce_rate?: number
          conversions?: number
          avg_session_duration?: number
          traffic_source?: string | null
          campaign_name?: string | null
          revenue?: number
          created_at?: string
          conversion_type?: string | null
        }
        Update: {
          id?: string
          property_id?: string
          date?: string
          sessions?: number
          users?: number
          pageviews?: number
          bounce_rate?: number
          conversions?: number
          avg_session_duration?: number
          traffic_source?: string | null
          campaign_name?: string | null
          revenue?: number
          created_at?: string
          conversion_type?: string | null
        }
      }
      member_status_updates: {
        Row: {
          id: string
          member_id: string
          status_date: string
          new_status: 'active' | 'inactive' | 'lapsed' | 'churned' | 'on_hold' | 'suspended'
          reason: string | null
          source_system: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          member_id: string
          status_date: string
          new_status: 'active' | 'inactive' | 'lapsed' | 'churned' | 'on_hold' | 'suspended'
          reason?: string | null
          source_system?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          member_id?: string
          status_date?: string
          new_status?: 'active' | 'inactive' | 'lapsed' | 'churned' | 'on_hold' | 'suspended'
          reason?: string | null
          source_system?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      member_enrollments: {
        Row: {
          id: string
          enrollment_id: string
          member_id: string
          enrollment_date: string
          program_name: string
          enrollment_status: 'active' | 'pending' | 'cancelled' | 'lapsed' | 'completed'
          enrollment_source: string | null
          premium_amount: number
          renewal_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          enrollment_id: string
          member_id: string
          enrollment_date: string
          program_name: string
          enrollment_status: 'active' | 'pending' | 'cancelled' | 'lapsed' | 'completed'
          enrollment_source?: string | null
          premium_amount: number
          renewal_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          enrollment_id?: string
          member_id?: string
          enrollment_date?: string
          program_name?: string
          enrollment_status?: 'active' | 'pending' | 'cancelled' | 'lapsed' | 'completed'
          enrollment_source?: string | null
          premium_amount?: number
          renewal_date?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      kpi_data: {
        Row: {
          id: string
          title: string
          value: string
          change: string
          trend: 'up' | 'down' | 'stable'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          value: string
          change: string
          trend: 'up' | 'down' | 'stable'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          value?: string
          change?: string
          trend?: 'up' | 'down' | 'stable'
          created_at?: string
          updated_at?: string
        }
      }
      tech_stack: {
        Row: {
          id: string
          name: string
          category: string
          version: string
          owner: string
          status: 'Active' | 'Experimental' | 'Deprecated'
          notes: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          category: string
          version: string
          owner: string
          status?: 'Active' | 'Experimental' | 'Deprecated'
          notes?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          category?: string
          version?: string
          owner?: string
          status?: 'Active' | 'Experimental' | 'Deprecated'
          notes?: string
          created_at?: string
          updated_at?: string
        }
      }
      roadmap_items: {
        Row: {
          id: string
          title: string
          quarter: string
          status: 'Backlog' | 'In Progress' | 'Complete'
          priority: 'Low' | 'Medium' | 'High'
          owner: string
          department: string
          dependencies: string[]
          description: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          quarter: string
          status?: 'Backlog' | 'In Progress' | 'Complete'
          priority?: 'Low' | 'Medium' | 'High'
          owner: string
          department: string
          dependencies?: string[]
          description: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          quarter?: string
          status?: 'Backlog' | 'In Progress' | 'Complete'
          priority?: 'Low' | 'Medium' | 'High'
          owner?: string
          department?: string
          dependencies?: string[]
          description?: string
          created_at?: string
          updated_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          name: string
          description: string
          status: 'Planning' | 'Building' | 'Live'
          team: string[]
          github_link: string
          monday_link: string
          website_url: string
          progress: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          status?: 'Planning' | 'Building' | 'Live'
          team?: string[]
          github_link?: string
          monday_link?: string
          website_url?: string
          progress?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          status?: 'Planning' | 'Building' | 'Live'
          team?: string[]
          github_link?: string
          monday_link?: string
          website_url?: string
          progress?: number
          created_at?: string
          updated_at?: string
        }
      }
      vendors: {
        Row: {
          id: string
          name: string
          category: string
          cost: number
          billing_cycle: 'Monthly' | 'Yearly'
          renewal_date: string
          owner: string
          justification: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          category: string
          cost: number
          billing_cycle: 'Monthly' | 'Yearly'
          renewal_date: string
          owner: string
          justification: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          category?: string
          cost?: number
          billing_cycle?: 'Monthly' | 'Yearly'
          renewal_date?: string
          owner?: string
          justification?: string
          created_at?: string
          updated_at?: string
        }
      }
      ai_agents: {
        Row: {
          id: string
          name: string
          role: string
          status: 'Live' | 'Inactive'
          prompt: string
          dataset_refs: string[]
          environment: string
          last_updated: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          role: string
          status?: 'Live' | 'Inactive'
          prompt: string
          dataset_refs?: string[]
          environment?: string
          last_updated?: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          role?: string
          status?: 'Live' | 'Inactive'
          prompt?: string
          dataset_refs?: string[]
          environment?: string
          last_updated?: string
          created_at?: string
        }
      }
      api_statuses: {
        Row: {
          id: string
          name: string
          url: string
          status: 'Healthy' | 'Warning' | 'Down'
          last_checked: string
          response_time: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          url: string
          status?: 'Healthy' | 'Warning' | 'Down'
          last_checked?: string
          response_time?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          url?: string
          status?: 'Healthy' | 'Warning' | 'Down'
          last_checked?: string
          response_time?: number
          created_at?: string
          updated_at?: string
        }
      }
      deployment_logs: {
        Row: {
          id: string
          project: string
          env: string
          timestamp: string
          status: 'Success' | 'Failed' | 'In Progress'
          log: string
          created_at: string
        }
        Insert: {
          id?: string
          project: string
          env: string
          timestamp?: string
          status: 'Success' | 'Failed' | 'In Progress'
          log: string
          created_at?: string
        }
        Update: {
          id?: string
          project?: string
          env?: string
          timestamp?: string
          status?: 'Success' | 'Failed' | 'In Progress'
          log?: string
          created_at?: string
        }
      }
      team_members: {
        Row: {
          id: string
          name: string
          role: string
          team: string
          status: 'Available' | 'In Meeting' | 'Focus Time' | 'Away'
          email: string | null
          avatar_url: string | null
          department: string
          hire_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          role: string
          team: string
          status?: 'Available' | 'In Meeting' | 'Focus Time' | 'Away'
          email?: string | null
          avatar_url?: string | null
          department: string
          hire_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          role?: string
          team?: string
          status?: 'Available' | 'In Meeting' | 'Focus Time' | 'Away'
          email?: string | null
          avatar_url?: string | null
          department?: string
          hire_date?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
