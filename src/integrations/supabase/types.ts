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
      agreement_templates: {
        Row: {
          body: string
          created_at: string
          id: string
          is_current: boolean
          job_type: string
          key_terms: Json
          name: string
          version: number
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          is_current?: boolean
          job_type: string
          key_terms?: Json
          name: string
          version: number
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          is_current?: boolean
          job_type?: string
          key_terms?: Json
          name?: string
          version?: number
        }
        Relationships: []
      }
      application_answers: {
        Row: {
          answer: Json | null
          application_id: string
          created_at: string
          file_url: string | null
          id: string
          job_question_id: string
          updated_at: string
        }
        Insert: {
          answer?: Json | null
          application_id: string
          created_at?: string
          file_url?: string | null
          id?: string
          job_question_id: string
          updated_at?: string
        }
        Update: {
          answer?: Json | null
          application_id?: string
          created_at?: string
          file_url?: string | null
          id?: string
          job_question_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "application_answers_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "application_answers_job_question_id_fkey"
            columns: ["job_question_id"]
            isOneToOne: false
            referencedRelation: "job_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      application_events: {
        Row: {
          application_id: string
          created_at: string
          created_by: string | null
          from_status: string | null
          id: string
          message_to_candidate: string | null
          reason: string | null
          to_status: string
          visible_to_candidate: boolean
        }
        Insert: {
          application_id: string
          created_at?: string
          created_by?: string | null
          from_status?: string | null
          id?: string
          message_to_candidate?: string | null
          reason?: string | null
          to_status: string
          visible_to_candidate?: boolean
        }
        Update: {
          application_id?: string
          created_at?: string
          created_by?: string | null
          from_status?: string | null
          id?: string
          message_to_candidate?: string | null
          reason?: string | null
          to_status?: string
          visible_to_candidate?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "application_events_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "application_events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      application_pdf_versions: {
        Row: {
          application_id: string
          created_at: string
          document_id: string
          event_id: string
          file_path: string
          id: string
          pdf_sha256: string
          status_key: string
          status_label: string
          template_id: string
          template_version: number
        }
        Insert: {
          application_id: string
          created_at?: string
          document_id: string
          event_id: string
          file_path: string
          id?: string
          pdf_sha256: string
          status_key: string
          status_label: string
          template_id: string
          template_version: number
        }
        Update: {
          application_id?: string
          created_at?: string
          document_id?: string
          event_id?: string
          file_path?: string
          id?: string
          pdf_sha256?: string
          status_key?: string
          status_label?: string
          template_id?: string
          template_version?: number
        }
        Relationships: [
          {
            foreignKeyName: "application_pdf_versions_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "application_pdf_versions_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "agreement_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      application_reviews: {
        Row: {
          application_id: string
          assigned_reviewer_id: string | null
          commitment_score: number | null
          created_at: string
          id: string
          knockout_flags: Json
          reviewer_id: string
          skill_score: number | null
          thinking_score: number | null
          updated_at: string
        }
        Insert: {
          application_id: string
          assigned_reviewer_id?: string | null
          commitment_score?: number | null
          created_at?: string
          id?: string
          knockout_flags?: Json
          reviewer_id: string
          skill_score?: number | null
          thinking_score?: number | null
          updated_at?: string
        }
        Update: {
          application_id?: string
          assigned_reviewer_id?: string | null
          commitment_score?: number | null
          created_at?: string
          id?: string
          knockout_flags?: Json
          reviewer_id?: string
          skill_score?: number | null
          thinking_score?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "application_reviews_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "application_reviews_assigned_reviewer_id_fkey"
            columns: ["assigned_reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "application_reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      applications: {
        Row: {
          candidate_id: string
          created_at: string
          current_step: number
          cv_path: string | null
          id: string
          is_draft: boolean
          is_test: boolean | null
          job_id: string
          passport_photo_path: string | null
          public_code: string
          status_key: string
          submitted_at: string | null
          task_submission_url: string | null
          task_submitted_at: string | null
          updated_at: string
          withdrawn_at: string | null
        }
        Insert: {
          candidate_id: string
          created_at?: string
          current_step?: number
          cv_path?: string | null
          id?: string
          is_draft?: boolean
          is_test?: boolean | null
          job_id: string
          passport_photo_path?: string | null
          public_code: string
          status_key?: string
          submitted_at?: string | null
          task_submission_url?: string | null
          task_submitted_at?: string | null
          updated_at?: string
          withdrawn_at?: string | null
        }
        Update: {
          candidate_id?: string
          created_at?: string
          current_step?: number
          cv_path?: string | null
          id?: string
          is_draft?: boolean
          is_test?: boolean | null
          job_id?: string
          passport_photo_path?: string | null
          public_code?: string
          status_key?: string
          submitted_at?: string | null
          task_submission_url?: string | null
          task_submitted_at?: string | null
          updated_at?: string
          withdrawn_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "applications_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
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
      candidates: {
        Row: {
          area: string | null
          created_at: string
          current_occupation: string | null
          education: string | null
          email_notifications: boolean
          full_name: string
          id: string
          phone: string | null
          photo_url: string | null
          portfolio_url: string | null
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          area?: string | null
          created_at?: string
          current_occupation?: string | null
          education?: string | null
          email_notifications?: boolean
          full_name?: string
          id: string
          phone?: string | null
          photo_url?: string | null
          portfolio_url?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          area?: string | null
          created_at?: string
          current_occupation?: string | null
          education?: string | null
          email_notifications?: boolean
          full_name?: string
          id?: string
          phone?: string | null
          photo_url?: string | null
          portfolio_url?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "candidates_id_fkey"
            columns: ["id"]
            isOneToOne: true
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
      delivery_outbox: {
        Row: {
          application_id: string | null
          attempts: number
          booking_id: string | null
          created_at: string
          event_id: string
          id: string
          journey_id: string | null
          kind: string
          last_error: string | null
          next_attempt_at: string
          payload: Json
          result: Json | null
          sent_at: string | null
          status: string
          trigger_key: string
          updated_at: string
        }
        Insert: {
          application_id?: string | null
          attempts?: number
          booking_id?: string | null
          created_at?: string
          event_id: string
          id?: string
          journey_id?: string | null
          kind: string
          last_error?: string | null
          next_attempt_at?: string
          payload?: Json
          result?: Json | null
          sent_at?: string | null
          status?: string
          trigger_key?: string
          updated_at?: string
        }
        Update: {
          application_id?: string | null
          attempts?: number
          booking_id?: string | null
          created_at?: string
          event_id?: string
          id?: string
          journey_id?: string | null
          kind?: string
          last_error?: string | null
          next_attempt_at?: string
          payload?: Json
          result?: Json | null
          sent_at?: string | null
          status?: string
          trigger_key?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "delivery_outbox_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_outbox_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_outbox_journey_id_fkey"
            columns: ["journey_id"]
            isOneToOne: false
            referencedRelation: "member_journeys"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          candidate_id: string
          created_at: string
          file_path: string
          id: string
          kind: string
          title: string
        }
        Insert: {
          candidate_id: string
          created_at?: string
          file_path: string
          id?: string
          kind: string
          title: string
        }
        Update: {
          candidate_id?: string
          created_at?: string
          file_path?: string
          id?: string
          kind?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
        ]
      }
      email_log: {
        Row: {
          application_id: string | null
          booking_id: string | null
          created_at: string
          error: string | null
          id: string
          outbox_id: string | null
          provider_id: string | null
          status: string
          to_email: string
          trigger_key: string
        }
        Insert: {
          application_id?: string | null
          booking_id?: string | null
          created_at?: string
          error?: string | null
          id?: string
          outbox_id?: string | null
          provider_id?: string | null
          status: string
          to_email: string
          trigger_key: string
        }
        Update: {
          application_id?: string | null
          booking_id?: string | null
          created_at?: string
          error?: string | null
          id?: string
          outbox_id?: string | null
          provider_id?: string | null
          status?: string
          to_email?: string
          trigger_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_log_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_log_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_log_outbox_id_fkey"
            columns: ["outbox_id"]
            isOneToOne: false
            referencedRelation: "delivery_outbox"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_log_trigger_key_fkey"
            columns: ["trigger_key"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["trigger_key"]
          },
        ]
      }
      email_templates: {
        Row: {
          body: string
          created_at: string
          id: string
          is_enabled: boolean
          subject: string
          trigger_key: string
          updated_at: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          is_enabled?: boolean
          subject: string
          trigger_key: string
          updated_at?: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          is_enabled?: boolean
          subject?: string
          trigger_key?: string
          updated_at?: string
        }
        Relationships: []
      }
      enquiries: {
        Row: {
          attachment_path: string | null
          budget_band: string | null
          client_id: string
          created_at: string
          id: string
          lead_id: string | null
          message: string | null
          service_interest: string | null
          source_page: string | null
        }
        Insert: {
          attachment_path?: string | null
          budget_band?: string | null
          client_id: string
          created_at?: string
          id?: string
          lead_id?: string | null
          message?: string | null
          service_interest?: string | null
          source_page?: string | null
        }
        Update: {
          attachment_path?: string | null
          budget_band?: string | null
          client_id?: string
          created_at?: string
          id?: string
          lead_id?: string | null
          message?: string | null
          service_interest?: string | null
          source_page?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "enquiries_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enquiries_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      hiring_agreement_reviews: {
        Row: {
          legal_review_pending: boolean
          template_id: string
          updated_at: string
        }
        Insert: {
          legal_review_pending?: boolean
          template_id: string
          updated_at?: string
        }
        Update: {
          legal_review_pending?: boolean
          template_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hiring_agreement_reviews_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: true
            referencedRelation: "agreement_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      hiring_question_snapshots: {
        Row: {
          created_at: string
          question_id: string
        }
        Insert: {
          created_at?: string
          question_id: string
        }
        Update: {
          created_at?: string
          question_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hiring_question_snapshots_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: true
            referencedRelation: "question_bank"
            referencedColumns: ["id"]
          },
        ]
      }
      hiring_question_sources: {
        Row: {
          bank_question_id: string
          created_at: string
          job_question_id: string
        }
        Insert: {
          bank_question_id: string
          created_at?: string
          job_question_id: string
        }
        Update: {
          bank_question_id?: string
          created_at?: string
          job_question_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hiring_question_sources_bank_question_id_fkey"
            columns: ["bank_question_id"]
            isOneToOne: false
            referencedRelation: "question_bank"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hiring_question_sources_job_question_id_fkey"
            columns: ["job_question_id"]
            isOneToOne: true
            referencedRelation: "job_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      hiring_settings: {
        Row: {
          authorised_signatory_name: string
          authorised_signatory_title: string
          authorised_signature_url: string | null
          company_address: string | null
          created_at: string
          from_email: string
          google_login_enabled: boolean | null
          id: boolean
          internship_video_poster_url: string | null
          internship_video_title: string | null
          internship_video_url: string | null
          notify_admin_emails: string[]
          pdf_logo_url: string | null
          reply_to: string | null
          updated_at: string
          whatsapp_help_url: string | null
        }
        Insert: {
          authorised_signatory_name?: string
          authorised_signatory_title?: string
          authorised_signature_url?: string | null
          company_address?: string | null
          created_at?: string
          from_email?: string
          google_login_enabled?: boolean | null
          id?: boolean
          internship_video_poster_url?: string | null
          internship_video_title?: string | null
          internship_video_url?: string | null
          notify_admin_emails?: string[]
          pdf_logo_url?: string | null
          reply_to?: string | null
          updated_at?: string
          whatsapp_help_url?: string | null
        }
        Update: {
          authorised_signatory_name?: string
          authorised_signatory_title?: string
          authorised_signature_url?: string | null
          company_address?: string | null
          created_at?: string
          from_email?: string
          google_login_enabled?: boolean | null
          id?: boolean
          internship_video_poster_url?: string | null
          internship_video_title?: string | null
          internship_video_url?: string | null
          notify_admin_emails?: string[]
          pdf_logo_url?: string | null
          reply_to?: string | null
          updated_at?: string
          whatsapp_help_url?: string | null
        }
        Relationships: []
      }
      hiring_user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      internal_notes: {
        Row: {
          application_id: string
          author_id: string
          body: string
          created_at: string
          id: string
        }
        Insert: {
          application_id: string
          author_id: string
          body: string
          created_at?: string
          id?: string
        }
        Update: {
          application_id?: string
          author_id?: string
          body?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "internal_notes_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "internal_notes_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      interviews: {
        Row: {
          application_id: string
          concerns: string | null
          created_at: string
          duration_minutes: number
          id: string
          interviewer_id: string
          meet_link: string | null
          mode: string
          office_address: string | null
          recommendation: string | null
          reminder_sent_at: string | null
          result_score: number | null
          scheduled_at: string
          status: string
          strengths: string | null
          updated_at: string
        }
        Insert: {
          application_id: string
          concerns?: string | null
          created_at?: string
          duration_minutes?: number
          id?: string
          interviewer_id: string
          meet_link?: string | null
          mode: string
          office_address?: string | null
          recommendation?: string | null
          reminder_sent_at?: string | null
          result_score?: number | null
          scheduled_at: string
          status?: string
          strengths?: string | null
          updated_at?: string
        }
        Update: {
          application_id?: string
          concerns?: string | null
          created_at?: string
          duration_minutes?: number
          id?: string
          interviewer_id?: string
          meet_link?: string | null
          mode?: string
          office_address?: string | null
          recommendation?: string | null
          reminder_sent_at?: string | null
          result_score?: number | null
          scheduled_at?: string
          status?: string
          strengths?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "interviews_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interviews_interviewer_id_fkey"
            columns: ["interviewer_id"]
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
      job_questions: {
        Row: {
          created_at: string
          id: string
          job_id: string
          knockout_rule: Json | null
          label_override: string | null
          options: Json | null
          question_id: string | null
          required: boolean
          retired: boolean
          section: string | null
          sort_order: number
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          job_id: string
          knockout_rule?: Json | null
          label_override?: string | null
          options?: Json | null
          question_id?: string | null
          required?: boolean
          retired?: boolean
          section?: string | null
          sort_order?: number
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          job_id?: string
          knockout_rule?: Json | null
          label_override?: string | null
          options?: Json | null
          question_id?: string | null
          required?: boolean
          retired?: boolean
          section?: string | null
          sort_order?: number
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_questions_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_questions_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "question_bank"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          agreement_template_id: string | null
          application_pipeline_id: string
          benefits: string[]
          cover_image_url: string | null
          created_at: string
          created_by: string | null
          deadline: string | null
          description: string | null
          experience_level: string
          id: string
          journey_pipeline_id: string | null
          nice_to_have: string[]
          requirements: string[]
          responsibilities: string[]
          schedule: string
          schedule_text: string | null
          seats: number | null
          slug: string
          status: string
          summary: string | null
          task_brief: string | null
          task_due_days: number | null
          task_enabled: boolean
          task_submission_type: string | null
          title: string
          tools: string[]
          type: string
          updated_at: string
          work_mode: string
        }
        Insert: {
          agreement_template_id?: string | null
          application_pipeline_id: string
          benefits?: string[]
          cover_image_url?: string | null
          created_at?: string
          created_by?: string | null
          deadline?: string | null
          description?: string | null
          experience_level?: string
          id?: string
          journey_pipeline_id?: string | null
          nice_to_have?: string[]
          requirements?: string[]
          responsibilities?: string[]
          schedule?: string
          schedule_text?: string | null
          seats?: number | null
          slug: string
          status?: string
          summary?: string | null
          task_brief?: string | null
          task_due_days?: number | null
          task_enabled?: boolean
          task_submission_type?: string | null
          title: string
          tools?: string[]
          type: string
          updated_at?: string
          work_mode: string
        }
        Update: {
          agreement_template_id?: string | null
          application_pipeline_id?: string
          benefits?: string[]
          cover_image_url?: string | null
          created_at?: string
          created_by?: string | null
          deadline?: string | null
          description?: string | null
          experience_level?: string
          id?: string
          journey_pipeline_id?: string | null
          nice_to_have?: string[]
          requirements?: string[]
          responsibilities?: string[]
          schedule?: string
          schedule_text?: string | null
          seats?: number | null
          slug?: string
          status?: string
          summary?: string | null
          task_brief?: string | null
          task_due_days?: number | null
          task_enabled?: boolean
          task_submission_type?: string | null
          title?: string
          tools?: string[]
          type?: string
          updated_at?: string
          work_mode?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobs_agreement_template_id_fkey"
            columns: ["agreement_template_id"]
            isOneToOne: false
            referencedRelation: "agreement_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_application_pipeline_id_fkey"
            columns: ["application_pipeline_id"]
            isOneToOne: false
            referencedRelation: "pipelines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "jobs_journey_pipeline_id_fkey"
            columns: ["journey_pipeline_id"]
            isOneToOne: false
            referencedRelation: "pipelines"
            referencedColumns: ["id"]
          },
        ]
      }
      journey_events: {
        Row: {
          created_at: string
          created_by: string | null
          from_stage: string | null
          id: string
          journey_id: string
          letter_path: string | null
          note: string | null
          to_stage: string
          visible_to_candidate: boolean
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          from_stage?: string | null
          id?: string
          journey_id: string
          letter_path?: string | null
          note?: string | null
          to_stage: string
          visible_to_candidate?: boolean
        }
        Update: {
          created_at?: string
          created_by?: string | null
          from_stage?: string | null
          id?: string
          journey_id?: string
          letter_path?: string | null
          note?: string | null
          to_stage?: string
          visible_to_candidate?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "journey_events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "journey_events_journey_id_fkey"
            columns: ["journey_id"]
            isOneToOne: false
            referencedRelation: "member_journeys"
            referencedColumns: ["id"]
          },
        ]
      }
      journey_milestone_templates: {
        Row: {
          created_at: string
          id: string
          pipeline_id: string
          sort_order: number
          stage_key: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          pipeline_id: string
          sort_order?: number
          stage_key: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          pipeline_id?: string
          sort_order?: number
          stage_key?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "journey_milestone_templates_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "pipelines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journey_milestone_templates_pipeline_id_stage_key_fkey"
            columns: ["pipeline_id", "stage_key"]
            isOneToOne: false
            referencedRelation: "pipeline_stages"
            referencedColumns: ["pipeline_id", "key"]
          },
        ]
      }
      journey_milestones: {
        Row: {
          created_at: string
          done_at: string | null
          id: string
          is_done: boolean
          journey_id: string
          sort_order: number
          stage_key: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          done_at?: string | null
          id?: string
          is_done?: boolean
          journey_id: string
          sort_order?: number
          stage_key: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          done_at?: string | null
          id?: string
          is_done?: boolean
          journey_id?: string
          sort_order?: number
          stage_key?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "journey_milestones_journey_id_fkey"
            columns: ["journey_id"]
            isOneToOne: false
            referencedRelation: "member_journeys"
            referencedColumns: ["id"]
          },
        ]
      }
      journey_notes: {
        Row: {
          author_id: string
          body: string
          created_at: string
          id: string
          journey_id: string
          updated_at: string
          visible_to_candidate: boolean
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          id?: string
          journey_id: string
          updated_at?: string
          visible_to_candidate?: boolean
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          id?: string
          journey_id?: string
          updated_at?: string
          visible_to_candidate?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "journey_notes_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "journey_notes_journey_id_fkey"
            columns: ["journey_id"]
            isOneToOne: false
            referencedRelation: "member_journeys"
            referencedColumns: ["id"]
          },
        ]
      }
      journey_projects: {
        Row: {
          amount: number | null
          created_at: string
          finished_at: string | null
          id: string
          is_client_work: boolean
          is_paid: boolean
          journey_id: string
          note: string | null
          started_at: string | null
          title: string
          updated_at: string
        }
        Insert: {
          amount?: number | null
          created_at?: string
          finished_at?: string | null
          id?: string
          is_client_work?: boolean
          is_paid?: boolean
          journey_id: string
          note?: string | null
          started_at?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          amount?: number | null
          created_at?: string
          finished_at?: string | null
          id?: string
          is_client_work?: boolean
          is_paid?: boolean
          journey_id?: string
          note?: string | null
          started_at?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "journey_projects_journey_id_fkey"
            columns: ["journey_id"]
            isOneToOne: false
            referencedRelation: "member_journeys"
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
      letter_templates: {
        Row: {
          body: string
          created_at: string
          id: string
          is_current: boolean
          kind: string
          legal_review_pending: boolean
          name: string
          updated_at: string
          version: number
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          is_current?: boolean
          kind: string
          legal_review_pending?: boolean
          name: string
          updated_at?: string
          version?: number
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          is_current?: boolean
          kind?: string
          legal_review_pending?: boolean
          name?: string
          updated_at?: string
          version?: number
        }
        Relationships: []
      }
      member_journeys: {
        Row: {
          application_id: string
          candidate_id: string
          created_at: string
          end_reason: string | null
          ended_at: string | null
          id: string
          job_id: string
          mentor_id: string | null
          mentor_name: string | null
          pipeline_id: string
          stage_key: string
          stage_started_at: string
          started_at: string
          updated_at: string
        }
        Insert: {
          application_id: string
          candidate_id: string
          created_at?: string
          end_reason?: string | null
          ended_at?: string | null
          id?: string
          job_id: string
          mentor_id?: string | null
          mentor_name?: string | null
          pipeline_id: string
          stage_key: string
          stage_started_at?: string
          started_at?: string
          updated_at?: string
        }
        Update: {
          application_id?: string
          candidate_id?: string
          created_at?: string
          end_reason?: string | null
          ended_at?: string | null
          id?: string
          job_id?: string
          mentor_id?: string | null
          mentor_name?: string | null
          pipeline_id?: string
          stage_key?: string
          stage_started_at?: string
          started_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_journeys_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: true
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_journeys_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_journeys_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_journeys_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "member_journeys_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "pipelines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_journeys_pipeline_id_stage_key_fkey"
            columns: ["pipeline_id", "stage_key"]
            isOneToOne: false
            referencedRelation: "pipeline_stages"
            referencedColumns: ["pipeline_id", "key"]
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
      pipeline_stages: {
        Row: {
          admin_label: string
          candidate_description: string | null
          candidate_label: string
          color: string
          created_at: string
          expected_days: number | null
          id: string
          is_negative: boolean
          is_terminal: boolean
          key: string
          pipeline_id: string
          sends_email: boolean
          sort_order: number
          updated_at: string
        }
        Insert: {
          admin_label: string
          candidate_description?: string | null
          candidate_label: string
          color?: string
          created_at?: string
          expected_days?: number | null
          id?: string
          is_negative?: boolean
          is_terminal?: boolean
          key: string
          pipeline_id: string
          sends_email?: boolean
          sort_order?: number
          updated_at?: string
        }
        Update: {
          admin_label?: string
          candidate_description?: string | null
          candidate_label?: string
          color?: string
          created_at?: string
          expected_days?: number | null
          id?: string
          is_negative?: boolean
          is_terminal?: boolean
          key?: string
          pipeline_id?: string
          sends_email?: boolean
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pipeline_stages_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "pipelines"
            referencedColumns: ["id"]
          },
        ]
      }
      pipelines: {
        Row: {
          created_at: string
          id: string
          is_default: boolean
          kind: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_default?: boolean
          kind: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_default?: boolean
          kind?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
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
      question_bank: {
        Row: {
          category: string
          created_at: string
          help_text: string | null
          id: string
          is_active: boolean
          knockout_rule: Json | null
          label: string
          max_length: number | null
          options: Json | null
          type: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          help_text?: string | null
          id?: string
          is_active?: boolean
          knockout_rule?: Json | null
          label: string
          max_length?: number | null
          options?: Json | null
          type: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          help_text?: string | null
          id?: string
          is_active?: boolean
          knockout_rule?: Json | null
          label?: string
          max_length?: number | null
          options?: Json | null
          type?: string
          updated_at?: string
        }
        Relationships: []
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
      signed_agreements: {
        Row: {
          accepted_terms: Json
          application_id: string
          created_at: string
          id: string
          ip_address: unknown
          pdf_path: string
          pdf_sha256: string
          signature_path: string
          signed_at: string
          signer_full_name: string
          template_id: string
          template_version: number
          user_agent: string | null
        }
        Insert: {
          accepted_terms: Json
          application_id: string
          created_at?: string
          id?: string
          ip_address?: unknown
          pdf_path: string
          pdf_sha256: string
          signature_path: string
          signed_at?: string
          signer_full_name: string
          template_id: string
          template_version: number
          user_agent?: string | null
        }
        Update: {
          accepted_terms?: Json
          application_id?: string
          created_at?: string
          id?: string
          ip_address?: unknown
          pdf_path?: string
          pdf_sha256?: string
          signature_path?: string
          signed_at?: string
          signer_full_name?: string
          template_id?: string
          template_version?: number
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "signed_agreements_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: true
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "signed_agreements_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "agreement_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      talent_pool: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          interested_in: string[]
          message: string | null
          phone: string | null
          portfolio_url: string | null
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id?: string
          interested_in?: string[]
          message?: string | null
          phone?: string | null
          portfolio_url?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          interested_in?: string[]
          message?: string | null
          phone?: string | null
          portfolio_url?: string | null
        }
        Relationships: []
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
      candidate_interviews: {
        Row: {
          application_id: string | null
          duration_minutes: number | null
          id: string | null
          meet_link: string | null
          mode: string | null
          office_address: string | null
          scheduled_at: string | null
          status: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      cancel_interview: {
        Args: { _interview_id: string; _reason: string }
        Returns: string
      }
      change_application_status: {
        Args: {
          _application_id: string
          _message: string
          _reason: string
          _to_status: string
        }
        Returns: string
      }
      change_journey_stage: {
        Args: {
          _journey_id: string
          _note: string
          _to_stage: string
          _visible: boolean
        }
        Returns: string
      }
      claim_delivery_outbox: {
        Args: { _ids?: string[]; _limit?: number }
        Returns: {
          application_id: string | null
          attempts: number
          booking_id: string | null
          created_at: string
          event_id: string
          id: string
          journey_id: string | null
          kind: string
          last_error: string | null
          next_attempt_at: string
          payload: Json
          result: Json | null
          sent_at: string | null
          status: string
          trigger_key: string
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "delivery_outbox"
          isOneToOne: false
          isSetofReturn: true
        }
      }
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
      create_enquiry: {
        Args: {
          p_attachment_path?: string
          p_brand_name: string
          p_budget_band: string
          p_email: string
          p_message: string
          p_name: string
          p_service_interest: string
          p_source_page: string
          p_website: string
          p_whatsapp: string
        }
        Returns: string
      }
      grant_hiring_role: {
        Args: { _email: string; _role: Database["public"]["Enums"]["app_role"] }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      hiring_admin_agreement_version: {
        Args: { _template: Json }
        Returns: string
      }
      hiring_admin_duplicate_job: { Args: { _id: string }; Returns: string }
      hiring_admin_freeze_bank: { Args: { _id: string }; Returns: undefined }
      hiring_admin_save_job: {
        Args: { _job: Json; _questions: Json }
        Returns: string
      }
      hiring_admin_update_drafts: {
        Args: { _bank_id: string }
        Returns: number
      }
      hiring_application_agreement: {
        Args: { _job_id: string }
        Returns: {
          body: string
          id: string
          key_terms: Json
          version: number
        }[]
      }
      hiring_application_questions: {
        Args: { _job_id: string }
        Returns: {
          help_text: string
          id: string
          label: string
          max_length: number
          options: Json
          required: boolean
          section: string
          sort_order: number
          type: string
        }[]
      }
      hiring_application_settings: {
        Args: never
        Returns: {
          google_login_enabled: boolean
        }[]
      }
      hiring_assign_reviewer: {
        Args: { _ids: string[]; _reviewer: string }
        Returns: undefined
      }
      hiring_assigned_application: { Args: { _id: string }; Returns: boolean }
      hiring_can_apply: {
        Args: { _job_id: string; _user_id: string }
        Returns: boolean
      }
      hiring_candidate_contact: { Args: never; Returns: string }
      hiring_candidate_email_status: {
        Args: { _application_id: string }
        Returns: string
      }
      hiring_candidate_questions: {
        Args: { _application_id: string }
        Returns: {
          id: string
          label: string
          section: string
          sort_order: number
          type: string
        }[]
      }
      hiring_candidate_submit_task: {
        Args: { _application_id: string; _note?: string; _url: string }
        Returns: string
      }
      hiring_current_template: {
        Args: { _job_id: string }
        Returns: {
          body: string
          created_at: string
          id: string
          is_current: boolean
          job_type: string
          key_terms: Json
          name: string
          version: number
        }[]
        SetofOptions: {
          from: "*"
          to: "agreement_templates"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      hiring_job_publish_errors: {
        Args: { _job_id: string }
        Returns: string[]
      }
      hiring_owns_application: {
        Args: { _application_id: string; _draft_only?: boolean }
        Returns: boolean
      }
      hiring_owns_journey: { Args: { _journey_id: string }; Returns: boolean }
      hiring_pdf_only_update: {
        Args: {
          _new: Database["public"]["Tables"]["signed_agreements"]["Row"]
          _old: Database["public"]["Tables"]["signed_agreements"]["Row"]
        }
        Returns: boolean
      }
      hiring_profile_access: { Args: { _candidate: string }; Returns: boolean }
      hiring_public_help: { Args: never; Returns: string }
      hiring_public_internship_video: {
        Args: never
        Returns: {
          internship_video_poster_url: string
          internship_video_title: string
          internship_video_url: string
        }[]
      }
      hiring_save_job_filters: {
        Args: { _job: Json; _questions: Json }
        Returns: string
      }
      hiring_save_progress: {
        Args: {
          _answers: Json
          _cv_path?: string
          _job_id: string
          _step: number
        }
        Returns: {
          candidate_id: string
          created_at: string
          current_step: number
          cv_path: string | null
          id: string
          is_draft: boolean
          is_test: boolean | null
          job_id: string
          passport_photo_path: string | null
          public_code: string
          status_key: string
          submitted_at: string | null
          task_submission_url: string | null
          task_submitted_at: string | null
          updated_at: string
          withdrawn_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "applications"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      hiring_save_review: {
        Args: {
          _application_id: string
          _commitment: number
          _skill: number
          _thinking: number
        }
        Returns: undefined
      }
      hiring_set_passport_photo: {
        Args: { _application_id: string }
        Returns: string
      }
      hiring_staff_contacts: {
        Args: { _ids: string[] }
        Returns: {
          email: string
          full_name: string
          user_id: string
        }[]
      }
      hiring_storage_path_owned: { Args: { _name: string }; Returns: boolean }
      hiring_template_is_latest: { Args: { _id: string }; Returns: boolean }
      hiring_validate_answer: {
        Args: { _answer: Json; _question_id: string }
        Returns: undefined
      }
      hiring7_move_journey: {
        Args: { _id: string; _note: string; _stage: string; _visible: boolean }
        Returns: string
      }
      hiring7_save_letter: {
        Args: { _body: string; _kind: string; _name: string; _pending: boolean }
        Returns: string
      }
      hiring7_set_mentor: {
        Args: { _id: string; _mentor?: string }
        Returns: undefined
      }
      hiring7_staff_roles: {
        Args: never
        Returns: {
          email: string
          full_name: string
          is_owner: boolean
          roles: string[]
          user_id: string
        }[]
      }
      is_hiring_staff: { Args: { _user_id: string }; Returns: boolean }
      list_hiring_staff: {
        Args: never
        Returns: {
          email: string
          roles: string[]
          user_id: string
        }[]
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
      record_signature: {
        Args: {
          _accepted_terms: Json
          _application_id: string
          _signature_path: string
          _signer_full_name: string
          _user_agent: string
        }
        Returns: string
      }
      reorder_pipeline_stages: {
        Args: { _pipeline_id: string; _stage_ids: string[] }
        Returns: number
      }
      reschedule_interview: {
        Args: { _interview_id: string; _message: string; _scheduled_at: string }
        Returns: string
      }
      revoke_hiring_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: undefined
      }
      save_interview_result: {
        Args: {
          _concerns: string
          _interview_id: string
          _recommendation: string
          _score: number
          _strengths: string
        }
        Returns: string
      }
      schedule_interview: {
        Args: {
          _application_id: string
          _duration_minutes: number
          _interviewer_id: string
          _meet_link: string
          _message: string
          _mode: string
          _office_address: string
          _scheduled_at: string
        }
        Returns: string
      }
      start_journey: {
        Args: {
          _application_id: string
          _mentor_id?: string
          _start_date?: string
        }
        Returns: string
      }
      submit_application: { Args: { _application_id: string }; Returns: string }
      submit_task: {
        Args: { _application_id: string; _url: string }
        Returns: string
      }
      withdraw_application: {
        Args: { _application_id: string; _reason?: string }
        Returns: string
      }
    }
    Enums: {
      app_role: "admin" | "reviewer" | "interviewer"
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
      app_role: ["admin", "reviewer", "interviewer"],
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
