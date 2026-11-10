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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      ad_analytics: {
        Row: {
          ad_purchase_id: string
          company_id: string | null
          created_at: string | null
          event_type: string
          id: string
          ip_address: string | null
          job_id: string | null
          referrer: string | null
          user_agent: string | null
          user_id: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          ad_purchase_id: string
          company_id?: string | null
          created_at?: string | null
          event_type: string
          id?: string
          ip_address?: string | null
          job_id?: string | null
          referrer?: string | null
          user_agent?: string | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          ad_purchase_id?: string
          company_id?: string | null
          created_at?: string | null
          event_type?: string
          id?: string
          ip_address?: string | null
          job_id?: string | null
          referrer?: string | null
          user_agent?: string | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ad_analytics_ad_purchase_id_fkey"
            columns: ["ad_purchase_id"]
            isOneToOne: false
            referencedRelation: "ad_purchases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_analytics_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_analytics_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_analytics_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_analytics_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs_public"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_products: {
        Row: {
          created_at: string | null
          currency: string
          description: string | null
          display_order: number | null
          duration_days: number
          features: Json | null
          id: string
          is_active: boolean | null
          name: string
          price: number
          product_type: Database["public"]["Enums"]["ad_product_type"]
          slug: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          currency?: string
          description?: string | null
          display_order?: number | null
          duration_days?: number
          features?: Json | null
          id?: string
          is_active?: boolean | null
          name: string
          price?: number
          product_type: Database["public"]["Enums"]["ad_product_type"]
          slug: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          currency?: string
          description?: string | null
          display_order?: number | null
          duration_days?: number
          features?: Json | null
          id?: string
          is_active?: boolean | null
          name?: string
          price?: number
          product_type?: Database["public"]["Enums"]["ad_product_type"]
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      ad_purchases: {
        Row: {
          ad_product_id: string
          amount_paid: number
          company_id: string
          created_at: string | null
          currency: string
          discount_applied: number | null
          end_date: string
          id: string
          job_id: string | null
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          payment_reference: string | null
          promo_code_id: string | null
          start_date: string
          status: Database["public"]["Enums"]["ad_purchase_status"] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ad_product_id: string
          amount_paid?: number
          company_id: string
          created_at?: string | null
          currency?: string
          discount_applied?: number | null
          end_date: string
          id?: string
          job_id?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          payment_reference?: string | null
          promo_code_id?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["ad_purchase_status"] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ad_product_id?: string
          amount_paid?: number
          company_id?: string
          created_at?: string | null
          currency?: string
          discount_applied?: number | null
          end_date?: string
          id?: string
          job_id?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          payment_reference?: string | null
          promo_code_id?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["ad_purchase_status"] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ad_purchases_ad_product_id_fkey"
            columns: ["ad_product_id"]
            isOneToOne: false
            referencedRelation: "ad_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_purchases_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_purchases_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_purchases_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_purchases_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_purchases_promo_code_id_fkey"
            columns: ["promo_code_id"]
            isOneToOne: false
            referencedRelation: "promo_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_impersonation_logs: {
        Row: {
          admin_user_id: string
          ended_at: string | null
          id: string
          ip_address: string | null
          started_at: string
          target_email: string | null
          target_user_id: string
          user_agent: string | null
        }
        Insert: {
          admin_user_id: string
          ended_at?: string | null
          id?: string
          ip_address?: string | null
          started_at?: string
          target_email?: string | null
          target_user_id: string
          user_agent?: string | null
        }
        Update: {
          admin_user_id?: string
          ended_at?: string | null
          id?: string
          ip_address?: string | null
          started_at?: string
          target_email?: string | null
          target_user_id?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      admin_settings: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_encrypted: boolean | null
          key: string
          updated_at: string | null
          updated_by: string | null
          value: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_encrypted?: boolean | null
          key: string
          updated_at?: string | null
          updated_by?: string | null
          value?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_encrypted?: boolean | null
          key?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: string | null
        }
        Relationships: []
      }
      ai_agent_logs: {
        Row: {
          agent_type: string
          completion_tokens: number | null
          content_type: string
          content_url: string | null
          cost: number | null
          created_at: string
          duration_ms: number | null
          error_message: string | null
          id: string
          metadata: Json | null
          prompt_tokens: number | null
          request_preview: string | null
          response_preview: string | null
          status: string
          total_tokens: number | null
          user_id: string | null
        }
        Insert: {
          agent_type: string
          completion_tokens?: number | null
          content_type: string
          content_url?: string | null
          cost?: number | null
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          prompt_tokens?: number | null
          request_preview?: string | null
          response_preview?: string | null
          status?: string
          total_tokens?: number | null
          user_id?: string | null
        }
        Update: {
          agent_type?: string
          completion_tokens?: number | null
          content_type?: string
          content_url?: string | null
          cost?: number | null
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          prompt_tokens?: number | null
          request_preview?: string | null
          response_preview?: string | null
          status?: string
          total_tokens?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      analytics: {
        Row: {
          company_id: string | null
          created_at: string
          event_data: Json | null
          event_type: string
          id: string
          ip_address: string | null
          job_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          event_data?: Json | null
          event_type: string
          id?: string
          ip_address?: string | null
          job_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string
          event_data?: Json | null
          event_type?: string
          id?: string
          ip_address?: string | null
          job_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs_public"
            referencedColumns: ["id"]
          },
        ]
      }
      application_documents: {
        Row: {
          application_id: string
          created_at: string
          document_id: string
          id: string
        }
        Insert: {
          application_id: string
          created_at?: string
          document_id: string
          id?: string
        }
        Update: {
          application_id?: string
          created_at?: string
          document_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "application_documents_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "application_documents_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "user_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      applications: {
        Row: {
          ai_match_score: number | null
          applicant_id: string
          cover_letter: string | null
          created_at: string
          extracted_data: Json | null
          id: string
          job_id: string
          notes: string | null
          resume_url: string | null
          status: Database["public"]["Enums"]["application_status"] | null
          updated_at: string
          viewed_at: string | null
        }
        Insert: {
          ai_match_score?: number | null
          applicant_id: string
          cover_letter?: string | null
          created_at?: string
          extracted_data?: Json | null
          id?: string
          job_id: string
          notes?: string | null
          resume_url?: string | null
          status?: Database["public"]["Enums"]["application_status"] | null
          updated_at?: string
          viewed_at?: string | null
        }
        Update: {
          ai_match_score?: number | null
          applicant_id?: string
          cover_letter?: string | null
          created_at?: string
          extracted_data?: Json | null
          id?: string
          job_id?: string
          notes?: string | null
          resume_url?: string | null
          status?: Database["public"]["Enums"]["application_status"] | null
          updated_at?: string
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs_public"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_settings: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_encrypted: boolean | null
          key: string
          updated_at: string | null
          updated_by: string | null
          value: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_encrypted?: boolean | null
          key: string
          updated_at?: string | null
          updated_by?: string | null
          value?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_encrypted?: boolean | null
          key?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: string | null
        }
        Relationships: []
      }
      blog_authors: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          id: string
          is_active: boolean | null
          location: string | null
          name: string
          specialization: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          location?: string | null
          name: string
          specialization?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          location?: string | null
          name?: string
          specialization?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      candidate_outreach: {
        Row: {
          candidate_user_id: string
          company_id: string
          created_at: string
          delivered_at: string | null
          email_status: string
          id: string
          job_id: string | null
          message: string
          read_at: string | null
          replied_at: string | null
          sender_user_id: string
          sent_at: string
          subject: string
        }
        Insert: {
          candidate_user_id: string
          company_id: string
          created_at?: string
          delivered_at?: string | null
          email_status?: string
          id?: string
          job_id?: string | null
          message: string
          read_at?: string | null
          replied_at?: string | null
          sender_user_id: string
          sent_at?: string
          subject: string
        }
        Update: {
          candidate_user_id?: string
          company_id?: string
          created_at?: string
          delivered_at?: string | null
          email_status?: string
          id?: string
          job_id?: string | null
          message?: string
          read_at?: string | null
          replied_at?: string | null
          sender_user_id?: string
          sent_at?: string
          subject?: string
        }
        Relationships: []
      }
      candidate_shortlist_items: {
        Row: {
          added_by: string
          candidate_user_id: string
          created_at: string
          id: string
          notes: string | null
          shortlist_id: string
        }
        Insert: {
          added_by: string
          candidate_user_id: string
          created_at?: string
          id?: string
          notes?: string | null
          shortlist_id: string
        }
        Update: {
          added_by?: string
          candidate_user_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          shortlist_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "candidate_shortlist_items_shortlist_id_fkey"
            columns: ["shortlist_id"]
            isOneToOne: false
            referencedRelation: "candidate_shortlists"
            referencedColumns: ["id"]
          },
        ]
      }
      candidate_shortlists: {
        Row: {
          company_id: string
          created_at: string
          created_by: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      candidate_visibility: {
        Row: {
          allow_contact: boolean
          availability:
            | Database["public"]["Enums"]["candidate_availability"]
            | null
          created_at: string
          desired_categories: string[] | null
          desired_locations: string[] | null
          desired_role: string | null
          headline: string | null
          id: string
          is_searchable: boolean
          min_salary: number | null
          salary_currency: string | null
          top_skills: string[] | null
          updated_at: string
          user_id: string
          years_experience: number | null
        }
        Insert: {
          allow_contact?: boolean
          availability?:
            | Database["public"]["Enums"]["candidate_availability"]
            | null
          created_at?: string
          desired_categories?: string[] | null
          desired_locations?: string[] | null
          desired_role?: string | null
          headline?: string | null
          id?: string
          is_searchable?: boolean
          min_salary?: number | null
          salary_currency?: string | null
          top_skills?: string[] | null
          updated_at?: string
          user_id: string
          years_experience?: number | null
        }
        Update: {
          allow_contact?: boolean
          availability?:
            | Database["public"]["Enums"]["candidate_availability"]
            | null
          created_at?: string
          desired_categories?: string[] | null
          desired_locations?: string[] | null
          desired_role?: string | null
          headline?: string | null
          id?: string
          is_searchable?: boolean
          min_salary?: number | null
          salary_currency?: string | null
          top_skills?: string[] | null
          updated_at?: string
          user_id?: string
          years_experience?: number | null
        }
        Relationships: []
      }
      client_package_offers: {
        Row: {
          amount_cents: number
          assigned_by: string
          company_id: string
          created_at: string
          credit_limit: number
          credits_used: number
          duration_months: number
          employer_user_id: string
          expires_at: string
          id: string
          offer_expires_at: string
          package_name: string | null
          paid_at: string | null
          pay_token: string | null
          product_key: string
          receipt_emails: string[]
          starts_at: string
          status: string
          updated_at: string
        }
        Insert: {
          amount_cents: number
          assigned_by: string
          company_id: string
          created_at?: string
          credit_limit: number
          credits_used?: number
          duration_months: number
          employer_user_id: string
          expires_at: string
          id?: string
          offer_expires_at?: string
          package_name?: string | null
          paid_at?: string | null
          pay_token?: string | null
          product_key: string
          receipt_emails?: string[]
          starts_at: string
          status?: string
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          assigned_by?: string
          company_id?: string
          created_at?: string
          credit_limit?: number
          credits_used?: number
          duration_months?: number
          employer_user_id?: string
          expires_at?: string
          id?: string
          offer_expires_at?: string
          package_name?: string | null
          paid_at?: string | null
          pay_token?: string | null
          product_key?: string
          receipt_emails?: string[]
          starts_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_package_offers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_package_offers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          banner_url: string | null
          benefits_summary: string | null
          brand_gallery: Json | null
          brand_video_url: string | null
          branded_page_enabled: boolean | null
          company_size: string | null
          created_at: string
          culture: string | null
          description: string | null
          email: string | null
          followers_count: number | null
          founded_year: number | null
          id: string
          industry: string | null
          is_sponsored: boolean | null
          is_top_employer: boolean | null
          is_verified: boolean | null
          location: string | null
          logo_url: string | null
          mission: string | null
          name: string
          owner_id: string
          phone: string | null
          slug: string
          social_links: Json | null
          sponsorship_plan: string | null
          testimonials: Json | null
          top_employer_end_date: string | null
          top_employer_plan_type: string | null
          top_employer_start_date: string | null
          updated_at: string
          views_count: number | null
          website: string | null
        }
        Insert: {
          banner_url?: string | null
          benefits_summary?: string | null
          brand_gallery?: Json | null
          brand_video_url?: string | null
          branded_page_enabled?: boolean | null
          company_size?: string | null
          created_at?: string
          culture?: string | null
          description?: string | null
          email?: string | null
          followers_count?: number | null
          founded_year?: number | null
          id?: string
          industry?: string | null
          is_sponsored?: boolean | null
          is_top_employer?: boolean | null
          is_verified?: boolean | null
          location?: string | null
          logo_url?: string | null
          mission?: string | null
          name: string
          owner_id: string
          phone?: string | null
          slug: string
          social_links?: Json | null
          sponsorship_plan?: string | null
          testimonials?: Json | null
          top_employer_end_date?: string | null
          top_employer_plan_type?: string | null
          top_employer_start_date?: string | null
          updated_at?: string
          views_count?: number | null
          website?: string | null
        }
        Update: {
          banner_url?: string | null
          benefits_summary?: string | null
          brand_gallery?: Json | null
          brand_video_url?: string | null
          branded_page_enabled?: boolean | null
          company_size?: string | null
          created_at?: string
          culture?: string | null
          description?: string | null
          email?: string | null
          followers_count?: number | null
          founded_year?: number | null
          id?: string
          industry?: string | null
          is_sponsored?: boolean | null
          is_top_employer?: boolean | null
          is_verified?: boolean | null
          location?: string | null
          logo_url?: string | null
          mission?: string | null
          name?: string
          owner_id?: string
          phone?: string | null
          slug?: string
          social_links?: Json | null
          sponsorship_plan?: string | null
          testimonials?: Json | null
          top_employer_end_date?: string | null
          top_employer_plan_type?: string | null
          top_employer_start_date?: string | null
          updated_at?: string
          views_count?: number | null
          website?: string | null
        }
        Relationships: []
      }
      company_billing_profiles: {
        Row: {
          billing_address: string | null
          billing_city: string | null
          billing_country: string | null
          billing_email: string | null
          billing_name: string | null
          billing_postal_code: string | null
          company_id: string
          created_at: string | null
          id: string
          notes: string | null
          payment_terms_days: number | null
          preferred_payment_method: string | null
          tax_id: string | null
          updated_at: string | null
          vat_number: string | null
        }
        Insert: {
          billing_address?: string | null
          billing_city?: string | null
          billing_country?: string | null
          billing_email?: string | null
          billing_name?: string | null
          billing_postal_code?: string | null
          company_id: string
          created_at?: string | null
          id?: string
          notes?: string | null
          payment_terms_days?: number | null
          preferred_payment_method?: string | null
          tax_id?: string | null
          updated_at?: string | null
          vat_number?: string | null
        }
        Update: {
          billing_address?: string | null
          billing_city?: string | null
          billing_country?: string | null
          billing_email?: string | null
          billing_name?: string | null
          billing_postal_code?: string | null
          company_id?: string
          created_at?: string | null
          id?: string
          notes?: string | null
          payment_terms_days?: number | null
          preferred_payment_method?: string | null
          tax_id?: string | null
          updated_at?: string | null
          vat_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_billing_profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_billing_profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      company_followers: {
        Row: {
          company_id: string
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_followers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_followers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      company_member_invites: {
        Row: {
          accepted_at: string | null
          company_id: string
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          role: Database["public"]["Enums"]["company_member_role"]
          token: string
        }
        Insert: {
          accepted_at?: string | null
          company_id: string
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          role?: Database["public"]["Enums"]["company_member_role"]
          token?: string
        }
        Update: {
          accepted_at?: string | null
          company_id?: string
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          role?: Database["public"]["Enums"]["company_member_role"]
          token?: string
        }
        Relationships: []
      }
      company_members: {
        Row: {
          accepted_at: string
          company_id: string
          created_at: string
          id: string
          invited_by: string | null
          role: Database["public"]["Enums"]["company_member_role"]
          user_id: string
        }
        Insert: {
          accepted_at?: string
          company_id: string
          created_at?: string
          id?: string
          invited_by?: string | null
          role?: Database["public"]["Enums"]["company_member_role"]
          user_id: string
        }
        Update: {
          accepted_at?: string
          company_id?: string
          created_at?: string
          id?: string
          invited_by?: string | null
          role?: Database["public"]["Enums"]["company_member_role"]
          user_id?: string
        }
        Relationships: []
      }
      credit_notes: {
        Row: {
          amount: number
          applied_date: string | null
          company_id: string | null
          created_at: string | null
          created_by: string | null
          credit_note_number: string
          currency: string
          id: string
          invoice_id: string
          issued_date: string | null
          notes: string | null
          pdf_url: string | null
          reason: string
          status: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          amount?: number
          applied_date?: string | null
          company_id?: string | null
          created_at?: string | null
          created_by?: string | null
          credit_note_number: string
          currency?: string
          id?: string
          invoice_id: string
          issued_date?: string | null
          notes?: string | null
          pdf_url?: string | null
          reason: string
          status?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          applied_date?: string | null
          company_id?: string | null
          created_at?: string | null
          created_by?: string | null
          credit_note_number?: string
          currency?: string
          id?: string
          invoice_id?: string
          issued_date?: string | null
          notes?: string | null
          pdf_url?: string | null
          reason?: string
          status?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "credit_notes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_notes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_notes_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      email_logs: {
        Row: {
          clicked_at: string | null
          created_at: string | null
          delivered_at: string | null
          email_to: string
          error_message: string | null
          id: string
          metadata: Json | null
          opened_at: string | null
          sent_at: string | null
          status: string
          subject: string
          template_id: string | null
          template_slug: string
          user_id: string | null
        }
        Insert: {
          clicked_at?: string | null
          created_at?: string | null
          delivered_at?: string | null
          email_to: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          opened_at?: string | null
          sent_at?: string | null
          status?: string
          subject: string
          template_id?: string | null
          template_slug: string
          user_id?: string | null
        }
        Update: {
          clicked_at?: string | null
          created_at?: string | null
          delivered_at?: string | null
          email_to?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          opened_at?: string | null
          sent_at?: string | null
          status?: string
          subject?: string
          template_id?: string | null
          template_slug?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_logs_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      email_queue: {
        Row: {
          created_at: string | null
          error_message: string | null
          id: string
          metadata: Json | null
          processed_at: string | null
          scheduled_for: string
          status: string
          template_slug: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          processed_at?: string | null
          scheduled_for: string
          status?: string
          template_slug: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          processed_at?: string | null
          scheduled_for?: string
          status?: string
          template_slug?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_queue_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          html_content: string
          id: string
          is_active: boolean | null
          name: string
          slug: string
          subject: string
          updated_at: string | null
        }
        Insert: {
          category?: string
          created_at?: string | null
          description?: string | null
          html_content: string
          id?: string
          is_active?: boolean | null
          name: string
          slug: string
          subject: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          html_content?: string
          id?: string
          is_active?: boolean | null
          name?: string
          slug?: string
          subject?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      invoice_items: {
        Row: {
          created_at: string | null
          description: string
          discount_amount: number | null
          id: string
          invoice_id: string
          metadata: Json | null
          product_id: string | null
          product_type: string | null
          quantity: number
          sort_order: number | null
          tax_amount: number | null
          tax_rate: number | null
          total: number
          unit_price: number
        }
        Insert: {
          created_at?: string | null
          description: string
          discount_amount?: number | null
          id?: string
          invoice_id: string
          metadata?: Json | null
          product_id?: string | null
          product_type?: string | null
          quantity?: number
          sort_order?: number | null
          tax_amount?: number | null
          tax_rate?: number | null
          total?: number
          unit_price?: number
        }
        Update: {
          created_at?: string | null
          description?: string
          discount_amount?: number | null
          id?: string
          invoice_id?: string
          metadata?: Json | null
          product_id?: string | null
          product_type?: string | null
          quantity?: number
          sort_order?: number | null
          tax_amount?: number | null
          tax_rate?: number | null
          total?: number
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
          amount_due: number | null
          amount_paid: number | null
          billing_address: string | null
          billing_city: string | null
          billing_country: string | null
          billing_email: string | null
          billing_name: string | null
          billing_postal_code: string | null
          company_id: string | null
          created_at: string | null
          created_by: string | null
          currency: string
          discount_amount: number | null
          due_date: string | null
          id: string
          invoice_number: string
          issue_date: string
          notes: string | null
          overdue_notice_sent_at: string | null
          paid_date: string | null
          payment_link: string | null
          payment_method: string | null
          payment_reference: string | null
          pdf_url: string | null
          promo_code_id: string | null
          reference: string | null
          reminder_sent_at: string | null
          sent_at: string | null
          source_id: string | null
          source_type: string | null
          status: string
          subtotal: number
          tax_amount: number | null
          tax_id: string | null
          tax_rate: number | null
          terms: string | null
          total: number
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          amount_due?: number | null
          amount_paid?: number | null
          billing_address?: string | null
          billing_city?: string | null
          billing_country?: string | null
          billing_email?: string | null
          billing_name?: string | null
          billing_postal_code?: string | null
          company_id?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string
          discount_amount?: number | null
          due_date?: string | null
          id?: string
          invoice_number: string
          issue_date?: string
          notes?: string | null
          overdue_notice_sent_at?: string | null
          paid_date?: string | null
          payment_link?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          pdf_url?: string | null
          promo_code_id?: string | null
          reference?: string | null
          reminder_sent_at?: string | null
          sent_at?: string | null
          source_id?: string | null
          source_type?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number | null
          tax_id?: string | null
          tax_rate?: number | null
          terms?: string | null
          total?: number
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          amount_due?: number | null
          amount_paid?: number | null
          billing_address?: string | null
          billing_city?: string | null
          billing_country?: string | null
          billing_email?: string | null
          billing_name?: string | null
          billing_postal_code?: string | null
          company_id?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string
          discount_amount?: number | null
          due_date?: string | null
          id?: string
          invoice_number?: string
          issue_date?: string
          notes?: string | null
          overdue_notice_sent_at?: string | null
          paid_date?: string | null
          payment_link?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          pdf_url?: string | null
          promo_code_id?: string | null
          reference?: string | null
          reminder_sent_at?: string | null
          sent_at?: string | null
          source_id?: string | null
          source_type?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number | null
          tax_id?: string | null
          tax_rate?: number | null
          terms?: string | null
          total?: number
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_promo_code_id_fkey"
            columns: ["promo_code_id"]
            isOneToOne: false
            referencedRelation: "promo_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      job_listings: {
        Row: {
          client_offer_id: string | null
          company_id: string | null
          created_at: string
          employer_user_id: string
          ends_at: string
          featured_until: string | null
          id: string
          job_id: string | null
          listing_tier: string
          paypal_order_id: string | null
          price_eur: number
          product_key: string
          starts_at: string
          status: string
        }
        Insert: {
          client_offer_id?: string | null
          company_id?: string | null
          created_at?: string
          employer_user_id: string
          ends_at: string
          featured_until?: string | null
          id?: string
          job_id?: string | null
          listing_tier: string
          paypal_order_id?: string | null
          price_eur: number
          product_key: string
          starts_at?: string
          status?: string
        }
        Update: {
          client_offer_id?: string | null
          company_id?: string | null
          created_at?: string
          employer_user_id?: string
          ends_at?: string
          featured_until?: string | null
          id?: string
          job_id?: string | null
          listing_tier?: string
          paypal_order_id?: string | null
          price_eur?: number
          product_key?: string
          starts_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_listings_client_offer_id_fkey"
            columns: ["client_offer_id"]
            isOneToOne: false
            referencedRelation: "client_package_offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_listings_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_listings_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_listings_paypal_order_id_fkey"
            columns: ["paypal_order_id"]
            isOneToOne: false
            referencedRelation: "paypal_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      job_recommendations: {
        Row: {
          ai_match_score: number | null
          created_at: string | null
          id: string
          job_id: string
          matched_on: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ai_match_score?: number | null
          created_at?: string | null
          id?: string
          job_id: string
          matched_on?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ai_match_score?: number | null
          created_at?: string | null
          id?: string
          job_id?: string
          matched_on?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_recommendations_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_recommendations_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs_public"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          application_deadline: string | null
          applications_count: number | null
          benefits: string[] | null
          category: string
          company_id: string
          created_at: string
          description: string
          experience_level: Database["public"]["Enums"]["experience_level"]
          id: string
          is_active: boolean | null
          is_featured: boolean | null
          is_remote: boolean | null
          is_salary_visible: boolean | null
          job_type: Database["public"]["Enums"]["job_type"]
          location: string
          payment_status: string
          posted_by: string
          requirements: string | null
          responsibilities: string | null
          salary_currency: string | null
          salary_max: number | null
          salary_min: number | null
          seo_description: string | null
          seo_title: string | null
          skills: string[] | null
          slug: string
          title: string
          updated_at: string
          views_count: number | null
        }
        Insert: {
          application_deadline?: string | null
          applications_count?: number | null
          benefits?: string[] | null
          category: string
          company_id: string
          created_at?: string
          description: string
          experience_level: Database["public"]["Enums"]["experience_level"]
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          is_remote?: boolean | null
          is_salary_visible?: boolean | null
          job_type: Database["public"]["Enums"]["job_type"]
          location: string
          payment_status?: string
          posted_by: string
          requirements?: string | null
          responsibilities?: string | null
          salary_currency?: string | null
          salary_max?: number | null
          salary_min?: number | null
          seo_description?: string | null
          seo_title?: string | null
          skills?: string[] | null
          slug: string
          title: string
          updated_at?: string
          views_count?: number | null
        }
        Update: {
          application_deadline?: string | null
          applications_count?: number | null
          benefits?: string[] | null
          category?: string
          company_id?: string
          created_at?: string
          description?: string
          experience_level?: Database["public"]["Enums"]["experience_level"]
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          is_remote?: boolean | null
          is_salary_visible?: boolean | null
          job_type?: Database["public"]["Enums"]["job_type"]
          location?: string
          payment_status?: string
          posted_by?: string
          requirements?: string | null
          responsibilities?: string | null
          salary_currency?: string | null
          salary_max?: number | null
          salary_min?: number | null
          seo_description?: string | null
          seo_title?: string | null
          skills?: string[] | null
          slug?: string
          title?: string
          updated_at?: string
          views_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "jobs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_conversions: {
        Row: {
          conversion_type: string
          conversion_value: number | null
          converted_at: string | null
          id: string
          lead_id: string
          notes: string | null
          user_id: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          conversion_type: string
          conversion_value?: number | null
          converted_at?: string | null
          id?: string
          lead_id: string
          notes?: string | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          conversion_type?: string
          conversion_value?: number | null
          converted_at?: string | null
          id?: string
          lead_id?: string
          notes?: string | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketing_conversions_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "marketing_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_leads: {
        Row: {
          company_name: string | null
          contact_email: string | null
          contact_name: string | null
          created_at: string | null
          created_by_agent_run_id: string | null
          current_stage: string
          draft_email: string
          draft_linkedin: string
          id: string
          industry: string | null
          lead_type: string
          linkedin_url: string | null
          priority: string
          relevance_notes: string | null
          university_name: string | null
          updated_at: string | null
          utm_campaign: string
        }
        Insert: {
          company_name?: string | null
          contact_email?: string | null
          contact_name?: string | null
          created_at?: string | null
          created_by_agent_run_id?: string | null
          current_stage?: string
          draft_email: string
          draft_linkedin: string
          id?: string
          industry?: string | null
          lead_type: string
          linkedin_url?: string | null
          priority: string
          relevance_notes?: string | null
          university_name?: string | null
          updated_at?: string | null
          utm_campaign: string
        }
        Update: {
          company_name?: string | null
          contact_email?: string | null
          contact_name?: string | null
          created_at?: string | null
          created_by_agent_run_id?: string | null
          current_stage?: string
          draft_email?: string
          draft_linkedin?: string
          id?: string
          industry?: string | null
          lead_type?: string
          linkedin_url?: string | null
          priority?: string
          relevance_notes?: string | null
          university_name?: string | null
          updated_at?: string | null
          utm_campaign?: string
        }
        Relationships: []
      }
      marketing_outreach_attempts: {
        Row: {
          attempt_type: string
          created_at: string | null
          email_clicked: boolean | null
          email_delivered: boolean | null
          email_opened: boolean | null
          id: string
          lead_id: string
          notes: string | null
          response_received: boolean | null
          sent_at: string | null
        }
        Insert: {
          attempt_type: string
          created_at?: string | null
          email_clicked?: boolean | null
          email_delivered?: boolean | null
          email_opened?: boolean | null
          id?: string
          lead_id: string
          notes?: string | null
          response_received?: boolean | null
          sent_at?: string | null
        }
        Update: {
          attempt_type?: string
          created_at?: string | null
          email_clicked?: boolean | null
          email_delivered?: boolean | null
          email_opened?: boolean | null
          id?: string
          lead_id?: string
          notes?: string | null
          response_received?: boolean | null
          sent_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketing_outreach_attempts_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "marketing_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_transactions: {
        Row: {
          ad_purchase_id: string | null
          amount: number
          company_id: string | null
          created_at: string | null
          currency: string
          id: string
          metadata: Json | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_provider_id: string | null
          receipt_url: string | null
          status: Database["public"]["Enums"]["payment_status"] | null
          subscription_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ad_purchase_id?: string | null
          amount: number
          company_id?: string | null
          created_at?: string | null
          currency?: string
          id?: string
          metadata?: Json | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_provider_id?: string | null
          receipt_url?: string | null
          status?: Database["public"]["Enums"]["payment_status"] | null
          subscription_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ad_purchase_id?: string | null
          amount?: number
          company_id?: string | null
          created_at?: string | null
          currency?: string
          id?: string
          metadata?: Json | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          payment_provider_id?: string | null
          receipt_url?: string | null
          status?: Database["public"]["Enums"]["payment_status"] | null
          subscription_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_transactions_ad_purchase_id_fkey"
            columns: ["ad_purchase_id"]
            isOneToOne: false
            referencedRelation: "ad_purchases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_transactions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_transactions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_transactions_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      paypal_orders: {
        Row: {
          amount_cents: number
          captured_at: string | null
          client_offer_id: string | null
          created_at: string
          currency: string
          environment: string
          featured_days: number
          id: string
          job_id: string | null
          listing_credits: number
          paypal_order_id: string
          product_key: string
          status: string
          urgent: boolean
          user_id: string
        }
        Insert: {
          amount_cents: number
          captured_at?: string | null
          client_offer_id?: string | null
          created_at?: string
          currency?: string
          environment?: string
          featured_days?: number
          id?: string
          job_id?: string | null
          listing_credits?: number
          paypal_order_id: string
          product_key: string
          status?: string
          urgent?: boolean
          user_id: string
        }
        Update: {
          amount_cents?: number
          captured_at?: string | null
          client_offer_id?: string | null
          created_at?: string
          currency?: string
          environment?: string
          featured_days?: number
          id?: string
          job_id?: string | null
          listing_credits?: number
          paypal_order_id?: string
          product_key?: string
          status?: string
          urgent?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "paypal_orders_client_offer_id_fkey"
            columns: ["client_offer_id"]
            isOneToOne: false
            referencedRelation: "client_package_offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "paypal_orders_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "paypal_orders_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs_public"
            referencedColumns: ["id"]
          },
        ]
      }
      paypal_plans: {
        Row: {
          created_at: string
          environment: string
          paypal_plan_id: string
          paypal_product_id: string
          product_key: string
        }
        Insert: {
          created_at?: string
          environment?: string
          paypal_plan_id: string
          paypal_product_id: string
          product_key: string
        }
        Update: {
          created_at?: string
          environment?: string
          paypal_plan_id?: string
          paypal_product_id?: string
          product_key?: string
        }
        Relationships: []
      }
      posts: {
        Row: {
          author_id: string
          blog_author_id: string | null
          category: string
          company_id: string | null
          content: string
          created_at: string
          excerpt: string | null
          featured_image: string | null
          id: string
          is_published: boolean
          is_sponsored: boolean | null
          language: string
          meta_description: string | null
          meta_keywords: string[] | null
          meta_title: string | null
          published_at: string | null
          slug: string
          tags: string[] | null
          title: string
          updated_at: string
          views_count: number
        }
        Insert: {
          author_id: string
          blog_author_id?: string | null
          category: string
          company_id?: string | null
          content: string
          created_at?: string
          excerpt?: string | null
          featured_image?: string | null
          id?: string
          is_published?: boolean
          is_sponsored?: boolean | null
          language?: string
          meta_description?: string | null
          meta_keywords?: string[] | null
          meta_title?: string | null
          published_at?: string | null
          slug: string
          tags?: string[] | null
          title: string
          updated_at?: string
          views_count?: number
        }
        Update: {
          author_id?: string
          blog_author_id?: string | null
          category?: string
          company_id?: string | null
          content?: string
          created_at?: string
          excerpt?: string | null
          featured_image?: string | null
          id?: string
          is_published?: boolean
          is_sponsored?: boolean | null
          language?: string
          meta_description?: string | null
          meta_keywords?: string[] | null
          meta_title?: string | null
          published_at?: string | null
          slug?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
          views_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_blog_author_id_fkey"
            columns: ["blog_author_id"]
            isOneToOne: false
            referencedRelation: "blog_authors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      premium_placements: {
        Row: {
          amount_paid: number
          company_id: string | null
          created_at: string | null
          created_by: string | null
          currency: string | null
          end_date: string
          id: string
          notes: string | null
          payment_method: string | null
          payment_reference: string | null
          placement_type: string
          start_date: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          amount_paid: number
          company_id?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          end_date: string
          id?: string
          notes?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          placement_type: string
          start_date: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          amount_paid?: number
          company_id?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          end_date?: string
          id?: string
          notes?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          placement_type?: string
          start_date?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "premium_placements_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "premium_placements_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          linkedin_url: string | null
          location: string | null
          phone: string | null
          updated_at: string
          website_url: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          linkedin_url?: string | null
          location?: string | null
          phone?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          linkedin_url?: string | null
          location?: string | null
          phone?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Relationships: []
      }
      promo_codes: {
        Row: {
          applicable_products: Json | null
          code: string
          created_at: string | null
          created_by: string | null
          current_uses: number | null
          description: string | null
          discount_type: Database["public"]["Enums"]["discount_type"]
          discount_value: number
          id: string
          is_active: boolean | null
          max_uses: number | null
          min_purchase_amount: number | null
          updated_at: string | null
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          applicable_products?: Json | null
          code: string
          created_at?: string | null
          created_by?: string | null
          current_uses?: number | null
          description?: string | null
          discount_type?: Database["public"]["Enums"]["discount_type"]
          discount_value?: number
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          min_purchase_amount?: number | null
          updated_at?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          applicable_products?: Json | null
          code?: string
          created_at?: string | null
          created_by?: string | null
          current_uses?: number | null
          description?: string | null
          discount_type?: Database["public"]["Enums"]["discount_type"]
          discount_value?: number
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          min_purchase_amount?: number | null
          updated_at?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: []
      }
      resume_templates: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          is_premium: boolean | null
          name: string
          preview_url: string | null
          slug: string | null
          template_data: Json
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_premium?: boolean | null
          name: string
          preview_url?: string | null
          slug?: string | null
          template_data: Json
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_premium?: boolean | null
          name?: string
          preview_url?: string | null
          slug?: string | null
          template_data?: Json
          updated_at?: string
        }
        Relationships: []
      }
      resume_unlocks: {
        Row: {
          candidate_user_id: string
          company_id: string
          employer_user_id: string
          id: string
          month_bucket: string
          unlocked_at: string
        }
        Insert: {
          candidate_user_id: string
          company_id: string
          employer_user_id: string
          id?: string
          month_bucket?: string
          unlocked_at?: string
        }
        Update: {
          candidate_user_id?: string
          company_id?: string
          employer_user_id?: string
          id?: string
          month_bucket?: string
          unlocked_at?: string
        }
        Relationships: []
      }
      resumes: {
        Row: {
          ai_match_score: number | null
          created_at: string
          data: Json
          extracted_data: Json | null
          id: string
          is_active: boolean | null
          is_uploaded: boolean | null
          resume_file_url: string | null
          resume_type: string | null
          template_id: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_match_score?: number | null
          created_at?: string
          data?: Json
          extracted_data?: Json | null
          id?: string
          is_active?: boolean | null
          is_uploaded?: boolean | null
          resume_file_url?: string | null
          resume_type?: string | null
          template_id?: string | null
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_match_score?: number | null
          created_at?: string
          data?: Json
          extracted_data?: Json | null
          id?: string
          is_active?: boolean | null
          is_uploaded?: boolean | null
          resume_file_url?: string | null
          resume_type?: string | null
          template_id?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "resumes_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "resume_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_jobs: {
        Row: {
          created_at: string
          id: string
          job_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          job_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          job_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_jobs_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_jobs_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs_public"
            referencedColumns: ["id"]
          },
        ]
      }
      sponsored_content: {
        Row: {
          company_id: string
          created_at: string | null
          end_date: string
          id: string
          is_active: boolean | null
          post_id: string
          start_date: string
          updated_at: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          end_date: string
          id?: string
          is_active?: boolean | null
          post_id: string
          start_date: string
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          end_date?: string
          id?: string
          is_active?: boolean | null
          post_id?: string
          start_date?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sponsored_content_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sponsored_content_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sponsored_content_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sponsored_content_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts_public"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          ai_access: boolean | null
          analytics_enabled: boolean | null
          ats_access: boolean | null
          branded_page: boolean | null
          bulk_export: boolean | null
          company_page: boolean | null
          created_at: string | null
          currency: string | null
          description: string | null
          display_order: number | null
          document_access: string
          featured_jobs_limit: number
          id: string
          is_active: boolean | null
          is_corporate: boolean | null
          is_popular: boolean | null
          job_posts_limit: number
          name: string
          price_monthly: number
          price_yearly: number
          priority_support: boolean | null
          resume_views_limit: number
          seat_limit: number | null
          slug: string
          support_level: string | null
          talent_pool_access: boolean | null
          talent_pool_views_limit: number | null
          updated_at: string | null
        }
        Insert: {
          ai_access?: boolean | null
          analytics_enabled?: boolean | null
          ats_access?: boolean | null
          branded_page?: boolean | null
          bulk_export?: boolean | null
          company_page?: boolean | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          display_order?: number | null
          document_access?: string
          featured_jobs_limit?: number
          id?: string
          is_active?: boolean | null
          is_corporate?: boolean | null
          is_popular?: boolean | null
          job_posts_limit?: number
          name: string
          price_monthly?: number
          price_yearly?: number
          priority_support?: boolean | null
          resume_views_limit?: number
          seat_limit?: number | null
          slug: string
          support_level?: string | null
          talent_pool_access?: boolean | null
          talent_pool_views_limit?: number | null
          updated_at?: string | null
        }
        Update: {
          ai_access?: boolean | null
          analytics_enabled?: boolean | null
          ats_access?: boolean | null
          branded_page?: boolean | null
          bulk_export?: boolean | null
          company_page?: boolean | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          display_order?: number | null
          document_access?: string
          featured_jobs_limit?: number
          id?: string
          is_active?: boolean | null
          is_corporate?: boolean | null
          is_popular?: boolean | null
          job_posts_limit?: number
          name?: string
          price_monthly?: number
          price_yearly?: number
          priority_support?: boolean | null
          resume_views_limit?: number
          seat_limit?: number | null
          slug?: string
          support_level?: string | null
          talent_pool_access?: boolean | null
          talent_pool_views_limit?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          amount_eur: number | null
          ats_access: boolean | null
          cancelled_at: string | null
          created_at: string
          currency: string | null
          current_period_end: string | null
          current_period_start: string | null
          featured_jobs_limit: number | null
          id: string
          job_posts_limit: number | null
          last_payment_amount: number | null
          last_payment_at: string | null
          paypal_plan_id: string | null
          paypal_subscription_id: string | null
          plan_id: string | null
          plan_slug: string | null
          priority_support: boolean | null
          resume_views_limit: number | null
          status: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          tier: Database["public"]["Enums"]["subscription_tier"]
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_eur?: number | null
          ats_access?: boolean | null
          cancelled_at?: string | null
          created_at?: string
          currency?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          featured_jobs_limit?: number | null
          id?: string
          job_posts_limit?: number | null
          last_payment_amount?: number | null
          last_payment_at?: string | null
          paypal_plan_id?: string | null
          paypal_subscription_id?: string | null
          plan_id?: string | null
          plan_slug?: string | null
          priority_support?: boolean | null
          resume_views_limit?: number | null
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_eur?: number | null
          ats_access?: boolean | null
          cancelled_at?: string | null
          created_at?: string
          currency?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          featured_jobs_limit?: number | null
          id?: string
          job_posts_limit?: number | null
          last_payment_amount?: number | null
          last_payment_at?: string | null
          paypal_plan_id?: string | null
          paypal_subscription_id?: string | null
          plan_id?: string | null
          plan_slug?: string | null
          priority_support?: boolean | null
          resume_views_limit?: number | null
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      user_documents: {
        Row: {
          created_at: string
          doc_type: Database["public"]["Enums"]["user_document_type"]
          file_name: string
          file_path: string
          file_size: number
          gated_access: boolean
          id: string
          is_deleted: boolean
          is_verified: boolean
          mime_type: string
          thumbnail_path: string | null
          title: string | null
          updated_at: string
          user_id: string
          verification_error: string | null
        }
        Insert: {
          created_at?: string
          doc_type: Database["public"]["Enums"]["user_document_type"]
          file_name: string
          file_path: string
          file_size: number
          gated_access?: boolean
          id?: string
          is_deleted?: boolean
          is_verified?: boolean
          mime_type: string
          thumbnail_path?: string | null
          title?: string | null
          updated_at?: string
          user_id: string
          verification_error?: string | null
        }
        Update: {
          created_at?: string
          doc_type?: Database["public"]["Enums"]["user_document_type"]
          file_name?: string
          file_path?: string
          file_size?: number
          gated_access?: boolean
          id?: string
          is_deleted?: boolean
          is_verified?: boolean
          mime_type?: string
          thumbnail_path?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string
          verification_error?: string | null
        }
        Relationships: []
      }
      user_email_preferences: {
        Row: {
          application_updates: boolean | null
          created_at: string | null
          employer_notifications: boolean | null
          id: string
          job_alerts: boolean | null
          job_expiring_alerts: boolean | null
          marketing_emails: boolean | null
          resume_reminders: boolean | null
          unsubscribed_at: string | null
          updated_at: string | null
          user_id: string
          weekly_digest: boolean | null
        }
        Insert: {
          application_updates?: boolean | null
          created_at?: string | null
          employer_notifications?: boolean | null
          id?: string
          job_alerts?: boolean | null
          job_expiring_alerts?: boolean | null
          marketing_emails?: boolean | null
          resume_reminders?: boolean | null
          unsubscribed_at?: string | null
          updated_at?: string | null
          user_id: string
          weekly_digest?: boolean | null
        }
        Update: {
          application_updates?: boolean | null
          created_at?: string | null
          employer_notifications?: boolean | null
          id?: string
          job_alerts?: boolean | null
          job_expiring_alerts?: boolean | null
          marketing_emails?: boolean | null
          resume_reminders?: boolean | null
          unsubscribed_at?: string | null
          updated_at?: string | null
          user_id?: string
          weekly_digest?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "user_email_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
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
    }
    Views: {
      companies_public: {
        Row: {
          banner_url: string | null
          benefits_summary: string | null
          brand_gallery: Json | null
          brand_video_url: string | null
          branded_page_enabled: boolean | null
          company_size: string | null
          created_at: string | null
          culture: string | null
          description: string | null
          email: string | null
          followers_count: number | null
          founded_year: number | null
          id: string | null
          industry: string | null
          is_sponsored: boolean | null
          is_top_employer: boolean | null
          is_verified: boolean | null
          location: string | null
          logo_url: string | null
          mission: string | null
          name: string | null
          owner_id: string | null
          phone: string | null
          slug: string | null
          social_links: Json | null
          sponsorship_plan: string | null
          testimonials: Json | null
          top_employer_end_date: string | null
          top_employer_plan_type: string | null
          top_employer_start_date: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          banner_url?: string | null
          benefits_summary?: string | null
          brand_gallery?: Json | null
          brand_video_url?: string | null
          branded_page_enabled?: boolean | null
          company_size?: string | null
          created_at?: string | null
          culture?: string | null
          description?: string | null
          email?: string | null
          followers_count?: number | null
          founded_year?: number | null
          id?: string | null
          industry?: string | null
          is_sponsored?: boolean | null
          is_top_employer?: boolean | null
          is_verified?: boolean | null
          location?: string | null
          logo_url?: string | null
          mission?: string | null
          name?: string | null
          owner_id?: string | null
          phone?: string | null
          slug?: string | null
          social_links?: Json | null
          sponsorship_plan?: string | null
          testimonials?: Json | null
          top_employer_end_date?: string | null
          top_employer_plan_type?: string | null
          top_employer_start_date?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          banner_url?: string | null
          benefits_summary?: string | null
          brand_gallery?: Json | null
          brand_video_url?: string | null
          branded_page_enabled?: boolean | null
          company_size?: string | null
          created_at?: string | null
          culture?: string | null
          description?: string | null
          email?: string | null
          followers_count?: number | null
          founded_year?: number | null
          id?: string | null
          industry?: string | null
          is_sponsored?: boolean | null
          is_top_employer?: boolean | null
          is_verified?: boolean | null
          location?: string | null
          logo_url?: string | null
          mission?: string | null
          name?: string | null
          owner_id?: string | null
          phone?: string | null
          slug?: string | null
          social_links?: Json | null
          sponsorship_plan?: string | null
          testimonials?: Json | null
          top_employer_end_date?: string | null
          top_employer_plan_type?: string | null
          top_employer_start_date?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      jobs_public: {
        Row: {
          application_deadline: string | null
          applications_count: number | null
          benefits: string[] | null
          category: string | null
          company_id: string | null
          created_at: string | null
          description: string | null
          experience_level:
            | Database["public"]["Enums"]["experience_level"]
            | null
          id: string | null
          is_active: boolean | null
          is_featured: boolean | null
          is_remote: boolean | null
          is_salary_visible: boolean | null
          job_type: Database["public"]["Enums"]["job_type"] | null
          location: string | null
          posted_by: string | null
          requirements: string | null
          responsibilities: string | null
          salary_currency: string | null
          salary_max: number | null
          salary_min: number | null
          seo_description: string | null
          seo_title: string | null
          skills: string[] | null
          slug: string | null
          title: string | null
          updated_at: string | null
          views_count: number | null
        }
        Insert: {
          application_deadline?: string | null
          applications_count?: number | null
          benefits?: string[] | null
          category?: string | null
          company_id?: string | null
          created_at?: string | null
          description?: string | null
          experience_level?:
            | Database["public"]["Enums"]["experience_level"]
            | null
          id?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          is_remote?: boolean | null
          is_salary_visible?: boolean | null
          job_type?: Database["public"]["Enums"]["job_type"] | null
          location?: string | null
          posted_by?: string | null
          requirements?: string | null
          responsibilities?: string | null
          salary_currency?: string | null
          salary_max?: number | null
          salary_min?: number | null
          seo_description?: string | null
          seo_title?: string | null
          skills?: string[] | null
          slug?: string | null
          title?: string | null
          updated_at?: string | null
          views_count?: number | null
        }
        Update: {
          application_deadline?: string | null
          applications_count?: number | null
          benefits?: string[] | null
          category?: string | null
          company_id?: string | null
          created_at?: string | null
          description?: string | null
          experience_level?:
            | Database["public"]["Enums"]["experience_level"]
            | null
          id?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          is_remote?: boolean | null
          is_salary_visible?: boolean | null
          job_type?: Database["public"]["Enums"]["job_type"] | null
          location?: string | null
          posted_by?: string | null
          requirements?: string | null
          responsibilities?: string | null
          salary_currency?: string | null
          salary_max?: number | null
          salary_min?: number | null
          seo_description?: string | null
          seo_title?: string | null
          skills?: string[] | null
          slug?: string | null
          title?: string | null
          updated_at?: string | null
          views_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "jobs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      posts_public: {
        Row: {
          author_id: string | null
          blog_author_id: string | null
          category: string | null
          company_id: string | null
          content: string | null
          created_at: string | null
          excerpt: string | null
          featured_image: string | null
          id: string | null
          is_published: boolean | null
          is_sponsored: boolean | null
          language: string | null
          meta_description: string | null
          meta_keywords: string[] | null
          meta_title: string | null
          published_at: string | null
          slug: string | null
          tags: string[] | null
          title: string | null
          updated_at: string | null
          views_count: number | null
        }
        Insert: {
          author_id?: string | null
          blog_author_id?: string | null
          category?: string | null
          company_id?: string | null
          content?: string | null
          created_at?: string | null
          excerpt?: string | null
          featured_image?: string | null
          id?: string | null
          is_published?: boolean | null
          is_sponsored?: boolean | null
          language?: string | null
          meta_description?: string | null
          meta_keywords?: string[] | null
          meta_title?: string | null
          published_at?: string | null
          slug?: string | null
          tags?: string[] | null
          title?: string | null
          updated_at?: string | null
          views_count?: number | null
        }
        Update: {
          author_id?: string | null
          blog_author_id?: string | null
          category?: string | null
          company_id?: string | null
          content?: string | null
          created_at?: string | null
          excerpt?: string | null
          featured_image?: string | null
          id?: string | null
          is_published?: boolean | null
          is_sponsored?: boolean | null
          language?: string | null
          meta_description?: string | null
          meta_keywords?: string[] | null
          meta_title?: string | null
          published_at?: string | null
          slug?: string | null
          tags?: string[] | null
          title?: string | null
          updated_at?: string | null
          views_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_blog_author_id_fkey"
            columns: ["blog_author_id"]
            isOneToOne: false
            referencedRelation: "blog_authors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      searchable_candidates: {
        Row: {
          allow_contact: boolean | null
          availability:
            | Database["public"]["Enums"]["candidate_availability"]
            | null
          avatar_url: string | null
          desired_categories: string[] | null
          desired_locations: string[] | null
          desired_role: string | null
          headline: string | null
          initial: string | null
          min_salary: number | null
          profile_location: string | null
          salary_currency: string | null
          top_skills: string[] | null
          updated_at: string | null
          user_id: string | null
          years_experience: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      become_employer: { Args: never; Returns: undefined }
      calculate_text_similarity: {
        Args: { text1: string; text2: string }
        Returns: number
      }
      can_post_job: { Args: { user_id: string }; Returns: boolean }
      company_has_talent_pool: {
        Args: { _company_id: string }
        Returns: boolean
      }
      current_user_has_talent_pool: { Args: never; Returns: boolean }
      generate_credit_note_number: { Args: never; Returns: string }
      generate_invoice_number: { Args: never; Returns: string }
      get_ai_agent_analytics: {
        Args: never
        Returns: {
          avg_cost_per_call: number
          avg_duration_ms: number
          cost_per_1k_tokens: number
          failed_calls: number
          successful_calls: number
          total_calls: number
          total_cost: number
          total_tokens: number
        }[]
      }
      get_job_employer_contact: {
        Args: { _job_id: string }
        Returns: {
          company_name: string
          employer_email: string
          employer_name: string
          job_title: string
          owner_id: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_company_views: {
        Args: { company_slug: string }
        Returns: undefined
      }
      increment_job_views: { Args: { job_id: string }; Returns: undefined }
      increment_post_views: { Args: { post_slug: string }; Returns: undefined }
      indexnow_ping: { Args: { _path: string }; Returns: undefined }
      is_company_member: {
        Args: {
          _company_id: string
          _min_role?: Database["public"]["Enums"]["company_member_role"]
          _user_id: string
        }
        Returns: boolean
      }
      publish_client_package_job: {
        Args: { _job_id: string; _offer_id: string; _user_id: string }
        Returns: string
      }
      publish_employer_credit_job: {
        Args: { _job_id: string; _user_id: string }
        Returns: string
      }
      settle_client_package: { Args: { _order_id: string }; Returns: string }
      settle_paid_job_order: { Args: { _order_id: string }; Returns: string }
      unlock_candidate: {
        Args: { _candidate_user_id: string; _company_id: string }
        Returns: Json
      }
    }
    Enums: {
      ad_product_type:
        | "featured_job"
        | "priority_placement"
        | "daily_spotlight"
        | "newsletter_spot"
        | "social_promotion"
      ad_purchase_status: "pending" | "active" | "expired" | "cancelled"
      app_role: "admin" | "employer" | "job_seeker" | "editor"
      application_status:
        | "applied"
        | "viewed"
        | "shortlisted"
        | "interview"
        | "rejected"
        | "hired"
      candidate_availability:
        | "immediate"
        | "one_month"
        | "three_months"
        | "passive"
      company_member_role: "owner" | "recruiter" | "viewer"
      discount_type: "percentage" | "fixed"
      experience_level: "entry" | "mid" | "senior" | "executive"
      job_type:
        | "full_time"
        | "part_time"
        | "contract"
        | "internship"
        | "freelance"
      payment_method: "stripe" | "paypal" | "bank_transfer"
      payment_status: "pending" | "completed" | "failed" | "refunded"
      subscription_status: "active" | "expired" | "cancelled" | "trial"
      subscription_tier: "free" | "basic" | "pro" | "premium"
      user_document_type: "certification" | "cover_letter" | "experience_letter"
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
      ad_product_type: [
        "featured_job",
        "priority_placement",
        "daily_spotlight",
        "newsletter_spot",
        "social_promotion",
      ],
      ad_purchase_status: ["pending", "active", "expired", "cancelled"],
      app_role: ["admin", "employer", "job_seeker", "editor"],
      application_status: [
        "applied",
        "viewed",
        "shortlisted",
        "interview",
        "rejected",
        "hired",
      ],
      candidate_availability: [
        "immediate",
        "one_month",
        "three_months",
        "passive",
      ],
      company_member_role: ["owner", "recruiter", "viewer"],
      discount_type: ["percentage", "fixed"],
      experience_level: ["entry", "mid", "senior", "executive"],
      job_type: [
        "full_time",
        "part_time",
        "contract",
        "internship",
        "freelance",
      ],
      payment_method: ["stripe", "paypal", "bank_transfer"],
      payment_status: ["pending", "completed", "failed", "refunded"],
      subscription_status: ["active", "expired", "cancelled", "trial"],
      subscription_tier: ["free", "basic", "pro", "premium"],
      user_document_type: [
        "certification",
        "cover_letter",
        "experience_letter",
      ],
    },
  },
} as const
