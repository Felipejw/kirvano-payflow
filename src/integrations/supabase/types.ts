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
      affiliates: {
        Row: {
          affiliate_code: string
          commission_rate: number | null
          created_at: string
          id: string
          product_id: string
          status: string
          total_earnings: number
          total_sales: number
          user_id: string
        }
        Insert: {
          affiliate_code: string
          commission_rate?: number | null
          created_at?: string
          id?: string
          product_id: string
          status?: string
          total_earnings?: number
          total_sales?: number
          user_id: string
        }
        Update: {
          affiliate_code?: string
          commission_rate?: number | null
          created_at?: string
          id?: string
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
          rate_limit?: number
          status?: string
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
          terms_accepted_at?: string | null
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
      app_role: "admin" | "seller" | "affiliate" | "member"
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
      app_role: ["admin", "seller", "affiliate", "member"],
      invoice_status: ["pending", "paid", "overdue", "blocked"],
      transaction_status: ["pending", "paid", "expired", "cancelled"],
    },
  },
} as const
