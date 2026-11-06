export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      activity: {
        Row: {
          actor_id: string | null
          created_at: string
          entity_id: string
          entity_type: string
          from_value: string | null
          id: string
          meta: Json | null
          to_value: string | null
          verb: string
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          entity_id: string
          entity_type: string
          from_value?: string | null
          id?: string
          meta?: Json | null
          to_value?: string | null
          verb: string
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          entity_id?: string
          entity_type?: string
          from_value?: string | null
          id?: string
          meta?: Json | null
          to_value?: string | null
          verb?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      availability: {
        Row: {
          created_at: string
          end_time: string
          id: string
          is_active: boolean
          start_time: string
          weekday: number
        }
        Insert: {
          created_at?: string
          end_time: string
          id?: string
          is_active?: boolean
          start_time: string
          weekday: number
        }
        Update: {
          created_at?: string
          end_time?: string
          id?: string
          is_active?: boolean
          start_time?: string
          weekday?: number
        }
        Relationships: []
      }
      availability_rules: {
        Row: {
          business_timezone: string
          default_meet_link: string | null
          gap_minutes: number
          id: boolean
          max_horizon_days: number
          max_per_day: number
          min_notice_hours: number
          slot_minutes: number
        }
        Insert: {
          business_timezone?: string
          default_meet_link?: string | null
          gap_minutes?: number
          id?: boolean
          max_horizon_days?: number
          max_per_day?: number
          min_notice_hours?: number
          slot_minutes?: number
        }
        Update: {
          business_timezone?: string
          default_meet_link?: string | null
          gap_minutes?: number
          id?: boolean
          max_horizon_days?: number
          max_per_day?: number
          min_notice_hours?: number
          slot_minutes?: number
        }
        Relationships: []
      }
      blocked_dates: {
        Row: {
          created_at: string
          date_from: string
          date_to: string
          id: string
          reason: string | null
        }
        Insert: {
          created_at?: string
          date_from: string
          date_to: string
          id?: string
          reason?: string | null
        }
        Update: {
          created_at?: string
          date_from?: string
          date_to?: string
          id?: string
          reason?: string | null
        }
        Relationships: []
      }
      booking_files: {
        Row: {
          booking_id: string | null
          bytes: number | null
          created_at: string
          id: string
          mime: string | null
          original_name: string | null
          storage_path: string
        }
        Insert: {
          booking_id?: string | null
          bytes?: number | null
          created_at?: string
          id?: string
          mime?: string | null
          original_name?: string | null
          storage_path: string
        }
        Update: {
          booking_id?: string | null
          bytes?: number | null
          created_at?: string
          id?: string
          mime?: string | null
          original_name?: string | null
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_files_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          brief: Json
          budget_band: string | null
          client_id: string
          completed_at: string | null
          created_at: string
          duration_minutes: number
          id: string
          lead_id: string | null
          meet_link: string | null
          notes_internal: string | null
          notes_shared: string | null
          owner_id: string | null
          recording_url: string | null
          reminder_1_sent_at: string | null
          reminder_24_sent_at: string | null
          reschedule_count: number
          slot_at: string
          source: Json | null
          status: Database["public"]["Enums"]["booking_status"]
          updated_at: string
        }
        Insert: {
          brief?: Json
          budget_band?: string | null
          client_id: string
          completed_at?: string | null
          created_at?: string
          duration_minutes?: number
          id?: string
          lead_id?: string | null
          meet_link?: string | null
          notes_internal?: string | null
          notes_shared?: string | null
          owner_id?: string | null
          recording_url?: string | null
          reminder_1_sent_at?: string | null
          reminder_24_sent_at?: string | null
          reschedule_count?: number
          slot_at: string
          source?: Json | null
          status?: Database["public"]["Enums"]["booking_status"]
          updated_at?: string
        }
        Update: {
          brief?: Json
          budget_band?: string | null
          client_id?: string
          completed_at?: string | null
          created_at?: string
          duration_minutes?: number
          id?: string
          lead_id?: string | null
          meet_link?: string | null
          notes_internal?: string | null
          notes_shared?: string | null
          owner_id?: string | null
          recording_url?: string | null
          reminder_1_sent_at?: string | null
          reminder_24_sent_at?: string | null
          reschedule_count?: number
          slot_at?: string
          source?: Json | null
          status?: Database["public"]["Enums"]["booking_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      clients: {
        Row: {
          brand_name: string | null
          contact_name: string | null
          created_at: string
          email: string | null
          id: string
          is_customer: boolean
          notes: string | null
          owner_id: string | null
          profile_id: string | null
          updated_at: string
          website: string | null
          whatsapp: string | null
        }
        Insert: {
          brand_name?: string | null
          contact_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_customer?: boolean
          notes?: string | null
          owner_id?: string | null
          profile_id?: string | null
          updated_at?: string
          website?: string | null
          whatsapp?: string | null
        }
        Update: {
          brand_name?: string | null
          contact_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_customer?: boolean
          notes?: string | null
          owner_id?: string | null
          profile_id?: string | null
          updated_at?: string
          website?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "clients_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      deliverables: {
        Row: {
          created_at: string
          decided_at: string | null
          external_url: string | null
          id: string
          project_id: string
          status: Database["public"]["Enums"]["deliverable_status"]
          storage_path: string | null
          submitted_by: string | null
          title: string
          updated_at: string
          version: number
        }
        Insert: {
          created_at?: string
          decided_at?: string | null
          external_url?: string | null
          id?: string
          project_id: string
          status?: Database["public"]["Enums"]["deliverable_status"]
          storage_path?: string | null
          submitted_by?: string | null
          title: string
          updated_at?: string
          version?: number
        }
        Update: {
          created_at?: string
          decided_at?: string | null
          external_url?: string | null
          id?: string
          project_id?: string
          status?: Database["public"]["Enums"]["deliverable_status"]
          storage_path?: string | null
          submitted_by?: string | null
          title?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "deliverables_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliverables_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      invoice_items: {
        Row: {
          created_at: string
          description: string
          id: string
          invoice_id: string
          quantity: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          invoice_id: string
          quantity?: number
          unit_price: number
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          invoice_id?: string
          quantity?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          client_id: string
          created_at: string
          created_by: string | null
          currency: string
          due_at: string | null
          id: string
          issued_at: string | null
          notes: string | null
          number: string | null
          paid_total: number
          project_id: string | null
          status: Database["public"]["Enums"]["invoice_status"]
          subtotal: number
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          created_by?: string | null
          currency?: string
          due_at?: string | null
          id?: string
          issued_at?: string | null
          notes?: string | null
          number?: string | null
          paid_total?: number
          project_id?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          subtotal?: number
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          created_by?: string | null
          currency?: string
          due_at?: string | null
          id?: string
          issued_at?: string | null
          notes?: string | null
          number?: string | null
          paid_total?: number
          project_id?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          subtotal?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          booking_id: string | null
          client_id: string
          created_at: string
          currency: string | null
          id: string
          lost_reason: string | null
          lost_reason_category: string | null
          owner_id: string | null
          reopened_from: string | null
          source: Json | null
          stage: Database["public"]["Enums"]["lead_stage"]
          stage_changed_at: string
          updated_at: string
          value_estimate: number | null
        }
        Insert: {
          booking_id?: string | null
          client_id: string
          created_at?: string
          currency?: string | null
          id?: string
          lost_reason?: string | null
          lost_reason_category?: string | null
          owner_id?: string | null
          reopened_from?: string | null
          source?: Json | null
          stage?: Database["public"]["Enums"]["lead_stage"]
          stage_changed_at?: string
          updated_at?: string
          value_estimate?: number | null
        }
        Update: {
          booking_id?: string | null
          client_id?: string
          created_at?: string
          currency?: string | null
          id?: string
          lost_reason?: string | null
          lost_reason_category?: string | null
          owner_id?: string | null
          reopened_from?: string | null
          source?: Json | null
          stage?: Database["public"]["Enums"]["lead_stage"]
          stage_changed_at?: string
          updated_at?: string
          value_estimate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "leads_reopened_from_fkey"
            columns: ["reopened_from"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          invoice_id: string
          method: string
          paid_at: string
          recorded_by: string | null
          reference: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          invoice_id: string
          method?: string
          paid_at?: string
          recorded_by?: string | null
          reference?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          invoice_id?: string
          method?: string
          paid_at?: string
          recorded_by?: string | null
          reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          is_active: boolean
          timezone: string
          updated_at: string
          user_id: string
          whatsapp: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          is_active?: boolean
          timezone?: string
          updated_at?: string
          user_id: string
          whatsapp?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          is_active?: boolean
          timezone?: string
          updated_at?: string
          user_id?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      project_members: {
        Row: {
          created_at: string
          project_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          project_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          project_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      projects: {
        Row: {
          brief: Json
          client_id: string
          created_at: string
          due_at: string | null
          id: string
          lead_id: string | null
          owner_id: string | null
          revision_limit: number
          stage: Database["public"]["Enums"]["project_stage"]
          title: string
          updated_at: string
        }
        Insert: {
          brief?: Json
          client_id: string
          created_at?: string
          due_at?: string | null
          id?: string
          lead_id?: string | null
          owner_id?: string | null
          revision_limit?: number
          stage?: Database["public"]["Enums"]["project_stage"]
          title: string
          updated_at?: string
        }
        Update: {
          brief?: Json
          client_id?: string
          created_at?: string
          due_at?: string | null
          id?: string
          lead_id?: string | null
          owner_id?: string | null
          revision_limit?: number
          stage?: Database["public"]["Enums"]["project_stage"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: true
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      review_comments: {
        Row: {
          author_id: string
          body: string
          created_at: string
          deliverable_id: string
          id: string
          parent_id: string | null
          resolved: boolean
          timecode_ms: number | null
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          deliverable_id: string
          id?: string
          parent_id?: string | null
          resolved?: boolean
          timecode_ms?: number | null
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          deliverable_id?: string
          id?: string
          parent_id?: string | null
          resolved?: boolean
          timecode_ms?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "review_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "review_comments_deliverable_id_fkey"
            columns: ["deliverable_id"]
            isOneToOne: false
            referencedRelation: "deliverables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "review_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assignee_id: string | null
          created_at: string
          due_at: string | null
          id: string
          project_id: string
          status: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at: string
        }
        Insert: {
          assignee_id?: string | null
          created_at?: string
          due_at?: string | null
          id?: string
          project_id: string
          status?: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at?: string
        }
        Update: {
          assignee_id?: string | null
          created_at?: string
          due_at?: string | null
          id?: string
          project_id?: string
          status?: Database["public"]["Enums"]["task_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      work_categories: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      work_services: {
        Row: {
          position: number
          service_slug: string
          work_id: string
        }
        Insert: {
          position?: number
          service_slug: string
          work_id: string
        }
        Update: {
          position?: number
          service_slug?: string
          work_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_services_work_id_fkey"
            columns: ["work_id"]
            isOneToOne: false
            referencedRelation: "works"
            referencedColumns: ["id"]
          },
        ]
      }
      works: {
        Row: {
          aspect: string
          case_study: Json
          category_id: string | null
          client_name: string | null
          created_at: string
          duration_sec: number | null
          featured: boolean
          id: string
          industry: string | null
          published: boolean
          seo_description: string | null
          seo_title: string | null
          short_description: string | null
          slug: string
          sort_order: number
          tags: string[]
          thumbnail_url: string | null
          title: string
          updated_at: string
          vimeo_id: string
          year: number | null
        }
        Insert: {
          aspect?: string
          case_study?: Json
          category_id?: string | null
          client_name?: string | null
          created_at?: string
          duration_sec?: number | null
          featured?: boolean
          id?: string
          industry?: string | null
          published?: boolean
          seo_description?: string | null
          seo_title?: string | null
          short_description?: string | null
          slug: string
          sort_order?: number
          tags?: string[]
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          vimeo_id: string
          year?: number | null
        }
        Update: {
          aspect?: string
          case_study?: Json
          category_id?: string | null
          client_name?: string | null
          created_at?: string
          duration_sec?: number | null
          featured?: boolean
          id?: string
          industry?: string | null
          published?: boolean
          seo_description?: string | null
          seo_title?: string | null
          short_description?: string | null
          slug?: string
          sort_order?: number
          tags?: string[]
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          vimeo_id?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "works_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "work_categories"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      client_call_host: { Args: { p_booking_id: string }; Returns: string }
      create_booking: {
        Args: {
          p_brand: string
          p_budget_band: string
          p_email: string
          p_message: string
          p_name: string
          p_need: string
          p_slot_at: string
          p_source?: Json
          p_whatsapp: string
        }
        Returns: string
      }
      open_slots: {
        Args: { p_from?: string; p_to?: string }
        Returns: {
          local_day: string
          local_time: string
          slot_at: string
        }[]
      }
      password_previously_used: {
        Args: { p_password: string }
        Returns: boolean
      }
    }
    Enums: {
      booking_status:
        | "requested"
        | "in_review"
        | "confirmed"
        | "completed"
        | "cancelled"
        | "no_show"
        | "rescheduled"
      deliverable_status:
        | "submitted"
        | "changes_requested"
        | "resubmitted"
        | "approved"
      invoice_status:
        | "draft"
        | "sent"
        | "partially_paid"
        | "paid"
        | "overdue"
        | "void"
      lead_stage:
        | "new"
        | "contacted"
        | "qualified"
        | "proposal_sent"
        | "won"
        | "lost"
      project_stage:
        | "brief"
        | "script"
        | "assets"
        | "first_cut"
        | "revision"
        | "final"
        | "delivered"
      task_status: "todo" | "in_progress" | "in_review" | "done" | "blocked"
      user_role: "owner" | "manager" | "member" | "client"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      booking_status: [
        "requested",
        "in_review",
        "confirmed",
        "completed",
        "cancelled",
        "no_show",
        "rescheduled",
      ],
      deliverable_status: [
        "submitted",
        "changes_requested",
        "resubmitted",
        "approved",
      ],
      invoice_status: [
        "draft",
        "sent",
        "partially_paid",
        "paid",
        "overdue",
        "void",
      ],
      lead_stage: [
        "new",
        "contacted",
        "qualified",
        "proposal_sent",
        "won",
        "lost",
      ],
      project_stage: [
        "brief",
        "script",
        "assets",
        "first_cut",
        "revision",
        "final",
        "delivered",
      ],
      task_status: ["todo", "in_progress", "in_review", "done", "blocked"],
      user_role: ["owner", "manager", "member", "client"],
    },
  },
} as const
