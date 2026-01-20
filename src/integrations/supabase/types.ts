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
      affiliate_commissions: {
        Row: {
          affiliate_id: string
          amount: number
          available_at: string | null
          created_at: string
          id: string
          status: string
          transaction_id: string
        }
        Insert: {
          affiliate_id: string
          amount: number
          available_at?: string | null
          created_at?: string
          id?: string
          status?: string
          transaction_id: string
        }
        Update: {
          affiliate_id?: string
          amount?: number
          available_at?: string | null
          created_at?: string
          id?: string
          status?: string
          transaction_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_commissions_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_commissions_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_withdrawals: {
        Row: {
          affiliate_id: string
          amount: number
          created_at: string
          id: string
          notes: string | null
          pix_key: string
          pix_key_type: string
          processed_at: string | null
          processed_by: string | null
          requested_at: string
          status: string
        }
        Insert: {
          affiliate_id: string
          amount: number
          created_at?: string
          id?: string
          notes?: string | null
          pix_key: string
          pix_key_type: string
          processed_at?: string | null
          processed_by?: string | null
          requested_at?: string
          status?: string
        }
        Update: {
          affiliate_id?: string
          amount?: number
          created_at?: string
          id?: string
          notes?: string | null
          pix_key?: string
          pix_key_type?: string
          processed_at?: string | null
          processed_by?: string | null
          requested_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_withdrawals_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliates: {
        Row: {
          affiliate_code: string
          available_balance: number
          commission_rate: number | null
          created_at: string
          id: string
          pending_balance: number
          pix_key: string | null
          pix_key_type: string | null
          product_id: string
          status: string
          total_earnings: number
          total_sales: number
          user_id: string
        }
        Insert: {
          affiliate_code: string
          available_balance?: number
          commission_rate?: number | null
          created_at?: string
          id?: string
          pending_balance?: number
          pix_key?: string | null
          pix_key_type?: string | null
          product_id: string
          status?: string
          total_earnings?: number
          total_sales?: number
          user_id: string
        }
        Update: {
          affiliate_code?: string
          available_balance?: number
          commission_rate?: number | null
          created_at?: string
          id?: string
          pending_balance?: number
          pix_key?: string | null
          pix_key_type?: string | null
          product_id?: string
          status?: string
          total_earnings?: number
          total_sales?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliates_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      api_keys: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          key_hash: string
          key_prefix: string
          last_used_at: string | null
          name: string
          permissions: string[]
          product_id: string | null
          rate_limit: number
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          key_hash: string
          key_prefix: string
          last_used_at?: string | null
          name: string
          permissions?: string[]
          product_id?: string | null
          rate_limit?: number
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          key_hash?: string
          key_prefix?: string
          last_used_at?: string | null
          name?: string
          permissions?: string[]
          product_id?: string | null
          rate_limit?: number
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_keys_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      broadcast_templates: {
        Row: {
          created_at: string | null
          id: string
          media_type: string | null
          media_url: string | null
          message: string
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          media_type?: string | null
          media_url?: string | null
          message: string
          name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          media_type?: string | null
          media_url?: string | null
          message?: string
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      checkout_settings: {
        Row: {
          background_color: string | null
          border_radius: string | null
          button_color: string | null
          button_text_color: string | null
          created_at: string
          enable_email_notification: boolean | null
          enable_sms_notification: boolean | null
          enable_timer: boolean | null
          facebook_pixel: string | null
          favicon_url: string | null
          font_family: string | null
          google_analytics: string | null
          guarantee_days: number | null
          guarantee_text: string | null
          id: string
          layout: string | null
          logo_url: string | null
          page_title: string | null
          primary_color: string | null
          require_address: boolean | null
          require_cpf: boolean | null
          require_phone: boolean | null
          show_guarantee: boolean | null
          show_order_summary: boolean | null
          show_product_description: boolean | null
          show_product_image: boolean | null
          show_security_badge: boolean | null
          show_stock: boolean | null
          stock_count: number | null
          stock_text: string | null
          text_color: string | null
          tiktok_pixel: string | null
          timer_minutes: number | null
          timer_text: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          background_color?: string | null
          border_radius?: string | null
          button_color?: string | null
          button_text_color?: string | null
          created_at?: string
          enable_email_notification?: boolean | null
          enable_sms_notification?: boolean | null
          enable_timer?: boolean | null
          facebook_pixel?: string | null
          favicon_url?: string | null
          font_family?: string | null
          google_analytics?: string | null
          guarantee_days?: number | null
          guarantee_text?: string | null
          id?: string
          layout?: string | null
          logo_url?: string | null
          page_title?: string | null
          primary_color?: string | null
          require_address?: boolean | null
          require_cpf?: boolean | null
          require_phone?: boolean | null
          show_guarantee?: boolean | null
          show_order_summary?: boolean | null
          show_product_description?: boolean | null
          show_product_image?: boolean | null
          show_security_badge?: boolean | null
          show_stock?: boolean | null
          stock_count?: number | null
          stock_text?: string | null
          text_color?: string | null
          tiktok_pixel?: string | null
          timer_minutes?: number | null
          timer_text?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          background_color?: string | null
          border_radius?: string | null
          button_color?: string | null
          button_text_color?: string | null
          created_at?: string
          enable_email_notification?: boolean | null
          enable_sms_notification?: boolean | null
          enable_timer?: boolean | null
          facebook_pixel?: string | null
          favicon_url?: string | null
          font_family?: string | null
          google_analytics?: string | null
          guarantee_days?: number | null
          guarantee_text?: string | null
          id?: string
          layout?: string | null
          logo_url?: string | null
          page_title?: string | null
          primary_color?: string | null
          require_address?: boolean | null
          require_cpf?: boolean | null
          require_phone?: boolean | null
          show_guarantee?: boolean | null
          show_order_summary?: boolean | null
          show_product_description?: boolean | null
          show_product_image?: boolean | null
          show_security_badge?: boolean | null
          show_stock?: boolean | null
          stock_count?: number | null
          stock_text?: string | null
          text_color?: string | null
          tiktok_pixel?: string | null
          timer_minutes?: number | null
          timer_text?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      checkout_templates: {
        Row: {
          background_color: string | null
          border_radius: string | null
          button_color: string | null
          button_text_color: string | null
          created_at: string
          custom_domain: string | null
          custom_slug: string | null
          description: string | null
          domain_verified: boolean | null
          enable_email_notification: boolean | null
          enable_sms_notification: boolean | null
          enable_timer: boolean | null
          facebook_pixel: string | null
          favicon_url: string | null
          font_family: string | null
          google_analytics: string | null
          guarantee_days: number | null
          guarantee_text: string | null
          id: string
          layout: string | null
          logo_url: string | null
          name: string
          page_title: string | null
          primary_color: string | null
          require_address: boolean | null
          require_cpf: boolean | null
          require_phone: boolean | null
          show_guarantee: boolean | null
          show_order_bump_after_button: boolean | null
          show_order_summary: boolean | null
          show_product_description: boolean | null
          show_product_image: boolean | null
          show_security_badge: boolean | null
          show_stock: boolean | null
          stock_count: number | null
          stock_text: string | null
          text_color: string | null
          theme: string | null
          tiktok_pixel: string | null
          timer_minutes: number | null
          timer_text: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          background_color?: string | null
          border_radius?: string | null
          button_color?: string | null
          button_text_color?: string | null
          created_at?: string
          custom_domain?: string | null
          custom_slug?: string | null
          description?: string | null
          domain_verified?: boolean | null
          enable_email_notification?: boolean | null
          enable_sms_notification?: boolean | null
          enable_timer?: boolean | null
          facebook_pixel?: string | null
          favicon_url?: string | null
          font_family?: string | null
          google_analytics?: string | null
          guarantee_days?: number | null
          guarantee_text?: string | null
          id?: string
          layout?: string | null
          logo_url?: string | null
          name: string
          page_title?: string | null
          primary_color?: string | null
          require_address?: boolean | null
          require_cpf?: boolean | null
          require_phone?: boolean | null
          show_guarantee?: boolean | null
          show_order_bump_after_button?: boolean | null
          show_order_summary?: boolean | null
          show_product_description?: boolean | null
          show_product_image?: boolean | null
          show_security_badge?: boolean | null
          show_stock?: boolean | null
          stock_count?: number | null
          stock_text?: string | null
          text_color?: string | null
          theme?: string | null
          tiktok_pixel?: string | null
          timer_minutes?: number | null
          timer_text?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          background_color?: string | null
          border_radius?: string | null
          button_color?: string | null
          button_text_color?: string | null
          created_at?: string
          custom_domain?: string | null
          custom_slug?: string | null
          description?: string | null
          domain_verified?: boolean | null
          enable_email_notification?: boolean | null
          enable_sms_notification?: boolean | null
          enable_timer?: boolean | null
          facebook_pixel?: string | null
          favicon_url?: string | null
          font_family?: string | null
          google_analytics?: string | null
          guarantee_days?: number | null
          guarantee_text?: string | null
          id?: string
          layout?: string | null
          logo_url?: string | null
          name?: string
          page_title?: string | null
          primary_color?: string | null
          require_address?: boolean | null
          require_cpf?: boolean | null
          require_phone?: boolean | null
          show_guarantee?: boolean | null
          show_order_bump_after_button?: boolean | null
          show_order_summary?: boolean | null
          show_product_description?: boolean | null
          show_product_image?: boolean | null
          show_security_badge?: boolean | null
          show_stock?: boolean | null
          stock_count?: number | null
          stock_text?: string | null
          text_color?: string | null
          theme?: string | null
          tiktok_pixel?: string | null
          timer_minutes?: number | null
          timer_text?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      email_broadcast_recipients: {
        Row: {
          broadcast_id: string
          created_at: string | null
          email: string
          error_message: string | null
          id: string
          name: string | null
          sent_at: string | null
          status: string | null
        }
        Insert: {
          broadcast_id: string
          created_at?: string | null
          email: string
          error_message?: string | null
          id?: string
          name?: string | null
          sent_at?: string | null
          status?: string | null
        }
        Update: {
          broadcast_id?: string
          created_at?: string | null
          email?: string
          error_message?: string | null
          id?: string
          name?: string | null
          sent_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_broadcast_recipients_broadcast_id_fkey"
            columns: ["broadcast_id"]
            isOneToOne: false
            referencedRelation: "email_broadcasts"
            referencedColumns: ["id"]
          },
        ]
      }
      email_broadcasts: {
        Row: {
          admin_id: string
          completed_at: string | null
          created_at: string | null
          failed_count: number | null
          html_content: string
          id: string
          interval_max_seconds: number | null
          interval_min_seconds: number | null
          interval_seconds: number | null
          last_processing_at: string | null
          name: string
          scheduled_at: string | null
          sent_count: number | null
          started_at: string | null
          status: string | null
          subject: string
          total_recipients: number | null
        }
        Insert: {
          admin_id: string
          completed_at?: string | null
          created_at?: string | null
          failed_count?: number | null
          html_content: string
          id?: string
          interval_max_seconds?: number | null
          interval_min_seconds?: number | null
          interval_seconds?: number | null
          last_processing_at?: string | null
          name: string
          scheduled_at?: string | null
          sent_count?: number | null
          started_at?: string | null
          status?: string | null
          subject: string
          total_recipients?: number | null
        }
        Update: {
          admin_id?: string
          completed_at?: string | null
          created_at?: string | null
          failed_count?: number | null
          html_content?: string
          id?: string
          interval_max_seconds?: number | null
          interval_min_seconds?: number | null
          interval_seconds?: number | null
          last_processing_at?: string | null
          name?: string
          scheduled_at?: string | null
          sent_count?: number | null
          started_at?: string | null
          status?: string | null
          subject?: string
          total_recipients?: number | null
        }
        Relationships: []
      }
      external_webhook_logs: {
        Row: {
          error_message: string | null
          event_type: string
          id: string
          payload: Json | null
          response_body: string | null
          response_status: number | null
          sent_at: string | null
          webhook_id: string | null
        }
        Insert: {
          error_message?: string | null
          event_type: string
          id?: string
          payload?: Json | null
          response_body?: string | null
          response_status?: number | null
          sent_at?: string | null
          webhook_id?: string | null
        }
        Update: {
          error_message?: string | null
          event_type?: string
          id?: string
          payload?: Json | null
          response_body?: string | null
          response_status?: number | null
          sent_at?: string | null
          webhook_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "external_webhook_logs_webhook_id_fkey"
            columns: ["webhook_id"]
            isOneToOne: false
            referencedRelation: "webhook_configs"
            referencedColumns: ["id"]
          },
        ]
      }
      gateflow_product: {
        Row: {
          checkout_url: string | null
          cover_url: string | null
          created_at: string | null
          description: string | null
          id: string
          is_main_product: boolean | null
          name: string | null
          price: number
          reseller_commission: number | null
          sales_page_url: string | null
          status: string | null
          universal_access: boolean | null
          updated_at: string | null
        }
        Insert: {
          checkout_url?: string | null
          cover_url?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_main_product?: boolean | null
          name?: string | null
          price?: number
          reseller_commission?: number | null
          sales_page_url?: string | null
          status?: string | null
          universal_access?: boolean | null
          updated_at?: string | null
        }
        Update: {
          checkout_url?: string | null
          cover_url?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_main_product?: boolean | null
          name?: string | null
          price?: number
          reseller_commission?: number | null
          sales_page_url?: string | null
          status?: string | null
          universal_access?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      gateflow_sales: {
        Row: {
          amount: number
          buyer_email: string
          buyer_name: string | null
          buyer_phone: string | null
          commission_amount: number
          commission_paid_at: string | null
          created_at: string | null
          id: string
          notes: string | null
          reseller_tenant_id: string | null
          reseller_user_id: string | null
          status: string | null
          transaction_id: string | null
        }
        Insert: {
          amount: number
          buyer_email: string
          buyer_name?: string | null
          buyer_phone?: string | null
          commission_amount: number
          commission_paid_at?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          reseller_tenant_id?: string | null
          reseller_user_id?: string | null
          status?: string | null
          transaction_id?: string | null
        }
        Update: {
          amount?: number
          buyer_email?: string
          buyer_name?: string | null
          buyer_phone?: string | null
          commission_amount?: number
          commission_paid_at?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          reseller_tenant_id?: string | null
          reseller_user_id?: string | null
          status?: string | null
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gateflow_sales_reseller_tenant_id_fkey"
            columns: ["reseller_tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      member_email_logs: {
        Row: {
          created_at: string
          email_type: string
          error_message: string | null
          id: string
          member_id: string
          opened_at: string | null
          recipient_email: string
          sent_at: string
          status: string
          subject: string | null
        }
        Insert: {
          created_at?: string
          email_type?: string
          error_message?: string | null
          id?: string
          member_id: string
          opened_at?: string | null
          recipient_email: string
          sent_at?: string
          status?: string
          subject?: string | null
        }
        Update: {
          created_at?: string
          email_type?: string
          error_message?: string | null
          id?: string
          member_id?: string
          opened_at?: string | null
          recipient_email?: string
          sent_at?: string
          status?: string
          subject?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "member_email_logs_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      member_lesson_progress: {
        Row: {
          completed_at: string
          created_at: string
          id: string
          lesson_id: string
          member_id: string
        }
        Insert: {
          completed_at?: string
          created_at?: string
          id?: string
          lesson_id: string
          member_id: string
        }
        Update: {
          completed_at?: string
          created_at?: string
          id?: string
          lesson_id?: string
          member_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "module_lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_lesson_progress_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      members: {
        Row: {
          access_level: string
          created_at: string
          expires_at: string | null
          id: string
          last_accessed_at: string | null
          product_id: string
          status: string
          transaction_id: string | null
          user_id: string
        }
        Insert: {
          access_level?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          last_accessed_at?: string | null
          product_id: string
          status?: string
          transaction_id?: string | null
          user_id: string
        }
        Update: {
          access_level?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          last_accessed_at?: string | null
          product_id?: string
          status?: string
          transaction_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "members_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "members_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      module_lessons: {
        Row: {
          content_type: string
          content_url: string | null
          created_at: string
          description: string | null
          duration_minutes: number | null
          id: string
          is_free: boolean
          module_id: string
          name: string
          order_index: number
          thumbnail_url: string | null
          updated_at: string
        }
        Insert: {
          content_type?: string
          content_url?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_free?: boolean
          module_id: string
          name: string
          order_index?: number
          thumbnail_url?: string | null
          updated_at?: string
        }
        Update: {
          content_type?: string
          content_url?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_free?: boolean
          module_id?: string
          name?: string
          order_index?: number
          thumbnail_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "module_lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "product_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_gateways: {
        Row: {
          created_at: string | null
          display_order: number | null
          id: string
          instructions: string | null
          is_active: boolean | null
          logo_url: string | null
          name: string
          required_fields: Json | null
          slug: string
          supports_boleto: boolean | null
          supports_card: boolean | null
          supports_pix: boolean | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          instructions?: string | null
          is_active?: boolean | null
          logo_url?: string | null
          name: string
          required_fields?: Json | null
          slug: string
          supports_boleto?: boolean | null
          supports_card?: boolean | null
          supports_pix?: boolean | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          instructions?: string | null
          is_active?: boolean | null
          logo_url?: string | null
          name?: string
          required_fields?: Json | null
          slug?: string
          supports_boleto?: boolean | null
          supports_card?: boolean | null
          supports_pix?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      pix_charges: {
        Row: {
          affiliate_id: string | null
          amount: number
          buyer_cpf: string | null
          buyer_email: string
          buyer_name: string | null
          buyer_phone: string | null
          copy_paste: string | null
          created_at: string
          expires_at: string
          external_id: string
          id: string
          is_recovery: boolean | null
          order_bumps: string[] | null
          original_charge_id: string | null
          paid_at: string | null
          product_id: string | null
          qr_code: string | null
          qr_code_base64: string | null
          recovery_message_id: string | null
          seller_id: string | null
          status: Database["public"]["Enums"]["transaction_status"]
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Insert: {
          affiliate_id?: string | null
          amount: number
          buyer_cpf?: string | null
          buyer_email: string
          buyer_name?: string | null
          buyer_phone?: string | null
          copy_paste?: string | null
          created_at?: string
          expires_at: string
          external_id: string
          id?: string
          is_recovery?: boolean | null
          order_bumps?: string[] | null
          original_charge_id?: string | null
          paid_at?: string | null
          product_id?: string | null
          qr_code?: string | null
          qr_code_base64?: string | null
          recovery_message_id?: string | null
          seller_id?: string | null
          status?: Database["public"]["Enums"]["transaction_status"]
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Update: {
          affiliate_id?: string | null
          amount?: number
          buyer_cpf?: string | null
          buyer_email?: string
          buyer_name?: string | null
          buyer_phone?: string | null
          copy_paste?: string | null
          created_at?: string
          expires_at?: string
          external_id?: string
          id?: string
          is_recovery?: boolean | null
          order_bumps?: string[] | null
          original_charge_id?: string | null
          paid_at?: string | null
          product_id?: string | null
          qr_code?: string | null
          qr_code_base64?: string | null
          recovery_message_id?: string | null
          seller_id?: string | null
          status?: Database["public"]["Enums"]["transaction_status"]
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pix_charges_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pix_charges_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_features: {
        Row: {
          category: string | null
          description: string | null
          display_order: number | null
          feature_key: string
          feature_name: string
          icon: string | null
          id: string
          is_enabled: boolean | null
          menu_page: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          category?: string | null
          description?: string | null
          display_order?: number | null
          feature_key: string
          feature_name: string
          icon?: string | null
          id?: string
          is_enabled?: boolean | null
          menu_page?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          category?: string | null
          description?: string | null
          display_order?: number | null
          feature_key?: string
          feature_name?: string
          icon?: string | null
          id?: string
          is_enabled?: boolean | null
          menu_page?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      platform_gateway_logs: {
        Row: {
          action: string
          amount: number
          buyer_email: string | null
          buyer_name: string | null
          charge_id: string | null
          created_at: string
          error_message: string | null
          external_id: string | null
          gateway_response: Json | null
          id: string
          ip_address: string | null
          product_id: string | null
          seller_id: string
          transaction_id: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          amount?: number
          buyer_email?: string | null
          buyer_name?: string | null
          charge_id?: string | null
          created_at?: string
          error_message?: string | null
          external_id?: string | null
          gateway_response?: Json | null
          id?: string
          ip_address?: string | null
          product_id?: string | null
          seller_id: string
          transaction_id?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          amount?: number
          buyer_email?: string | null
          buyer_name?: string | null
          charge_id?: string | null
          created_at?: string
          error_message?: string | null
          external_id?: string | null
          gateway_response?: Json | null
          id?: string
          ip_address?: string | null
          product_id?: string | null
          seller_id?: string
          transaction_id?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "platform_gateway_logs_charge_id_fkey"
            columns: ["charge_id"]
            isOneToOne: false
            referencedRelation: "pix_charges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_gateway_logs_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_gateway_logs_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_invoices: {
        Row: {
          created_at: string | null
          due_date: string
          fee_fixed: number
          fee_percentage: number
          fee_total: number
          id: string
          paid_at: string | null
          period_end: string
          period_start: string
          pix_charge_id: string | null
          pix_code: string | null
          pix_qr_code: string | null
          status: string | null
          total_amount: number | null
          total_sales: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          due_date: string
          fee_fixed?: number
          fee_percentage?: number
          fee_total?: number
          id?: string
          paid_at?: string | null
          period_end: string
          period_start: string
          pix_charge_id?: string | null
          pix_code?: string | null
          pix_qr_code?: string | null
          status?: string | null
          total_amount?: number | null
          total_sales?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          due_date?: string
          fee_fixed?: number
          fee_percentage?: number
          fee_total?: number
          id?: string
          paid_at?: string | null
          period_end?: string
          period_start?: string
          pix_charge_id?: string | null
          pix_code?: string | null
          pix_qr_code?: string | null
          status?: string | null
          total_amount?: number | null
          total_sales?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      platform_settings: {
        Row: {
          created_at: string
          default_checkout_template_id: string | null
          fee_fixed_per_sale: number | null
          fee_percentage: number | null
          id: string
          invoice_due_days: number | null
          maintenance_mode: boolean
          min_withdrawal: number
          own_gateway_fee_fixed: number | null
          own_gateway_fee_percentage: number | null
          pix_enabled: boolean
          platform_fee: number
          platform_gateway_fee_fixed: number | null
          platform_gateway_fee_percentage: number | null
          platform_gateway_type: string
          platform_gateway_withdrawal_fee: number | null
          privacy_url: string | null
          support_email: string | null
          support_phone: string | null
          terms_url: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_checkout_template_id?: string | null
          fee_fixed_per_sale?: number | null
          fee_percentage?: number | null
          id?: string
          invoice_due_days?: number | null
          maintenance_mode?: boolean
          min_withdrawal?: number
          own_gateway_fee_fixed?: number | null
          own_gateway_fee_percentage?: number | null
          pix_enabled?: boolean
          platform_fee?: number
          platform_gateway_fee_fixed?: number | null
          platform_gateway_fee_percentage?: number | null
          platform_gateway_type?: string
          platform_gateway_withdrawal_fee?: number | null
          privacy_url?: string | null
          support_email?: string | null
          support_phone?: string | null
          terms_url?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_checkout_template_id?: string | null
          fee_fixed_per_sale?: number | null
          fee_percentage?: number | null
          id?: string
          invoice_due_days?: number | null
          maintenance_mode?: boolean
          min_withdrawal?: number
          own_gateway_fee_fixed?: number | null
          own_gateway_fee_percentage?: number | null
          pix_enabled?: boolean
          platform_fee?: number
          platform_gateway_fee_fixed?: number | null
          platform_gateway_fee_percentage?: number | null
          platform_gateway_type?: string
          platform_gateway_withdrawal_fee?: number | null
          privacy_url?: string | null
          support_email?: string | null
          support_phone?: string | null
          terms_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_settings_default_checkout_template_id_fkey"
            columns: ["default_checkout_template_id"]
            isOneToOne: false
            referencedRelation: "checkout_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      product_modules: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          order_index: number
          product_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          order_index?: number
          product_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          order_index?: number
          product_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_modules_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          allow_affiliates: boolean
          auto_send_access_email: boolean | null
          checkout_template_id: string | null
          checkout_theme: string | null
          commission_rate: number
          content_url: string | null
          cover_url: string | null
          created_at: string
          custom_domain: string | null
          custom_slug: string | null
          deliverable_type: string | null
          deliverable_url: string | null
          description: string | null
          domain_verified: boolean | null
          facebook_pixel: string | null
          google_analytics: string | null
          id: string
          name: string
          order_bumps: string[] | null
          parent_product_id: string | null
          price: number
          seller_id: string
          status: string
          tiktok_pixel: string | null
          type: string
          updated_at: string
        }
        Insert: {
          allow_affiliates?: boolean
          auto_send_access_email?: boolean | null
          checkout_template_id?: string | null
          checkout_theme?: string | null
          commission_rate?: number
          content_url?: string | null
          cover_url?: string | null
          created_at?: string
          custom_domain?: string | null
          custom_slug?: string | null
          deliverable_type?: string | null
          deliverable_url?: string | null
          description?: string | null
          domain_verified?: boolean | null
          facebook_pixel?: string | null
          google_analytics?: string | null
          id?: string
          name: string
          order_bumps?: string[] | null
          parent_product_id?: string | null
          price?: number
          seller_id: string
          status?: string
          tiktok_pixel?: string | null
          type?: string
          updated_at?: string
        }
        Update: {
          allow_affiliates?: boolean
          auto_send_access_email?: boolean | null
          checkout_template_id?: string | null
          checkout_theme?: string | null
          commission_rate?: number
          content_url?: string | null
          cover_url?: string | null
          created_at?: string
          custom_domain?: string | null
          custom_slug?: string | null
          deliverable_type?: string | null
          deliverable_url?: string | null
          description?: string | null
          domain_verified?: boolean | null
          facebook_pixel?: string | null
          google_analytics?: string | null
          id?: string
          name?: string
          order_bumps?: string[] | null
          parent_product_id?: string | null
          price?: number
          seller_id?: string
          status?: string
          tiktok_pixel?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_checkout_template_id_fkey"
            columns: ["checkout_template_id"]
            isOneToOne: false
            referencedRelation: "checkout_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_parent_product_id_fkey"
            columns: ["parent_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          average_revenue: string | null
          company_name: string | null
          created_at: string
          document_number: string | null
          document_type: string | null
          email: string | null
          full_name: string | null
          id: string
          payment_mode: string | null
          phone: string | null
          pix_key: string | null
          sales_niche: string | null
          tenant_id: string | null
          terms_accepted_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          average_revenue?: string | null
          company_name?: string | null
          created_at?: string
          document_number?: string | null
          document_type?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          payment_mode?: string | null
          phone?: string | null
          pix_key?: string | null
          sales_niche?: string | null
          tenant_id?: string | null
          terms_accepted_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          average_revenue?: string | null
          company_name?: string | null
          created_at?: string
          document_number?: string | null
          document_type?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          payment_mode?: string | null
          phone?: string | null
          pix_key?: string | null
          sales_niche?: string | null
          tenant_id?: string | null
          terms_accepted_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_connections: {
        Row: {
          condition: Json | null
          created_at: string
          id: string
          is_default: boolean | null
          quiz_id: string
          source_step_id: string
          target_step_id: string
        }
        Insert: {
          condition?: Json | null
          created_at?: string
          id?: string
          is_default?: boolean | null
          quiz_id: string
          source_step_id: string
          target_step_id: string
        }
        Update: {
          condition?: Json | null
          created_at?: string
          id?: string
          is_default?: boolean | null
          quiz_id?: string
          source_step_id?: string
          target_step_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_connections_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_connections_source_step_id_fkey"
            columns: ["source_step_id"]
            isOneToOne: false
            referencedRelation: "quiz_steps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_connections_target_step_id_fkey"
            columns: ["target_step_id"]
            isOneToOne: false
            referencedRelation: "quiz_steps"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_elements: {
        Row: {
          content: Json | null
          created_at: string
          element_type: string
          id: string
          order_index: number
          step_id: string
          styles: Json | null
        }
        Insert: {
          content?: Json | null
          created_at?: string
          element_type: string
          id?: string
          order_index?: number
          step_id: string
          styles?: Json | null
        }
        Update: {
          content?: Json | null
          created_at?: string
          element_type?: string
          id?: string
          order_index?: number
          step_id?: string
          styles?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "quiz_elements_step_id_fkey"
            columns: ["step_id"]
            isOneToOne: false
            referencedRelation: "quiz_steps"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_lead_responses: {
        Row: {
          element_id: string | null
          id: string
          lead_id: string
          responded_at: string
          response: Json
          step_id: string
        }
        Insert: {
          element_id?: string | null
          id?: string
          lead_id: string
          responded_at?: string
          response: Json
          step_id: string
        }
        Update: {
          element_id?: string | null
          id?: string
          lead_id?: string
          responded_at?: string
          response?: Json
          step_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_lead_responses_element_id_fkey"
            columns: ["element_id"]
            isOneToOne: false
            referencedRelation: "quiz_elements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_lead_responses_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "quiz_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_lead_responses_step_id_fkey"
            columns: ["step_id"]
            isOneToOne: false
            referencedRelation: "quiz_steps"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_leads: {
        Row: {
          completed_at: string | null
          current_step_id: string | null
          email: string | null
          id: string
          interaction_count: number | null
          ip_address: string | null
          last_interaction_at: string | null
          name: string | null
          phone: string | null
          quiz_id: string
          session_id: string
          started_at: string
          status: string
          user_agent: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Insert: {
          completed_at?: string | null
          current_step_id?: string | null
          email?: string | null
          id?: string
          interaction_count?: number | null
          ip_address?: string | null
          last_interaction_at?: string | null
          name?: string | null
          phone?: string | null
          quiz_id: string
          session_id: string
          started_at?: string
          status?: string
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Update: {
          completed_at?: string | null
          current_step_id?: string | null
          email?: string | null
          id?: string
          interaction_count?: number | null
          ip_address?: string | null
          last_interaction_at?: string | null
          name?: string | null
          phone?: string | null
          quiz_id?: string
          session_id?: string
          started_at?: string
          status?: string
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quiz_leads_current_step_id_fkey"
            columns: ["current_step_id"]
            isOneToOne: false
            referencedRelation: "quiz_steps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_leads_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_steps: {
        Row: {
          created_at: string
          id: string
          name: string
          order_index: number
          position_x: number | null
          position_y: number | null
          quiz_id: string
          settings: Json | null
          step_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          order_index?: number
          position_x?: number | null
          position_y?: number | null
          quiz_id: string
          settings?: Json | null
          step_type?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          order_index?: number
          position_x?: number | null
          position_y?: number | null
          quiz_id?: string
          settings?: Json | null
          step_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_steps_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          allow_back_navigation: boolean | null
          background_color: string | null
          button_color: string | null
          created_at: string
          custom_domain: string | null
          custom_slug: string | null
          description: string | null
          domain_verified: boolean | null
          facebook_pixel: string | null
          font_family: string | null
          google_analytics: string | null
          id: string
          logo_url: string | null
          name: string
          primary_color: string | null
          show_logo: boolean | null
          show_progress_bar: boolean | null
          status: string
          text_color: string | null
          tiktok_pixel: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          allow_back_navigation?: boolean | null
          background_color?: string | null
          button_color?: string | null
          created_at?: string
          custom_domain?: string | null
          custom_slug?: string | null
          description?: string | null
          domain_verified?: boolean | null
          facebook_pixel?: string | null
          font_family?: string | null
          google_analytics?: string | null
          id?: string
          logo_url?: string | null
          name: string
          primary_color?: string | null
          show_logo?: boolean | null
          show_progress_bar?: boolean | null
          status?: string
          text_color?: string | null
          tiktok_pixel?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          allow_back_navigation?: boolean | null
          background_color?: string | null
          button_color?: string | null
          created_at?: string
          custom_domain?: string | null
          custom_slug?: string | null
          description?: string | null
          domain_verified?: boolean | null
          facebook_pixel?: string | null
          font_family?: string | null
          google_analytics?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          primary_color?: string | null
          show_logo?: boolean | null
          show_progress_bar?: boolean | null
          status?: string
          text_color?: string | null
          tiktok_pixel?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      recovery_campaigns: {
        Row: {
          created_at: string
          custom_email_subject: string | null
          custom_whatsapp_template: string | null
          id: string
          is_active: boolean
          message_intervals: Json
          seller_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          custom_email_subject?: string | null
          custom_whatsapp_template?: string | null
          id?: string
          is_active?: boolean
          message_intervals?: Json
          seller_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          custom_email_subject?: string | null
          custom_whatsapp_template?: string | null
          id?: string
          is_active?: boolean
          message_intervals?: Json
          seller_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      recovery_messages: {
        Row: {
          campaign_id: string
          channel: string
          created_at: string
          error_message: string | null
          id: string
          message_number: number
          new_charge_id: string | null
          original_charge_id: string
          seller_id: string
          sent_at: string | null
          status: string
        }
        Insert: {
          campaign_id: string
          channel?: string
          created_at?: string
          error_message?: string | null
          id?: string
          message_number?: number
          new_charge_id?: string | null
          original_charge_id: string
          seller_id: string
          sent_at?: string | null
          status?: string
        }
        Update: {
          campaign_id?: string
          channel?: string
          created_at?: string
          error_message?: string | null
          id?: string
          message_number?: number
          new_charge_id?: string | null
          original_charge_id?: string
          seller_id?: string
          sent_at?: string | null
          status?: string
        }
        Relationships: []
      }
      recovery_settings: {
        Row: {
          created_at: string
          id: string
          is_enabled: boolean
          max_messages_per_charge: number
          min_interval_minutes: number
          recovery_fee_percentage: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_enabled?: boolean
          max_messages_per_charge?: number
          min_interval_minutes?: number
          recovery_fee_percentage?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_enabled?: boolean
          max_messages_per_charge?: number
          min_interval_minutes?: number
          recovery_fee_percentage?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      seller_blocks: {
        Row: {
          blocked_at: string | null
          id: string
          invoice_id: string | null
          is_active: boolean | null
          reason: string
          unblocked_at: string | null
          user_id: string
        }
        Insert: {
          blocked_at?: string | null
          id?: string
          invoice_id?: string | null
          is_active?: boolean | null
          reason?: string
          unblocked_at?: string | null
          user_id: string
        }
        Update: {
          blocked_at?: string | null
          id?: string
          invoice_id?: string | null
          is_active?: boolean | null
          reason?: string
          unblocked_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "seller_blocks_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "platform_invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      seller_gateway_credentials: {
        Row: {
          created_at: string | null
          credentials: Json
          gateway_id: string
          id: string
          is_active: boolean | null
          is_default: boolean | null
          updated_at: string | null
          use_for_boleto: boolean | null
          use_for_card: boolean | null
          use_for_pix: boolean | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          credentials?: Json
          gateway_id: string
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          updated_at?: string | null
          use_for_boleto?: boolean | null
          use_for_card?: boolean | null
          use_for_pix?: boolean | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          credentials?: Json
          gateway_id?: string
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          updated_at?: string | null
          use_for_boleto?: boolean | null
          use_for_card?: boolean | null
          use_for_pix?: boolean | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "seller_gateway_credentials_gateway_id_fkey"
            columns: ["gateway_id"]
            isOneToOne: false
            referencedRelation: "payment_gateways"
            referencedColumns: ["id"]
          },
        ]
      }
      suggestions: {
        Row: {
          admin_notes: string | null
          created_at: string
          description: string
          id: string
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          description: string
          id?: string
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          description?: string
          id?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tenants: {
        Row: {
          accent_color: string | null
          admin_user_id: string
          brand_name: string
          created_at: string | null
          custom_domain: string | null
          domain_verified: boolean | null
          favicon_url: string | null
          id: string
          is_reseller: boolean | null
          logo_url: string | null
          max_products: number | null
          max_sellers: number | null
          primary_color: string | null
          privacy_url: string | null
          reseller_commission: number | null
          secondary_color: string | null
          status: string | null
          support_email: string | null
          support_phone: string | null
          terms_url: string | null
          trial_ends_at: string | null
          updated_at: string | null
          whatsapp_url: string | null
        }
        Insert: {
          accent_color?: string | null
          admin_user_id: string
          brand_name: string
          created_at?: string | null
          custom_domain?: string | null
          domain_verified?: boolean | null
          favicon_url?: string | null
          id?: string
          is_reseller?: boolean | null
          logo_url?: string | null
          max_products?: number | null
          max_sellers?: number | null
          primary_color?: string | null
          privacy_url?: string | null
          reseller_commission?: number | null
          secondary_color?: string | null
          status?: string | null
          support_email?: string | null
          support_phone?: string | null
          terms_url?: string | null
          trial_ends_at?: string | null
          updated_at?: string | null
          whatsapp_url?: string | null
        }
        Update: {
          accent_color?: string | null
          admin_user_id?: string
          brand_name?: string
          created_at?: string | null
          custom_domain?: string | null
          domain_verified?: boolean | null
          favicon_url?: string | null
          id?: string
          is_reseller?: boolean | null
          logo_url?: string | null
          max_products?: number | null
          max_sellers?: number | null
          primary_color?: string | null
          privacy_url?: string | null
          reseller_commission?: number | null
          secondary_color?: string | null
          status?: string | null
          support_email?: string | null
          support_phone?: string | null
          terms_url?: string | null
          trial_ends_at?: string | null
          updated_at?: string | null
          whatsapp_url?: string | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          affiliate_amount: number
          affiliate_id: string | null
          amount: number
          charge_id: string | null
          created_at: string
          fee_invoice_id: string | null
          fee_paid_at: string | null
          gateway_id: string | null
          gateway_transaction_id: string | null
          id: string
          is_recovered: boolean | null
          platform_fee: number
          product_id: string | null
          recovery_fee: number | null
          seller_amount: number
          seller_id: string | null
          status: Database["public"]["Enums"]["transaction_status"]
        }
        Insert: {
          affiliate_amount?: number
          affiliate_id?: string | null
          amount: number
          charge_id?: string | null
          created_at?: string
          fee_invoice_id?: string | null
          fee_paid_at?: string | null
          gateway_id?: string | null
          gateway_transaction_id?: string | null
          id?: string
          is_recovered?: boolean | null
          platform_fee?: number
          product_id?: string | null
          recovery_fee?: number | null
          seller_amount?: number
          seller_id?: string | null
          status?: Database["public"]["Enums"]["transaction_status"]
        }
        Update: {
          affiliate_amount?: number
          affiliate_id?: string | null
          amount?: number
          charge_id?: string | null
          created_at?: string
          fee_invoice_id?: string | null
          fee_paid_at?: string | null
          gateway_id?: string | null
          gateway_transaction_id?: string | null
          id?: string
          is_recovered?: boolean | null
          platform_fee?: number
          product_id?: string | null
          recovery_fee?: number | null
          seller_amount?: number
          seller_id?: string | null
          status?: Database["public"]["Enums"]["transaction_status"]
        }
        Relationships: [
          {
            foreignKeyName: "transactions_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_charge_id_fkey"
            columns: ["charge_id"]
            isOneToOne: false
            referencedRelation: "pix_charges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_fee_invoice_id_fkey"
            columns: ["fee_invoice_id"]
            isOneToOne: false
            referencedRelation: "platform_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_gateway_id_fkey"
            columns: ["gateway_id"]
            isOneToOne: false
            referencedRelation: "payment_gateways"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
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
      webhook_configs: {
        Row: {
          created_at: string | null
          events: string[] | null
          failure_count: number | null
          id: string
          is_active: boolean | null
          last_triggered_at: string | null
          secret: string
          url: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          events?: string[] | null
          failure_count?: number | null
          id?: string
          is_active?: boolean | null
          last_triggered_at?: string | null
          secret: string
          url: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          events?: string[] | null
          failure_count?: number | null
          id?: string
          is_active?: boolean | null
          last_triggered_at?: string | null
          secret?: string
          url?: string
          user_id?: string
        }
        Relationships: []
      }
      webhook_logs: {
        Row: {
          charge_id: string | null
          event_type: string
          id: string
          payload: Json | null
          response_body: string | null
          response_status: number | null
          sent_at: string
          webhook_id: string | null
        }
        Insert: {
          charge_id?: string | null
          event_type: string
          id?: string
          payload?: Json | null
          response_body?: string | null
          response_status?: number | null
          sent_at?: string
          webhook_id?: string | null
        }
        Update: {
          charge_id?: string | null
          event_type?: string
          id?: string
          payload?: Json | null
          response_body?: string | null
          response_status?: number | null
          sent_at?: string
          webhook_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "webhook_logs_charge_id_fkey"
            columns: ["charge_id"]
            isOneToOne: false
            referencedRelation: "pix_charges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "webhook_logs_webhook_id_fkey"
            columns: ["webhook_id"]
            isOneToOne: false
            referencedRelation: "webhooks"
            referencedColumns: ["id"]
          },
        ]
      }
      webhooks: {
        Row: {
          created_at: string
          events: string[]
          id: string
          secret: string | null
          status: string
          url: string
          user_id: string
        }
        Insert: {
          created_at?: string
          events?: string[]
          id?: string
          secret?: string | null
          status?: string
          url: string
          user_id: string
        }
        Update: {
          created_at?: string
          events?: string[]
          id?: string
          secret?: string | null
          status?: string
          url?: string
          user_id?: string
        }
        Relationships: []
      }
      whatsapp_broadcast_recipients: {
        Row: {
          broadcast_id: string
          created_at: string | null
          error_message: string | null
          id: string
          name: string | null
          phone: string
          sent_at: string | null
          status: string | null
          variation_used: number | null
        }
        Insert: {
          broadcast_id: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          name?: string | null
          phone: string
          sent_at?: string | null
          status?: string | null
          variation_used?: number | null
        }
        Update: {
          broadcast_id?: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          name?: string | null
          phone?: string
          sent_at?: string | null
          status?: string | null
          variation_used?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_broadcast_recipients_broadcast_id_fkey"
            columns: ["broadcast_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_broadcasts"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_broadcasts: {
        Row: {
          admin_id: string
          batch_pause_minutes: number | null
          batch_paused_at: string | null
          button_actions: Json | null
          button_type: string | null
          buttons_enabled: boolean | null
          completed_at: string | null
          created_at: string | null
          failed_count: number | null
          id: string
          interval_max_seconds: number | null
          interval_min_seconds: number | null
          interval_seconds: number | null
          last_processing_at: string | null
          media_type: string | null
          media_url: string | null
          message: string
          message_variations: string[] | null
          messages_per_batch: number | null
          messages_sent_in_batch: number | null
          name: string
          safe_mode: boolean | null
          scheduled_at: string | null
          sent_count: number | null
          started_at: string | null
          status: string | null
          total_recipients: number | null
        }
        Insert: {
          admin_id: string
          batch_pause_minutes?: number | null
          batch_paused_at?: string | null
          button_actions?: Json | null
          button_type?: string | null
          buttons_enabled?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          failed_count?: number | null
          id?: string
          interval_max_seconds?: number | null
          interval_min_seconds?: number | null
          interval_seconds?: number | null
          last_processing_at?: string | null
          media_type?: string | null
          media_url?: string | null
          message: string
          message_variations?: string[] | null
          messages_per_batch?: number | null
          messages_sent_in_batch?: number | null
          name: string
          safe_mode?: boolean | null
          scheduled_at?: string | null
          sent_count?: number | null
          started_at?: string | null
          status?: string | null
          total_recipients?: number | null
        }
        Update: {
          admin_id?: string
          batch_pause_minutes?: number | null
          batch_paused_at?: string | null
          button_actions?: Json | null
          button_type?: string | null
          buttons_enabled?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          failed_count?: number | null
          id?: string
          interval_max_seconds?: number | null
          interval_min_seconds?: number | null
          interval_seconds?: number | null
          last_processing_at?: string | null
          media_type?: string | null
          media_url?: string | null
          message?: string
          message_variations?: string[] | null
          messages_per_batch?: number | null
          messages_sent_in_batch?: number | null
          name?: string
          safe_mode?: boolean | null
          scheduled_at?: string | null
          sent_count?: number | null
          started_at?: string | null
          status?: string | null
          total_recipients?: number | null
        }
        Relationships: []
      }
      withdrawals: {
        Row: {
          amount: number
          completed_at: string | null
          fee: number
          id: string
          net_amount: number
          notes: string | null
          pix_key: string
          pix_key_type: string
          requested_at: string
          status: string
          user_id: string
        }
        Insert: {
          amount: number
          completed_at?: string | null
          fee?: number
          id?: string
          net_amount: number
          notes?: string | null
          pix_key: string
          pix_key_type?: string
          requested_at?: string
          status?: string
          user_id: string
        }
        Update: {
          amount?: number
          completed_at?: string | null
          fee?: number
          id?: string
          net_amount?: number
          notes?: string | null
          pix_key?: string
          pix_key_type?: string
          requested_at?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "seller" | "affiliate" | "member" | "super_admin"
      invoice_status: "pending" | "paid" | "overdue" | "blocked"
      transaction_status: "pending" | "paid" | "expired" | "cancelled"
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
      app_role: ["admin", "seller", "affiliate", "member", "super_admin"],
      invoice_status: ["pending", "paid", "overdue", "blocked"],
      transaction_status: ["pending", "paid", "expired", "cancelled"],
    },
  },
} as const
