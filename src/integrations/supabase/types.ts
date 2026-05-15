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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admin_audit_logs: {
        Row: {
          action: string | null
          admin_id: string | null
          created_at: string
          id: string
          new_values: Json | null
          old_values: Json | null
          table_name: string | null
        }
        Insert: {
          action?: string | null
          admin_id?: string | null
          created_at?: string
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          table_name?: string | null
        }
        Update: {
          action?: string | null
          admin_id?: string | null
          created_at?: string
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          table_name?: string | null
        }
        Relationships: []
      }
      assessoria_pricing_rules: {
        Row: {
          base_price: number
          created_at: string
          id: string
          label: string
          max_revenue: number | null
          min_revenue: number
          sort_order: number
        }
        Insert: {
          base_price: number
          created_at?: string
          id?: string
          label: string
          max_revenue?: number | null
          min_revenue: number
          sort_order: number
        }
        Update: {
          base_price?: number
          created_at?: string
          id?: string
          label?: string
          max_revenue?: number | null
          min_revenue?: number
          sort_order?: number
        }
        Relationships: []
      }
      assessoria_settings: {
        Row: {
          cnpj_adjustment: number
          created_at: string
          id: string
          max_price: number
          min_price: number
        }
        Insert: {
          cnpj_adjustment?: number
          created_at?: string
          id?: string
          max_price?: number
          min_price?: number
        }
        Update: {
          cnpj_adjustment?: number
          created_at?: string
          id?: string
          max_price?: number
          min_price?: number
        }
        Relationships: []
      }
      bpo_packages: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          id: string
          name: string
          price_tier_1: number
          price_tier_2: number
          price_tier_3: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          name: string
          price_tier_1: number
          price_tier_2: number
          price_tier_3: number
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          name?: string
          price_tier_1?: number
          price_tier_2?: number
          price_tier_3?: number
        }
        Relationships: []
      }
      bpo_settings: {
        Row: {
          created_at: string
          id: string
          key: string
          value: Json
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          value: Json
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          value?: Json
        }
        Relationships: []
      }
      bpo_setup_module: {
        Row: {
          add_to_monthly: boolean
          created_at: string
          id: string
          installment_value: number
          installments: number
          is_active: boolean
          is_mandatory: boolean
          name: string
        }
        Insert: {
          add_to_monthly?: boolean
          created_at?: string
          id?: string
          installment_value: number
          installments: number
          is_active?: boolean
          is_mandatory?: boolean
          name: string
        }
        Update: {
          add_to_monthly?: boolean
          created_at?: string
          id?: string
          installment_value?: number
          installments?: number
          is_active?: boolean
          is_mandatory?: boolean
          name?: string
        }
        Relationships: []
      }
      cfo_base_rules: {
        Row: {
          base_price: number
          created_at: string
          id: string
          label: string
          max_revenue: number | null
          min_revenue: number
          sort_order: number
        }
        Insert: {
          base_price: number
          created_at?: string
          id?: string
          label: string
          max_revenue?: number | null
          min_revenue: number
          sort_order: number
        }
        Update: {
          base_price?: number
          created_at?: string
          id?: string
          label?: string
          max_revenue?: number | null
          min_revenue?: number
          sort_order?: number
        }
        Relationships: []
      }
      cfo_cnpj_rules: {
        Row: {
          cnpj_count: number
          created_at: string
          id: string
          multiplier: number
        }
        Insert: {
          cnpj_count: number
          created_at?: string
          id?: string
          multiplier: number
        }
        Update: {
          cnpj_count?: number
          created_at?: string
          id?: string
          multiplier?: number
        }
        Relationships: []
      }
      cfo_complexity_rules: {
        Row: {
          created_at: string
          factor: number
          id: string
          level: string
          max_score: number
          min_score: number
        }
        Insert: {
          created_at?: string
          factor: number
          id?: string
          level: string
          max_score: number
          min_score: number
        }
        Update: {
          created_at?: string
          factor?: number
          id?: string
          level?: string
          max_score?: number
          min_score?: number
        }
        Relationships: []
      }
      cfo_governance_rules: {
        Row: {
          created_at: string
          fee: number
          governance_type: string
          id: string
        }
        Insert: {
          created_at?: string
          fee: number
          governance_type: string
          id?: string
        }
        Update: {
          created_at?: string
          fee?: number
          governance_type?: string
          id?: string
        }
        Relationships: []
      }
      cfo_segment_rules: {
        Row: {
          adjustment: number
          created_at: string
          id: string
          segment_type: string
        }
        Insert: {
          adjustment: number
          created_at?: string
          id?: string
          segment_type: string
        }
        Update: {
          adjustment?: number
          created_at?: string
          id?: string
          segment_type?: string
        }
        Relationships: []
      }
      cost_parameters: {
        Row: {
          created_at: string
          dimension: string
          id: string
          label: string
          pct_max: number | null
          pct_min: number | null
          qualitative: boolean
          question_key: string
          trigger_color: string
        }
        Insert: {
          created_at?: string
          dimension: string
          id?: string
          label: string
          pct_max?: number | null
          pct_min?: number | null
          qualitative?: boolean
          question_key: string
          trigger_color: string
        }
        Update: {
          created_at?: string
          dimension?: string
          id?: string
          label?: string
          pct_max?: number | null
          pct_min?: number | null
          qualitative?: boolean
          question_key?: string
          trigger_color?: string
        }
        Relationships: []
      }
      diagnostic_questions: {
        Row: {
          created_at: string
          dimension: string
          global_order: number
          id: string
          option_green: string
          option_red: string
          option_yellow: string
          question_key: string
          question_text: string
        }
        Insert: {
          created_at?: string
          dimension: string
          global_order: number
          id?: string
          option_green: string
          option_red: string
          option_yellow: string
          question_key: string
          question_text: string
        }
        Update: {
          created_at?: string
          dimension?: string
          global_order?: number
          id?: string
          option_green?: string
          option_red?: string
          option_yellow?: string
          question_key?: string
          question_text?: string
        }
        Relationships: []
      }
      maturity_levels: {
        Row: {
          color: string
          created_at: string
          description: string
          id: string
          label: string
          level_key: string
          score_max: number
          score_min: number
          sort_order: number
        }
        Insert: {
          color: string
          created_at?: string
          description: string
          id?: string
          label: string
          level_key: string
          score_max: number
          score_min: number
          sort_order: number
        }
        Update: {
          color?: string
          created_at?: string
          description?: string
          id?: string
          label?: string
          level_key?: string
          score_max?: number
          score_min?: number
          sort_order?: number
        }
        Relationships: []
      }
      outcome_texts: {
        Row: {
          check_red: boolean
          created_at: string
          current_text: string
          dimension: string
          future_text: string
          id: string
          question_key: string
        }
        Insert: {
          check_red?: boolean
          created_at?: string
          current_text: string
          dimension: string
          future_text: string
          id?: string
          question_key: string
        }
        Update: {
          check_red?: boolean
          created_at?: string
          current_text?: string
          dimension?: string
          future_text?: string
          id?: string
          question_key?: string
        }
        Relationships: []
      }
      product_recommendations: {
        Row: {
          created_at: string
          id: string
          name: string
          price: number | null
          rule_key: string
          score_max: number
          score_min: number
          tagline: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          price?: number | null
          rule_key: string
          score_max: number
          score_min: number
          tagline: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          price?: number | null
          rule_key?: string
          score_max?: number
          score_min?: number
          tagline?: string
        }
        Relationships: []
      }
      setup_pricing_rules: {
        Row: {
          created_at: string
          id: string
          label: string
          max_revenue: number | null
          min_revenue: number
          price_complex: number
          price_standard: number
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          label: string
          max_revenue?: number | null
          min_revenue: number
          price_complex: number
          price_standard: number
          sort_order: number
        }
        Update: {
          created_at?: string
          id?: string
          label?: string
          max_revenue?: number | null
          min_revenue?: number
          price_complex?: number
          price_standard?: number
          sort_order?: number
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      assign_role_on_signup: { Args: never; Returns: string }
      has_admin_role: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
