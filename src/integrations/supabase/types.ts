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
      members: {
        Row: {
          access_level: string
          created_at: string
          expires_at: string | null
          id: string
          product_id: string
          transaction_id: string | null
          user_id: string
        }
        Insert: {
          access_level?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          product_id: string
          transaction_id?: string | null
          user_id: string
        }
        Update: {
          access_level?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          product_id?: string
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
      pix_charges: {
        Row: {
          affiliate_id: string | null
          amount: number
          buyer_cpf: string | null
          buyer_email: string
          buyer_name: string | null
          copy_paste: string | null
          created_at: string
          expires_at: string
          external_id: string
          id: string
          paid_at: string | null
          product_id: string | null
          qr_code: string | null
          qr_code_base64: string | null
          status: Database["public"]["Enums"]["transaction_status"]
        }
        Insert: {
          affiliate_id?: string | null
          amount: number
          buyer_cpf?: string | null
          buyer_email: string
          buyer_name?: string | null
          copy_paste?: string | null
          created_at?: string
          expires_at: string
          external_id: string
          id?: string
          paid_at?: string | null
          product_id?: string | null
          qr_code?: string | null
          qr_code_base64?: string | null
          status?: Database["public"]["Enums"]["transaction_status"]
        }
        Update: {
          affiliate_id?: string | null
          amount?: number
          buyer_cpf?: string | null
          buyer_email?: string
          buyer_name?: string | null
          copy_paste?: string | null
          created_at?: string
          expires_at?: string
          external_id?: string
          id?: string
          paid_at?: string | null
          product_id?: string | null
          qr_code?: string | null
          qr_code_base64?: string | null
          status?: Database["public"]["Enums"]["transaction_status"]
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
      platform_settings: {
        Row: {
          created_at: string
          default_checkout_template_id: string | null
          id: string
          maintenance_mode: boolean
          min_withdrawal: number
          pix_enabled: boolean
          platform_fee: number
          privacy_url: string | null
          support_email: string | null
          support_phone: string | null
          terms_url: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_checkout_template_id?: string | null
          id?: string
          maintenance_mode?: boolean
          min_withdrawal?: number
          pix_enabled?: boolean
          platform_fee?: number
          privacy_url?: string | null
          support_email?: string | null
          support_phone?: string | null
          terms_url?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_checkout_template_id?: string | null
          id?: string
          maintenance_mode?: boolean
          min_withdrawal?: number
          pix_enabled?: boolean
          platform_fee?: number
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
      products: {
        Row: {
          allow_affiliates: boolean
          checkout_template_id: string | null
          commission_rate: number
          content_url: string | null
          cover_url: string | null
          created_at: string
          deliverable_type: string | null
          deliverable_url: string | null
          description: string | null
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
          checkout_template_id?: string | null
          commission_rate?: number
          content_url?: string | null
          cover_url?: string | null
          created_at?: string
          deliverable_type?: string | null
          deliverable_url?: string | null
          description?: string | null
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
          checkout_template_id?: string | null
          commission_rate?: number
          content_url?: string | null
          cover_url?: string | null
          created_at?: string
          deliverable_type?: string | null
          deliverable_url?: string | null
          description?: string | null
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
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          pix_key: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          pix_key?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          pix_key?: string | null
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
          id: string
          platform_fee: number
          product_id: string | null
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
          id?: string
          platform_fee?: number
          product_id?: string | null
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
          id?: string
          platform_fee?: number
          product_id?: string | null
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
      transaction_status: ["pending", "paid", "expired", "cancelled"],
    },
  },
} as const
