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
            foreignKeyName: "ad_analytics_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
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
            foreignKeyName: "ad_purchases_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
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
            foreignKeyName: "analytics_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
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
        ]
      }
      companies: {
        Row: {
          banner_url: string | null
          company_size: string | null
          created_at: string
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
          name: string
          owner_id: string
          phone: string | null
          slug: string
          social_links: Json | null
          sponsorship_plan: string | null
          top_employer_end_date: string | null
          top_employer_plan_type: string | null
          top_employer_start_date: string | null
          updated_at: string
          views_count: number | null
          website: string | null
        }
        Insert: {
          banner_url?: string | null
          company_size?: string | null
          created_at?: string
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
          name: string
          owner_id: string
          phone?: string | null
          slug: string
          social_links?: Json | null
          sponsorship_plan?: string | null
          top_employer_end_date?: string | null
          top_employer_plan_type?: string | null
          top_employer_start_date?: string | null
          updated_at?: string
          views_count?: number | null
          website?: string | null
        }
        Update: {
          banner_url?: string | null
          company_size?: string | null
          created_at?: string
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
          name?: string
          owner_id?: string
          phone?: string | null
          slug?: string
          social_links?: Json | null
          sponsorship_plan?: string | null
          top_employer_end_date?: string | null
          top_employer_plan_type?: string | null
          top_employer_start_date?: string | null
          updated_at?: string
          views_count?: number | null
          website?: string | null
        }
        Relationships: []
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
            foreignKeyName: "payment_transactions_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          author_id: string
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
            foreignKeyName: "posts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
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
            foreignKeyName: "sponsored_content_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          ai_access: boolean | null
          analytics_enabled: boolean | null
          ats_access: boolean | null
          company_page: boolean | null
          created_at: string | null
          currency: string | null
          description: string | null
          display_order: number | null
          featured_jobs_limit: number
          id: string
          is_active: boolean | null
          is_popular: boolean | null
          job_posts_limit: number
          name: string
          price_monthly: number
          price_yearly: number
          priority_support: boolean | null
          resume_views_limit: number
          slug: string
          support_level: string | null
          updated_at: string | null
        }
        Insert: {
          ai_access?: boolean | null
          analytics_enabled?: boolean | null
          ats_access?: boolean | null
          company_page?: boolean | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          display_order?: number | null
          featured_jobs_limit?: number
          id?: string
          is_active?: boolean | null
          is_popular?: boolean | null
          job_posts_limit?: number
          name: string
          price_monthly?: number
          price_yearly?: number
          priority_support?: boolean | null
          resume_views_limit?: number
          slug: string
          support_level?: string | null
          updated_at?: string | null
        }
        Update: {
          ai_access?: boolean | null
          analytics_enabled?: boolean | null
          ats_access?: boolean | null
          company_page?: boolean | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          display_order?: number | null
          featured_jobs_limit?: number
          id?: string
          is_active?: boolean | null
          is_popular?: boolean | null
          job_posts_limit?: number
          name?: string
          price_monthly?: number
          price_yearly?: number
          priority_support?: boolean | null
          resume_views_limit?: number
          slug?: string
          support_level?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          ats_access: boolean | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          featured_jobs_limit: number | null
          id: string
          job_posts_limit: number | null
          plan_id: string | null
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
          ats_access?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          featured_jobs_limit?: number | null
          id?: string
          job_posts_limit?: number | null
          plan_id?: string | null
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
          ats_access?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          featured_jobs_limit?: number | null
          id?: string
          job_posts_limit?: number | null
          plan_id?: string | null
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
      user_email_preferences: {
        Row: {
          application_updates: boolean | null
          created_at: string | null
          id: string
          job_alerts: boolean | null
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
          id?: string
          job_alerts?: boolean | null
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
          id?: string
          job_alerts?: boolean | null
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
      [_ in never]: never
    }
    Functions: {
      calculate_text_similarity: {
        Args: { text1: string; text2: string }
        Returns: number
      }
      can_post_job: { Args: { user_id: string }; Returns: boolean }
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
    },
  },
} as const
