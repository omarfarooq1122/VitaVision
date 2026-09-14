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
      allergies: {
        Row: {
          created_at: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      detected_foods: {
        Row: {
          analysis_id: string
          bounding_box: Json | null
          calories: number
          carbs: number
          confidence: number
          corrected: boolean
          created_at: string
          est_weight_g: number
          fat: number
          fiber: number
          food_name: string
          id: string
          protein: number
          quantity: number
          sugar: number
          user_id: string
        }
        Insert: {
          analysis_id: string
          bounding_box?: Json | null
          calories?: number
          carbs?: number
          confidence?: number
          corrected?: boolean
          created_at?: string
          est_weight_g?: number
          fat?: number
          fiber?: number
          food_name: string
          id?: string
          protein?: number
          quantity?: number
          sugar?: number
          user_id: string
        }
        Update: {
          analysis_id?: string
          bounding_box?: Json | null
          calories?: number
          carbs?: number
          confidence?: number
          corrected?: boolean
          created_at?: string
          est_weight_g?: number
          fat?: number
          fiber?: number
          food_name?: string
          id?: string
          protein?: number
          quantity?: number
          sugar?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "detected_foods_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "food_analyses"
            referencedColumns: ["id"]
          },
        ]
      }
      diet_recommendations: {
        Row: {
          calories: number
          created_at: string
          day: string
          id: string
          items: string[]
          meal: string
          protein: number
          rationale: string
          title: string
          user_id: string
        }
        Insert: {
          calories?: number
          created_at?: string
          day?: string
          id?: string
          items?: string[]
          meal: string
          protein?: number
          rationale?: string
          title: string
          user_id: string
        }
        Update: {
          calories?: number
          created_at?: string
          day?: string
          id?: string
          items?: string[]
          meal?: string
          protein?: number
          rationale?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      food_analyses: {
        Row: {
          allergy_warnings: Json
          calories: number
          carbs: number
          created_at: string
          fat: number
          fiber: number
          id: string
          image_path: string | null
          logged: boolean
          meal_type: string
          mode: string
          protein: number
          sugar: number
          total_weight_g: number
          updated_at: string
          user_id: string
        }
        Insert: {
          allergy_warnings?: Json
          calories?: number
          carbs?: number
          created_at?: string
          fat?: number
          fiber?: number
          id?: string
          image_path?: string | null
          logged?: boolean
          meal_type?: string
          mode?: string
          protein?: number
          sugar?: number
          total_weight_g?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          allergy_warnings?: Json
          calories?: number
          carbs?: number
          created_at?: string
          fat?: number
          fiber?: number
          id?: string
          image_path?: string | null
          logged?: boolean
          meal_type?: string
          mode?: string
          protein?: number
          sugar?: number
          total_weight_g?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      foods: {
        Row: {
          allergens: string[]
          avg_item_weight_g: number
          calories_100g: number
          carbs_100g: number
          category: string
          created_at: string
          diet_tags: string[]
          fat_100g: number
          fiber_100g: number
          id: string
          name: string
          protein_100g: number
          serving_label: string
          source: string
          sugar_100g: number
        }
        Insert: {
          allergens?: string[]
          avg_item_weight_g?: number
          calories_100g: number
          carbs_100g?: number
          category?: string
          created_at?: string
          diet_tags?: string[]
          fat_100g?: number
          fiber_100g?: number
          id?: string
          name: string
          protein_100g?: number
          serving_label?: string
          source?: string
          sugar_100g?: number
        }
        Update: {
          allergens?: string[]
          avg_item_weight_g?: number
          calories_100g?: number
          carbs_100g?: number
          category?: string
          created_at?: string
          diet_tags?: string[]
          fat_100g?: number
          fiber_100g?: number
          id?: string
          name?: string
          protein_100g?: number
          serving_label?: string
          source?: string
          sugar_100g?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          activity_level: string
          age: number | null
          avoids: string[]
          calorie_target: number
          carb_target: number
          created_at: string
          diet_preference: string
          dislikes: string[]
          fat_target: number
          fiber_target: number
          gender: string | null
          goal: string
          height_cm: number | null
          id: string
          likes: string[]
          meal_frequency: number
          name: string
          onboarded: boolean
          protein_target: number
          updated_at: string
          water_target_l: number
          weight_kg: number | null
        }
        Insert: {
          activity_level?: string
          age?: number | null
          avoids?: string[]
          calorie_target?: number
          carb_target?: number
          created_at?: string
          diet_preference?: string
          dislikes?: string[]
          fat_target?: number
          fiber_target?: number
          gender?: string | null
          goal?: string
          height_cm?: number | null
          id: string
          likes?: string[]
          meal_frequency?: number
          name?: string
          onboarded?: boolean
          protein_target?: number
          updated_at?: string
          water_target_l?: number
          weight_kg?: number | null
        }
        Update: {
          activity_level?: string
          age?: number | null
          avoids?: string[]
          calorie_target?: number
          carb_target?: number
          created_at?: string
          diet_preference?: string
          dislikes?: string[]
          fat_target?: number
          fiber_target?: number
          gender?: string | null
          goal?: string
          height_cm?: number | null
          id?: string
          likes?: string[]
          meal_frequency?: number
          name?: string
          onboarded?: boolean
          protein_target?: number
          updated_at?: string
          water_target_l?: number
          weight_kg?: number | null
        }
        Relationships: []
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
    Enums: {},
  },
} as const
