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
          description: string | null
          uptime: number | null
          endpoint_count: number | null
          is_active: boolean | null
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
          description?: string | null
          uptime?: number | null
          endpoint_count?: number | null
          is_active?: boolean | null
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
          description?: string | null
          uptime?: number | null
          endpoint_count?: number | null
          is_active?: boolean | null
        }
      }
      api_incidents: {
        Row: {
          id: string
          api_id: string | null
          title: string
          description: string
          severity: 'critical' | 'warning' | 'info'
          status: 'investigating' | 'identified' | 'monitoring' | 'resolved'
          started_at: string | null
          resolved_at: string | null
          impact: string | null
          resolution_notes: string | null
          created_by: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          api_id?: string | null
          title: string
          description: string
          severity?: 'critical' | 'warning' | 'info'
          status?: 'investigating' | 'identified' | 'monitoring' | 'resolved'
          started_at?: string | null
          resolved_at?: string | null
          impact?: string | null
          resolution_notes?: string | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          api_id?: string | null
          title?: string
          description?: string
          severity?: 'critical' | 'warning' | 'info'
          status?: 'investigating' | 'identified' | 'monitoring' | 'resolved'
          started_at?: string | null
          resolved_at?: string | null
          impact?: string | null
          resolution_notes?: string | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      hipaa_audit_log: {
        Row: {
          id: string
          actor: string | null
          actor_email: string | null
          action: string
          object_table: string | null
          object_id: string | null
          details: Json | null
          ip_address: string | null
          user_agent: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          actor?: string | null
          actor_email?: string | null
          action: string
          object_table?: string | null
          object_id?: string | null
          details?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          actor?: string | null
          actor_email?: string | null
          action?: string
          object_table?: string | null
          object_id?: string | null
          details?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string | null
        }
      }
      integrations_secrets: {
        Row: {
          id: string
          service: string
          key_name: string
          key_value: string
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
          created_by: string | null
        }
        Insert: {
          id?: string
          service: string
          key_name: string
          key_value: string
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
        }
        Update: {
          id?: string
          service?: string
          key_name?: string
          key_value?: string
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
        }
      }
      marketing_integrations: {
        Row: {
          id: string
          google_analytics_key: string | null
          google_analytics_view_id: string | null
          facebook_pixel_id: string | null
          gtm_container_id: string | null
          woocommerce_key: string | null
          woocommerce_secret: string | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
          created_by: string | null
        }
        Insert: {
          id?: string
          google_analytics_key?: string | null
          google_analytics_view_id?: string | null
          facebook_pixel_id?: string | null
          gtm_container_id?: string | null
          woocommerce_key?: string | null
          woocommerce_secret?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
        }
        Update: {
          id?: string
          google_analytics_key?: string | null
          google_analytics_view_id?: string | null
          facebook_pixel_id?: string | null
          gtm_container_id?: string | null
          woocommerce_key?: string | null
          woocommerce_secret?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
        }
      }
      monday_config: {
        Row: {
          id: string
          client_id: string
          client_secret: string
          signing_secret: string
          app_id: string
          access_token: string | null
          refresh_token: string | null
          workspace_id: string | null
          is_active: boolean | null
          last_sync: string | null
          created_at: string | null
          updated_at: string | null
          created_by: string | null
        }
        Insert: {
          id?: string
          client_id: string
          client_secret: string
          signing_secret: string
          app_id: string
          access_token?: string | null
          refresh_token?: string | null
          workspace_id?: string | null
          is_active?: boolean | null
          last_sync?: string | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
        }
        Update: {
          id?: string
          client_id?: string
          client_secret?: string
          signing_secret?: string
          app_id?: string
          access_token?: string | null
          refresh_token?: string | null
          workspace_id?: string | null
          is_active?: boolean | null
          last_sync?: string | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
        }
      }
      monday_sync_log: {
        Row: {
          id: string
          operation: string
          status: 'success' | 'failed' | 'in_progress'
          message: string | null
          items_processed: number | null
          errors_count: number | null
          details: Json | null
          duration_ms: number | null
          timestamp: string | null
          created_by: string | null
        }
        Insert: {
          id?: string
          operation: string
          status?: 'success' | 'failed' | 'in_progress'
          message?: string | null
          items_processed?: number | null
          errors_count?: number | null
          details?: Json | null
          duration_ms?: number | null
          timestamp?: string | null
          created_by?: string | null
        }
        Update: {
          id?: string
          operation?: string
          status?: 'success' | 'failed' | 'in_progress'
          message?: string | null
          items_processed?: number | null
          errors_count?: number | null
          details?: Json | null
          duration_ms?: number | null
          timestamp?: string | null
          created_by?: string | null
        }
      }
      sftp_configs: {
        Row: {
          id: string
          name: string
          hostname: string
          port: number | null
          username: string
          password: string
          folder_path: string | null
          direction: 'import' | 'export'
          schedule: string | null
          is_active: boolean | null
          last_sync: string | null
          created_at: string | null
          updated_at: string | null
          created_by: string | null
        }
        Insert: {
          id?: string
          name: string
          hostname: string
          port?: number | null
          username: string
          password: string
          folder_path?: string | null
          direction: 'import' | 'export'
          schedule?: string | null
          is_active?: boolean | null
          last_sync?: string | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
        }
        Update: {
          id?: string
          name?: string
          hostname?: string
          port?: number | null
          username?: string
          password?: string
          folder_path?: string | null
          direction?: 'import' | 'export'
          schedule?: string | null
          is_active?: boolean | null
          last_sync?: string | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
        }
      }
      sync_logs: {
        Row: {
          id: string
          service: string
          operation: string
          status: 'success' | 'failed' | 'in_progress'
          message: string | null
          details: Json | null
          duration_ms: number | null
          records_processed: number | null
          timestamp: string | null
          created_by: string | null
        }
        Insert: {
          id?: string
          service: string
          operation: string
          status?: 'success' | 'failed' | 'in_progress'
          message?: string | null
          details?: Json | null
          duration_ms?: number | null
          records_processed?: number | null
          timestamp?: string | null
          created_by?: string | null
        }
        Update: {
          id?: string
          service?: string
          operation?: string
          status?: 'success' | 'failed' | 'in_progress'
          message?: string | null
          details?: Json | null
          duration_ms?: number | null
          records_processed?: number | null
          timestamp?: string | null
          created_by?: string | null
        }
      }
      webhooks_config: {
        Row: {
          id: string
          event: string
          target_url: string
          secret_token: string
          headers: Json | null
          is_active: boolean | null
          retry_count: number | null
          timeout_seconds: number | null
          created_at: string | null
          updated_at: string | null
          created_by: string | null
        }
        Insert: {
          id?: string
          event: string
          target_url: string
          secret_token: string
          headers?: Json | null
          is_active?: boolean | null
          retry_count?: number | null
          timeout_seconds?: number | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
        }
        Update: {
          id?: string
          event?: string
          target_url?: string
          secret_token?: string
          headers?: Json | null
          is_active?: boolean | null
          retry_count?: number | null
          timeout_seconds?: number | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
        }
      }
      performance_reviews: {
        Row: {
          id: string
          employee_id: string
          reviewer_id: string
          review_cycle: 'quarterly' | 'annual' | 'mid-year'
          period_start: string
          period_end: string
          status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'acknowledged'
          overall_score: number | null
          final_rating: 'exceeds' | 'meets' | 'partially_meets' | 'does_not_meet' | null
          strengths: string | null
          areas_for_improvement: string | null
          goals_assessment: string | null
          performance_summary: string | null
          submitted_at: string | null
          approved_at: string | null
          acknowledged_at: string | null
          next_review_date: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          employee_id: string
          reviewer_id: string
          review_cycle: 'quarterly' | 'annual' | 'mid-year'
          period_start: string
          period_end: string
          status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'acknowledged'
          overall_score?: number | null
          final_rating?: 'exceeds' | 'meets' | 'partially_meets' | 'does_not_meet' | null
          strengths?: string | null
          areas_for_improvement?: string | null
          goals_assessment?: string | null
          performance_summary?: string | null
          submitted_at?: string | null
          approved_at?: string | null
          acknowledged_at?: string | null
          next_review_date?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          employee_id?: string
          reviewer_id?: string
          review_cycle?: 'quarterly' | 'annual' | 'mid-year'
          period_start?: string
          period_end?: string
          status?: 'draft' | 'submitted' | 'under_review' | 'approved' | 'acknowledged'
          overall_score?: number | null
          final_rating?: 'exceeds' | 'meets' | 'partially_meets' | 'does_not_meet' | null
          strengths?: string | null
          areas_for_improvement?: string | null
          goals_assessment?: string | null
          performance_summary?: string | null
          submitted_at?: string | null
          approved_at?: string | null
          acknowledged_at?: string | null
          next_review_date?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      review_criteria: {
        Row: {
          id: string
          name: string
          category: 'technical' | 'behavioral' | 'leadership' | 'values'
          description: string | null
          weight: number
          max_score: number
          is_active: boolean | null
          department_id: string | null
          applicable_roles: string[] | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          category: 'technical' | 'behavioral' | 'leadership' | 'values'
          description?: string | null
          weight?: number
          max_score?: number
          is_active?: boolean | null
          department_id?: string | null
          applicable_roles?: string[] | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          category?: 'technical' | 'behavioral' | 'leadership' | 'values'
          description?: string | null
          weight?: number
          max_score?: number
          is_active?: boolean | null
          department_id?: string | null
          applicable_roles?: string[] | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      review_scores: {
        Row: {
          id: string
          review_id: string
          criterion_id: string
          score: number
          comments: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          review_id: string
          criterion_id: string
          score: number
          comments?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          review_id?: string
          criterion_id?: string
          score?: number
          comments?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      kpi_definitions: {
        Row: {
          id: string
          name: string
          description: string | null
          category: string
          unit: string | null
          target_value: number
          min_threshold: number | null
          max_threshold: number | null
          frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual'
          applicable_roles: string[] | null
          department_id: string | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          category: string
          unit?: string | null
          target_value: number
          min_threshold?: number | null
          max_threshold?: number | null
          frequency?: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual'
          applicable_roles?: string[] | null
          department_id?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          category?: string
          unit?: string | null
          target_value?: number
          min_threshold?: number | null
          max_threshold?: number | null
          frequency?: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual'
          applicable_roles?: string[] | null
          department_id?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      employee_kpis: {
        Row: {
          id: string
          employee_id: string
          kpi_id: string
          current_value: number
          status: 'on_track' | 'at_risk' | 'off_track'
          last_updated: string | null
          target_date: string | null
          notes: string | null
        }
        Insert: {
          id?: string
          employee_id: string
          kpi_id: string
          current_value: number
          status: 'on_track' | 'at_risk' | 'off_track'
          last_updated?: string | null
          target_date?: string | null
          notes?: string | null
        }
        Update: {
          id?: string
          employee_id?: string
          kpi_id?: string
          current_value?: number
          status?: 'on_track' | 'at_risk' | 'off_track'
          last_updated?: string | null
          target_date?: string | null
          notes?: string | null
        }
      }
      career_development_plans: {
        Row: {
          id: string
          employee_id: string
          title: string
          description: string | null
          status: 'draft' | 'active' | 'completed'
          start_date: string
          target_completion_date: string | null
          completed_date: string | null
          mentor_id: string | null
          skills_to_develop: string[] | null
          resources_needed: string | null
          success_criteria: string | null
          progress: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          employee_id: string
          title: string
          description?: string | null
          status?: 'draft' | 'active' | 'completed'
          start_date: string
          target_completion_date?: string | null
          completed_date?: string | null
          mentor_id?: string | null
          skills_to_develop?: string[] | null
          resources_needed?: string | null
          success_criteria?: string | null
          progress?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          employee_id?: string
          title?: string
          description?: string | null
          status?: 'draft' | 'active' | 'completed'
          start_date?: string
          target_completion_date?: string | null
          completed_date?: string | null
          mentor_id?: string | null
          skills_to_develop?: string[] | null
          resources_needed?: string | null
          success_criteria?: string | null
          progress?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      learning_activities: {
        Row: {
          id: string
          plan_id: string
          title: string
          description: string | null
          status: 'not_started' | 'in_progress' | 'completed'
          due_date: string | null
          completion_date: string | null
          activity_type: 'course' | 'certification' | 'workshop' | 'project' | 'mentorship' | 'other' | null
          url: string | null
          notes: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          plan_id: string
          title: string
          description?: string | null
          status?: 'not_started' | 'in_progress' | 'completed'
          due_date?: string | null
          completion_date?: string | null
          activity_type?: 'course' | 'certification' | 'workshop' | 'project' | 'mentorship' | 'other' | null
          url?: string | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          plan_id?: string
          title?: string
          description?: string | null
          status?: 'not_started' | 'in_progress' | 'completed'
          due_date?: string | null
          completion_date?: string | null
          activity_type?: 'course' | 'certification' | 'workshop' | 'project' | 'mentorship' | 'other' | null
          url?: string | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      feedback_entries: {
        Row: {
          id: string
          recipient_id: string
          provider_id: string | null
          feedback_type: 'praise' | 'criticism' | 'suggestion' | 'question'
          content: string
          is_anonymous: boolean | null
          created_at: string | null
        }
        Insert: {
          id?: string
          recipient_id: string
          provider_id?: string | null
          feedback_type: 'praise' | 'criticism' | 'suggestion' | 'question'
          content: string
          is_anonymous?: boolean | null
          created_at?: string | null
        }
        Update: {
          id?: string
          recipient_id?: string
          provider_id?: string | null
          feedback_type?: 'praise' | 'criticism' | 'suggestion' | 'question'
          content?: string
          is_anonymous?: boolean | null
          created_at?: string | null
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
      tickets_cache: {
        Row: {
          id: string
          external_ticket_id: string
          ticket_number: string
          title: string
          description: string | null
          status: string
          priority: string
          category: string | null
          requester_id: string | null
          requester_name: string | null
          requester_email: string | null
          assignee_id: string | null
          assignee_name: string | null
          department: string | null
          created_at: string
          updated_at: string
          resolved_at: string | null
          due_date: string | null
          tags: string[]
          custom_fields: Json
          last_synced_at: string
        }
        Insert: {
          id?: string
          external_ticket_id: string
          ticket_number: string
          title: string
          description?: string | null
          status?: string
          priority?: string
          category?: string | null
          requester_id?: string | null
          requester_name?: string | null
          requester_email?: string | null
          assignee_id?: string | null
          assignee_name?: string | null
          department?: string | null
          created_at?: string
          updated_at?: string
          resolved_at?: string | null
          due_date?: string | null
          tags?: string[]
          custom_fields?: Json
          last_synced_at?: string
        }
        Update: {
          id?: string
          external_ticket_id?: string
          ticket_number?: string
          title?: string
          description?: string | null
          status?: string
          priority?: string
          category?: string | null
          requester_id?: string | null
          requester_name?: string | null
          requester_email?: string | null
          assignee_id?: string | null
          assignee_name?: string | null
          department?: string | null
          created_at?: string
          updated_at?: string
          resolved_at?: string | null
          due_date?: string | null
          tags?: string[]
          custom_fields?: Json
          last_synced_at?: string
        }
      }
      ticket_project_links: {
        Row: {
          id: string
          ticket_id: string
          project_id: string
          link_type: string
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          ticket_id: string
          project_id: string
          link_type?: string
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          ticket_id?: string
          project_id?: string
          link_type?: string
          created_by?: string | null
          created_at?: string
        }
      }
      ticket_assignment_links: {
        Row: {
          id: string
          ticket_id: string
          assignment_id: string
          link_type: string
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          ticket_id: string
          assignment_id: string
          link_type?: string
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          ticket_id?: string
          assignment_id?: string
          link_type?: string
          created_by?: string | null
          created_at?: string
        }
      }
      ticket_sync_log: {
        Row: {
          id: string
          sync_type: string
          status: string
          records_processed: number
          records_failed: number
          started_at: string
          completed_at: string | null
          error_message: string | null
          details: Json
        }
        Insert: {
          id?: string
          sync_type: string
          status?: string
          records_processed?: number
          records_failed?: number
          started_at?: string
          completed_at?: string | null
          error_message?: string | null
          details?: Json
        }
        Update: {
          id?: string
          sync_type?: string
          status?: string
          records_processed?: number
          records_failed?: number
          started_at?: string
          completed_at?: string | null
          error_message?: string | null
          details?: Json
        }
      }
      ticketing_system_config: {
        Row: {
          id: string
          api_base_url: string
          api_key_encrypted: string | null
          sync_enabled: boolean
          sync_interval_minutes: number
          last_successful_sync: string | null
          webhook_secret: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          api_base_url: string
          api_key_encrypted?: string | null
          sync_enabled?: boolean
          sync_interval_minutes?: number
          last_successful_sync?: string | null
          webhook_secret?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          api_base_url?: string
          api_key_encrypted?: string | null
          sync_enabled?: boolean
          sync_interval_minutes?: number
          last_successful_sync?: string | null
          webhook_secret?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      ticket_notifications: {
        Row: {
          id: string
          ticket_id: string | null
          user_id: string | null
          notification_type: string
          title: string
          message: string
          is_read: boolean
          read_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          ticket_id?: string | null
          user_id?: string | null
          notification_type: string
          title: string
          message: string
          is_read?: boolean
          read_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          ticket_id?: string | null
          user_id?: string | null
          notification_type?: string
          title?: string
          message?: string
          is_read?: boolean
          read_at?: string | null
          created_at?: string
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
