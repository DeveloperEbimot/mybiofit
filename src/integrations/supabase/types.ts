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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      bmi_records: {
        Row: {
          bmi: number
          category: string
          height: number
          id: string
          recorded_at: string
          user_id: string
          weight: number
        }
        Insert: {
          bmi: number
          category: string
          height: number
          id?: string
          recorded_at?: string
          user_id: string
          weight: number
        }
        Update: {
          bmi?: number
          category?: string
          height?: number
          id?: string
          recorded_at?: string
          user_id?: string
          weight?: number
        }
        Relationships: []
      }
      daily_tasks: {
        Row: {
          completed: boolean
          created_at: string
          id: string
          task_date: string
          task_type: string
          title: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          id?: string
          task_date?: string
          task_type?: string
          title: string
          user_id: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          id?: string
          task_date?: string
          task_type?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      fitness_plans: {
        Row: {
          content: string
          created_at: string
          id: string
          plan_type: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          plan_type: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          plan_type?: string
          user_id?: string
        }
        Relationships: []
      }
      grocery_items: {
        Row: {
          category: string | null
          checked: boolean | null
          created_at: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          category?: string | null
          checked?: boolean | null
          created_at?: string
          id?: string
          name: string
          user_id: string
        }
        Update: {
          category?: string | null
          checked?: boolean | null
          created_at?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      nutrition_logs: {
        Row: {
          calories: number
          carbs: number
          created_at: string
          fat: number
          fiber: number
          id: string
          logged_at: string
          meal_name: string
          protein: number
          user_id: string
        }
        Insert: {
          calories?: number
          carbs?: number
          created_at?: string
          fat?: number
          fiber?: number
          id?: string
          logged_at?: string
          meal_name: string
          protein?: number
          user_id: string
        }
        Update: {
          calories?: number
          carbs?: number
          created_at?: string
          fat?: number
          fiber?: number
          id?: string
          logged_at?: string
          meal_name?: string
          protein?: number
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          activity_level: string | null
          age: number | null
          avatar: string | null
          created_at: string
          diet_goal: string | null
          gender: string | null
          height: number | null
          id: string
          language: string | null
          name: string | null
          restrictions: string[] | null
          updated_at: string
          user_id: string
          weight: number | null
        }
        Insert: {
          activity_level?: string | null
          age?: number | null
          avatar?: string | null
          created_at?: string
          diet_goal?: string | null
          gender?: string | null
          height?: number | null
          id?: string
          language?: string | null
          name?: string | null
          restrictions?: string[] | null
          updated_at?: string
          user_id: string
          weight?: number | null
        }
        Update: {
          activity_level?: string | null
          age?: number | null
          avatar?: string | null
          created_at?: string
          diet_goal?: string | null
          gender?: string | null
          height?: number | null
          id?: string
          language?: string | null
          name?: string | null
          restrictions?: string[] | null
          updated_at?: string
          user_id?: string
          weight?: number | null
        }
        Relationships: []
      }
      pwa_installs: {
        Row: {
          id: string
          installed_at: string
          platform: string | null
          user_agent: string | null
        }
        Insert: {
          id?: string
          installed_at?: string
          platform?: string | null
          user_agent?: string | null
        }
        Update: {
          id?: string
          installed_at?: string
          platform?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      ratings: {
        Row: {
          created_at: string | null
          id: string
          rating: number
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          rating: number
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          rating?: number
          user_id?: string | null
        }
        Relationships: []
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
