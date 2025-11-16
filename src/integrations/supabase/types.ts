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
      academic_results: {
        Row: {
          approved_by: string | null
          created_at: string
          grade: string | null
          id: string
          marks: number
          remarks: string | null
          student_id: string
          subject: string
          teacher_id: string | null
          term: string
          updated_at: string
          year: number
        }
        Insert: {
          approved_by?: string | null
          created_at?: string
          grade?: string | null
          id?: string
          marks: number
          remarks?: string | null
          student_id: string
          subject: string
          teacher_id?: string | null
          term: string
          updated_at?: string
          year: number
        }
        Update: {
          approved_by?: string | null
          created_at?: string
          grade?: string | null
          id?: string
          marks?: number
          remarks?: string | null
          student_id?: string
          subject?: string
          teacher_id?: string | null
          term?: string
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "academic_results_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students_data"
            referencedColumns: ["id"]
          },
        ]
      }
      announcements: {
        Row: {
          approved: boolean | null
          content: string
          created_at: string
          created_by: string | null
          id: string
          target_audience: string
          title: string
          updated_at: string
        }
        Insert: {
          approved?: boolean | null
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          target_audience: string
          title: string
          updated_at?: string
        }
        Update: {
          approved?: boolean | null
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          target_audience?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action_by: string | null
          action_type: string
          created_at: string | null
          details: string | null
          id: string
          target_user: string | null
        }
        Insert: {
          action_by?: string | null
          action_type: string
          created_at?: string | null
          details?: string | null
          id?: string
          target_user?: string | null
        }
        Update: {
          action_by?: string | null
          action_type?: string
          created_at?: string | null
          details?: string | null
          id?: string
          target_user?: string | null
        }
        Relationships: []
      }
      community_testimonials: {
        Row: {
          created_at: string | null
          display_order: number | null
          id: string
          name: string
          rating: number | null
          review: string
          role: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          name: string
          rating?: number | null
          review: string
          role: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          name?: string
          rating?: number | null
          review?: string
          role?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      contact_info: {
        Row: {
          address: string
          email: string
          id: string
          office_hours: string | null
          phone: string
          social_media: Json | null
          updated_at: string | null
        }
        Insert: {
          address: string
          email: string
          id?: string
          office_hours?: string | null
          phone: string
          social_media?: Json | null
          updated_at?: string | null
        }
        Update: {
          address?: string
          email?: string
          id?: string
          office_hours?: string | null
          phone?: string
          social_media?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      duty_rosters: {
        Row: {
          created_at: string | null
          created_by: string | null
          end_date: string
          id: string
          month: string
          quote: string
          quote_author: string
          start_date: string
          teachers_on_duty: Json
          term: string
          updated_at: string | null
          week_number: number
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          end_date: string
          id?: string
          month: string
          quote: string
          quote_author: string
          start_date: string
          teachers_on_duty?: Json
          term: string
          updated_at?: string | null
          week_number: number
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          end_date?: string
          id?: string
          month?: string
          quote?: string
          quote_author?: string
          start_date?: string
          teachers_on_duty?: Json
          term?: string
          updated_at?: string | null
          week_number?: number
        }
        Relationships: []
      }
      events: {
        Row: {
          approved: boolean | null
          created_at: string
          created_by: string | null
          description: string | null
          display_order: number | null
          event_date: string
          event_type: string
          id: string
          location: string | null
          status: string | null
          title: string
          updated_at: string
        }
        Insert: {
          approved?: boolean | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          display_order?: number | null
          event_date: string
          event_type: string
          id?: string
          location?: string | null
          status?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          approved?: boolean | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          display_order?: number | null
          event_date?: string
          event_type?: string
          id?: string
          location?: string | null
          status?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      fee_payments: {
        Row: {
          amount_due: number
          amount_paid: number
          balance: number | null
          created_at: string
          id: string
          payment_date: string | null
          receipt_number: string | null
          recorded_by: string | null
          student_id: string
          term: string
          updated_at: string
          year: number
        }
        Insert: {
          amount_due: number
          amount_paid?: number
          balance?: number | null
          created_at?: string
          id?: string
          payment_date?: string | null
          receipt_number?: string | null
          recorded_by?: string | null
          student_id: string
          term: string
          updated_at?: string
          year: number
        }
        Update: {
          amount_due?: number
          amount_paid?: number
          balance?: number | null
          created_at?: string
          id?: string
          payment_date?: string | null
          receipt_number?: string | null
          recorded_by?: string | null
          student_id?: string
          term?: string
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "fee_payments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students_data"
            referencedColumns: ["id"]
          },
        ]
      }
      gallery_media: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          file_url: string
          id: string
          media_type: string
          thumbnail_url: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          file_url: string
          id?: string
          media_type: string
          thumbnail_url?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          file_url?: string
          id?: string
          media_type?: string
          thumbnail_url?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      magic_link_tokens: {
        Row: {
          created_at: string | null
          email: string
          expires_at: string
          id: string
          token_hash: string
          used: boolean | null
        }
        Insert: {
          created_at?: string | null
          email: string
          expires_at: string
          id?: string
          token_hash: string
          used?: boolean | null
        }
        Update: {
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          token_hash?: string
          used?: boolean | null
        }
        Relationships: []
      }
      otp_codes: {
        Row: {
          attempts: number | null
          created_at: string | null
          email: string
          expires_at: string
          id: string
          otp: string
          verified: boolean | null
        }
        Insert: {
          attempts?: number | null
          created_at?: string | null
          email: string
          expires_at: string
          id?: string
          otp: string
          verified?: boolean | null
        }
        Update: {
          attempts?: number | null
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          otp?: string
          verified?: boolean | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          approval_status: string | null
          approved_at: string | null
          approved_by: string | null
          created_at: string
          full_name: string
          id: string
          id_number: string | null
          phone_number: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          full_name: string
          id: string
          id_number?: string | null
          phone_number?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          full_name?: string
          id?: string
          id_number?: string | null
          phone_number?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      staff_registry: {
        Row: {
          created_at: string | null
          created_by: string | null
          email: string
          full_name: string
          id: string
          id_number: string
          phone: string
          role: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          email: string
          full_name: string
          id?: string
          id_number: string
          phone: string
          role: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          email?: string
          full_name?: string
          id?: string
          id_number?: string
          phone?: string
          role?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      students_data: {
        Row: {
          admission_number: string
          class: string
          created_at: string
          email: string | null
          full_name: string
          id: string
          is_registered: boolean | null
          parent_name: string
          parent_phone: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          admission_number: string
          class: string
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          is_registered?: boolean | null
          parent_name: string
          parent_phone: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          admission_number?: string
          class?: string
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          is_registered?: boolean | null
          parent_name?: string
          parent_phone?: string
          updated_at?: string
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
      cleanup_expired_magic_links: { Args: never; Returns: undefined }
      count_super_admins: { Args: never; Returns: number }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_super_admin: { Args: { user_id: string }; Returns: boolean }
      log_admin_action: {
        Args: {
          p_action_type: string
          p_details?: string
          p_target_user: string
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role:
        | "super_admin"
        | "teacher"
        | "hod"
        | "bursar"
        | "chaplain"
        | "student_leader"
        | "class_rep"
        | "student"
        | "admin"
        | "parent"
        | "librarian"
        | "classteacher"
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
      app_role: [
        "super_admin",
        "teacher",
        "hod",
        "bursar",
        "chaplain",
        "student_leader",
        "class_rep",
        "student",
        "admin",
        "parent",
        "librarian",
        "classteacher",
      ],
    },
  },
} as const
