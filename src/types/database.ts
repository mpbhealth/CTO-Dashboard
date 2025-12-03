export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      // ============================================
      // CORE DASHBOARD TABLES
      // ============================================
      
      profiles: {
        Row: {
          id: string
          user_id: string
          org_id: string
          email: string
          full_name: string | null
          display_name: string | null
          role: 'ceo' | 'cto' | 'cfo' | 'cmo' | 'admin' | 'manager' | 'staff'
          is_superuser: boolean
          avatar_url: string | null
          department: string | null
          position: string | null
          phone: string | null
          bio: string | null
          preferences: Json
          created_at: string
          updated_at: string
          last_login_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
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
          priority: string | null
          owner: string | null
          start_date: string | null
          end_date: string | null
          budget: number | null
          tags: string[] | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['projects']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['projects']['Insert']>
      }

      team_members: {
        Row: {
          id: string
          name: string
          role: string
          team: string
          email: string | null
          department: string
          avatar_url: string | null
          status: 'Available' | 'In Meeting' | 'Focus Time' | 'Away'
          hire_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['team_members']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['team_members']['Insert']>
      }

      quick_links: {
        Row: {
          id: string
          title: string
          url: string
          description: string | null
          category: string | null
          icon: string | null
          is_favorite: boolean
          click_count: number
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['quick_links']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['quick_links']['Insert']>
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
        Insert: Omit<Database['public']['Tables']['tech_stack']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['tech_stack']['Insert']>
      }

      roadmap_items: {
        Row: {
          id: string
          title: string
          description: string | null
          quarter: string | null
          status: 'Backlog' | 'In Progress' | 'Complete' | 'planned'
          priority: 'Low' | 'Medium' | 'High' | 'medium'
          owner: string | null
          department: string | null
          category: string | null
          dependencies: string[]
          tags: string[] | null
          start_date: string | null
          end_date: string | null
          assigned_to: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['roadmap_items']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['roadmap_items']['Insert']>
      }

      // ============================================
      // NOTES & SHARING
      // ============================================

      notes: {
        Row: {
          id: string
          title: string | null
          content: string
          category: string | null
          tags: string[] | null
          is_pinned: boolean
          created_by: string
          user_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['notes']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['notes']['Insert']>
      }

      note_shares: {
        Row: {
          id: string
          note_id: string
          shared_by_user_id: string
          shared_with_user_id: string
          shared_with_role: 'ceo' | 'cto'
          permission_level: 'view' | 'edit'
          share_message: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['note_shares']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['note_shares']['Insert']>
      }

      note_notifications: {
        Row: {
          id: string
          note_id: string
          recipient_user_id: string
          notification_type: 'shared' | 'edited' | 'unshared' | 'commented'
          is_read: boolean
          sent_via: 'in-app' | 'email' | 'both'
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['note_notifications']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['note_notifications']['Insert']>
      }

      // ============================================
      // API & DEPLOYMENTS
      // ============================================

      api_statuses: {
        Row: {
          id: string
          name: string
          url: string
          status: 'Healthy' | 'Warning' | 'Down'
          last_checked: string
          response_time: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['api_statuses']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['api_statuses']['Insert']>
      }

      api_incidents: {
        Row: {
          id: string
          api_id: string | null
          title: string
          description: string
          severity: 'critical' | 'warning' | 'info'
          status: 'investigating' | 'identified' | 'monitoring' | 'resolved'
          started_at: string
          resolved_at: string | null
          impact: string | null
          resolution_notes: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['api_incidents']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['api_incidents']['Insert']>
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
        Insert: Omit<Database['public']['Tables']['deployment_logs']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['deployment_logs']['Insert']>
      }

      // ============================================
      // ASSIGNMENTS & TASKS
      // ============================================

      assignments: {
        Row: {
          id: string
          title: string
          description: string | null
          assigned_to: string | null
          assigned_by: string | null
          project_id: string | null
          due_date: string | null
          priority: string
          status: 'todo' | 'in_progress' | 'done' | 'pending'
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['assignments']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['assignments']['Insert']>
      }

      // ============================================
      // ORGANIZATION & EMPLOYEES
      // ============================================

      departments: {
        Row: {
          id: string
          name: string
          description: string | null
          strategic_purpose: string | null
          parent_department_id: string | null
          head_employee_id: string | null
          department_lead_id: string | null
          budget: number | null
          budget_allocated: number | null
          headcount: number
          location: string | null
          contact_email: string | null
          mission_statement: string | null
          key_objectives: string[] | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['departments']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['departments']['Insert']>
      }

      employee_profiles: {
        Row: {
          id: string
          user_id: string | null
          employee_id: string | null
          full_name: string
          first_name: string | null
          last_name: string | null
          email: string
          phone: string | null
          title: string | null
          position: string | null
          department_id: string | null
          primary_department_id: string | null
          manager_id: string | null
          reports_to_id: string | null
          employment_status: 'active' | 'inactive' | 'terminated' | 'on_leave'
          employment_type: 'full_time' | 'part_time' | 'contract' | 'intern'
          status: string
          hire_date: string | null
          start_date: string | null
          end_date: string | null
          salary: number | null
          location: string | null
          skills: string[] | null
          certifications: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['employee_profiles']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['employee_profiles']['Insert']>
      }

      // ============================================
      // POLICY & COMPLIANCE
      // ============================================

      policy_documents: {
        Row: {
          id: string
          department_id: string | null
          title: string
          document_type: 'policy' | 'sop' | 'handbook' | 'procedure' | 'guideline' | null
          content: string | null
          file_url: string | null
          version: string
          status: 'draft' | 'review' | 'approved' | 'archived' | 'rejected'
          approved_by: string | null
          approved_at: string | null
          review_date: string | null
          effective_date: string | null
          tags: string[] | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['policy_documents']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['policy_documents']['Insert']>
      }

      compliance_tasks: {
        Row: {
          id: string
          title: string
          description: string | null
          due_date: string | null
          status: string
          priority: string
          assigned_to: string | null
          created_by: string | null
          org_id: string
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['compliance_tasks']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['compliance_tasks']['Insert']>
      }

      compliance_documents: {
        Row: {
          id: string
          title: string
          document_type: string | null
          content: string | null
          file_url: string | null
          status: string
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['compliance_documents']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['compliance_documents']['Insert']>
      }

      compliance_incidents: {
        Row: {
          id: string
          title: string
          description: string | null
          severity: string
          status: string
          reported_by: string | null
          assigned_to: string | null
          resolution: string | null
          resolved_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['compliance_incidents']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['compliance_incidents']['Insert']>
      }

      compliance_audits: {
        Row: {
          id: string
          title: string
          audit_type: string | null
          status: string
          auditor: string | null
          findings: string | null
          recommendations: string | null
          scheduled_date: string | null
          completed_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['compliance_audits']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['compliance_audits']['Insert']>
      }

      phi_access_logs: {
        Row: {
          id: string
          user_id: string | null
          patient_id: string | null
          access_type: string
          resource_accessed: string | null
          ip_address: string | null
          user_agent: string | null
          access_reason: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['phi_access_logs']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['phi_access_logs']['Insert']>
      }

      // ============================================
      // SAAS & EXPENSES
      // ============================================

      saas_expenses: {
        Row: {
          id: string
          department: string
          application: string
          service_name: string | null
          description: string | null
          cost_monthly: number
          cost_annual: number
          monthly_cost: number | null
          platform: string | null
          url: string | null
          renewal_date: string | null
          billing_cycle: string
          notes: string | null
          source_sheet: string
          status: string
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['saas_expenses']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['saas_expenses']['Insert']>
      }

      // ============================================
      // DUAL DASHBOARD (CEO/CTO)
      // ============================================

      workspaces: {
        Row: {
          id: string
          org_id: string
          name: string
          workspace_type: 'CEO' | 'CTO' | 'CFO' | 'CMO' | 'Shared'
          kind: 'CTO' | 'CEO' | 'SHARED' | null
          description: string | null
          owner_profile_id: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['workspaces']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['workspaces']['Insert']>
      }

      resources: {
        Row: {
          id: string
          workspace_id: string
          org_id: string
          title: string | null
          content: Json
          meta: Json
          resource_type: 'note' | 'document' | 'report' | 'dashboard' | 'kpi' | 'chart' | 'other' | 'file' | 'doc' | 'campaign' | 'task'
          type: string | null
          visibility: 'private' | 'shared' | 'public' | 'shared_to_cto' | 'shared_to_ceo' | 'org_public'
          target_role: string | null
          created_by: string | null
          created_at: string
          updated_at: string
          accessed_at: string
        }
        Insert: Omit<Database['public']['Tables']['resources']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['resources']['Insert']>
      }

      files: {
        Row: {
          id: string
          resource_id: string
          storage_key: string
          size_bytes: number | null
          mime: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['files']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['files']['Insert']>
      }

      resource_acl: {
        Row: {
          id: string
          resource_id: string
          grantee_user_id: string | null
          grantee_role: string | null
          permission: 'read' | 'write' | 'admin'
          granted_by: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['resource_acl']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['resource_acl']['Insert']>
      }

      audit_logs: {
        Row: {
          id: string
          org_id: string | null
          user_id: string | null
          action: string
          resource_type: string | null
          resource_id: string | null
          metadata: Json
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['audit_logs']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['audit_logs']['Insert']>
      }

      // ============================================
      // DEPARTMENT UPLOADS
      // ============================================

      department_uploads: {
        Row: {
          id: string
          org_id: string | null
          uploaded_by: string | null
          department: 'concierge' | 'sales' | 'operations' | 'finance' | 'saudemax'
          subdepartment: string | null
          file_name: string
          file_size: number
          row_count: number
          rows_imported: number
          rows_failed: number
          status: 'pending' | 'processing' | 'completed' | 'failed' | 'approved' | 'rejected'
          validation_errors: Json | null
          batch_id: string
          approved_by: string | null
          approved_at: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['department_uploads']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['department_uploads']['Insert']>
      }

      department_notes: {
        Row: {
          id: string
          org_id: string
          department_id: string
          upload_id: string | null
          note_content: string
          is_pinned: boolean
          tags: string[]
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['department_notes']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['department_notes']['Insert']>
      }

      upload_templates: {
        Row: {
          id: string
          department: string
          subdepartment: string | null
          template_name: string
          description: string | null
          required_columns: string[]
          optional_columns: string[] | null
          sample_data: Json | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['upload_templates']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['upload_templates']['Insert']>
      }

      // ============================================
      // INTEGRATIONS
      // ============================================

      integrations_secrets: {
        Row: {
          id: string
          name: string
          provider: string
          encrypted_value: string
          description: string | null
          is_active: boolean
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['integrations_secrets']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['integrations_secrets']['Insert']>
      }

      webhooks_config: {
        Row: {
          id: string
          name: string
          url: string
          secret: string | null
          events: string[]
          is_active: boolean
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['webhooks_config']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['webhooks_config']['Insert']>
      }

      sftp_configs: {
        Row: {
          id: string
          name: string
          host: string
          port: number
          username: string
          password: string | null
          private_key: string | null
          remote_path: string
          is_active: boolean
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['sftp_configs']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['sftp_configs']['Insert']>
      }

      monday_config: {
        Row: {
          id: string
          api_key: string
          board_id: string | null
          workspace_id: string | null
          is_active: boolean
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['monday_config']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['monday_config']['Insert']>
      }

      monday_tasks: {
        Row: {
          id: string
          monday_item_id: string
          name: string
          status: string | null
          assignee: string | null
          due_date: string | null
          board_id: string | null
          group_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['monday_tasks']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['monday_tasks']['Insert']>
      }

      marketing_integrations: {
        Row: {
          id: string
          platform: string
          api_key: string | null
          access_token: string | null
          refresh_token: string | null
          account_id: string | null
          is_active: boolean
          settings: Json
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['marketing_integrations']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['marketing_integrations']['Insert']>
      }

      // ============================================
      // MARKETING
      // ============================================

      marketing_properties: {
        Row: {
          id: string
          user_id: string
          name: string
          domain: string
          description: string | null
          industry: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['marketing_properties']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['marketing_properties']['Insert']>
      }

      marketing_tracking_platforms: {
        Row: {
          id: string
          property_id: string
          platform_name: string
          tracking_id: string | null
          is_active: boolean
          configuration: Json
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['marketing_tracking_platforms']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['marketing_tracking_platforms']['Insert']>
      }

      marketing_utm_campaigns: {
        Row: {
          id: string
          property_id: string
          user_id: string
          campaign_name: string
          utm_source: string
          utm_medium: string
          utm_campaign: string
          utm_term: string | null
          utm_content: string | null
          destination_url: string
          short_url: string | null
          qr_code_url: string | null
          notes: string | null
          start_date: string | null
          end_date: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['marketing_utm_campaigns']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['marketing_utm_campaigns']['Insert']>
      }

      // ============================================
      // CEO REPORTING DATA
      // ============================================

      concierge_interactions: {
        Row: {
          id: string
          org_id: string
          member_id: string | null
          interaction_type: string | null
          agent_name: string | null
          notes: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['concierge_interactions']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['concierge_interactions']['Insert']>
      }

      sales_orders: {
        Row: {
          id: string
          org_id: string | null
          order_date: string | null
          order_id: string | null
          member_id: string | null
          amount: string | null
          plan: string | null
          status: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['sales_orders']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['sales_orders']['Insert']>
      }

      sales_leads: {
        Row: {
          id: string
          org_id: string | null
          lead_date: string | null
          source: string | null
          name: string | null
          email: string | null
          phone: string | null
          status: string | null
          assigned_to: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['sales_leads']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['sales_leads']['Insert']>
      }

      sales_cancelations: {
        Row: {
          id: string
          org_id: string | null
          cancelation_date: string | null
          member_id: string | null
          reason: string | null
          plan: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['sales_cancelations']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['sales_cancelations']['Insert']>
      }

      plan_cancellations: {
        Row: {
          id: string
          org_id: string | null
          cancellation_date: string | null
          member_id: string | null
          reason: string | null
          plan_type: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['plan_cancellations']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['plan_cancellations']['Insert']>
      }

      finance_records: {
        Row: {
          id: string
          org_id: string | null
          record_date: string | null
          category: string | null
          amount: number | null
          description: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['finance_records']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['finance_records']['Insert']>
      }

      saudemax_data: {
        Row: {
          id: string
          org_id: string | null
          report_date: string | null
          metric_type: string | null
          metric_value: string | null
          notes: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['saudemax_data']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['saudemax_data']['Insert']>
      }

      // ============================================
      // TICKETS & SUPPORT
      // ============================================

      tickets_cache: {
        Row: {
          id: string
          external_id: string | null
          title: string
          description: string | null
          status: string
          priority: string | null
          assignee: string | null
          requester: string | null
          source: string | null
          tags: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['tickets_cache']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['tickets_cache']['Insert']>
      }

      // ============================================
      // TRAINING & COMPLIANCE
      // ============================================

      hipaa_training_attendance: {
        Row: {
          id: string
          user_id: string | null
          training_id: string | null
          attended_at: string | null
          completed: boolean
          score: number | null
          certificate_url: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['hipaa_training_attendance']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['hipaa_training_attendance']['Insert']>
      }

      hipaa_evidence: {
        Row: {
          id: string
          control_id: string | null
          title: string
          description: string | null
          file_url: string | null
          uploaded_by: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['hipaa_evidence']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['hipaa_evidence']['Insert']>
      }

      business_associate_agreements: {
        Row: {
          id: string
          vendor_name: string
          contact_name: string | null
          contact_email: string | null
          status: string
          effective_date: string | null
          expiration_date: string | null
          document_url: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['business_associate_agreements']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['business_associate_agreements']['Insert']>
      }

      // ============================================
      // SYNC & LOGS
      // ============================================

      sync_logs: {
        Row: {
          id: string
          source: string
          status: string
          records_synced: number | null
          error_message: string | null
          timestamp: string
        }
        Insert: Omit<Database['public']['Tables']['sync_logs']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['sync_logs']['Insert']>
      }

      monday_sync_log: {
        Row: {
          id: string
          sync_type: string
          status: string
          items_synced: number | null
          error_message: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['monday_sync_log']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['monday_sync_log']['Insert']>
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      user_role: 'ceo' | 'cto' | 'cfo' | 'cmo' | 'admin' | 'manager' | 'staff'
      project_status: 'Planning' | 'Building' | 'Live'
      roadmap_status: 'Backlog' | 'In Progress' | 'Complete'
      priority_level: 'Low' | 'Medium' | 'High'
    }
  }
}

// Helper type for extracting Row types
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']
