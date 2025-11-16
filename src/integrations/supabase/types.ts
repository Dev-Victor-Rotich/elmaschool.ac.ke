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
      academic_excellence: {
        Row: {
          course_pursued: string
          created_at: string | null
          display_order: number | null
          id: string
          image_url: string | null
          mean_grade: string
          student_name: string
          university: string | null
          updated_at: string | null
          year: number
        }
        Insert: {
          course_pursued: string
          created_at?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          mean_grade: string
          student_name: string
          university?: string | null
          updated_at?: string | null
          year: number
        }
        Update: {
          course_pursued?: string
          created_at?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          mean_grade?: string
          student_name?: string
          university?: string | null
          updated_at?: string | null
          year?: number
        }
        Relationships: []
      }
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
      active_students: {
        Row: {
          achievement: string | null
          club_or_activity: string
          created_at: string | null
          display_order: number | null
          id: string
          image_url: string | null
          name: string
          updated_at: string | null
        }
        Insert: {
          achievement?: string | null
          club_or_activity: string
          created_at?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          name: string
          updated_at?: string | null
        }
        Update: {
          achievement?: string | null
          club_or_activity?: string
          created_at?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      admission_letters: {
        Row: {
          admission_number: string
          created_at: string | null
          curriculum: string | null
          form_grade: string
          gender: string | null
          id: string
          letter_url: string
          status: string | null
          student_name: string
          updated_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          admission_number: string
          created_at?: string | null
          curriculum?: string | null
          form_grade: string
          gender?: string | null
          id?: string
          letter_url: string
          status?: string | null
          student_name: string
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          admission_number?: string
          created_at?: string | null
          curriculum?: string | null
          form_grade?: string
          gender?: string | null
          id?: string
          letter_url?: string
          status?: string | null
          student_name?: string
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: []
      }
      admission_requests: {
        Row: {
          admission_number: string | null
          created_at: string | null
          email: string
          form_grade: string
          id: string
          parent_name: string
          phone: string
          status: string | null
          student_name: string
          updated_at: string | null
        }
        Insert: {
          admission_number?: string | null
          created_at?: string | null
          email: string
          form_grade: string
          id?: string
          parent_name: string
          phone: string
          status?: string | null
          student_name: string
          updated_at?: string | null
        }
        Update: {
          admission_number?: string | null
          created_at?: string | null
          email?: string
          form_grade?: string
          id?: string
          parent_name?: string
          phone?: string
          status?: string | null
          student_name?: string
          updated_at?: string | null
        }
        Relationships: []
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
      beyond_classroom: {
        Row: {
          created_at: string | null
          description: string
          display_order: number | null
          id: string
          image_url: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description: string
          display_order?: number | null
          id?: string
          image_url?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string
          display_order?: number | null
          id?: string
          image_url?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      cbc_partnership_images: {
        Row: {
          caption: string | null
          created_at: string | null
          display_order: number | null
          id: string
          image_url: string
          updated_at: string | null
        }
        Insert: {
          caption?: string | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          image_url: string
          updated_at?: string | null
        }
        Update: {
          caption?: string | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          image_url?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      clubs_societies: {
        Row: {
          created_at: string | null
          description: string
          display_order: number | null
          id: string
          image_url: string | null
          member_count: number | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description: string
          display_order?: number | null
          id?: string
          image_url?: string | null
          member_count?: number | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string
          display_order?: number | null
          id?: string
          image_url?: string | null
          member_count?: number | null
          name?: string
          updated_at?: string | null
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
      cta_banner: {
        Row: {
          badge_text: string | null
          cta1_link: string | null
          cta1_text: string | null
          cta2_link: string | null
          cta2_text: string | null
          description: string
          feature1_text: string | null
          feature2_text: string | null
          feature3_text: string | null
          heading: string
          id: string
          updated_at: string | null
        }
        Insert: {
          badge_text?: string | null
          cta1_link?: string | null
          cta1_text?: string | null
          cta2_link?: string | null
          cta2_text?: string | null
          description?: string
          feature1_text?: string | null
          feature2_text?: string | null
          feature3_text?: string | null
          heading?: string
          id?: string
          updated_at?: string | null
        }
        Update: {
          badge_text?: string | null
          cta1_link?: string | null
          cta1_text?: string | null
          cta2_link?: string | null
          cta2_text?: string | null
          description?: string
          feature1_text?: string | null
          feature2_text?: string | null
          feature3_text?: string | null
          heading?: string
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      department_staff: {
        Row: {
          bio: string | null
          created_at: string | null
          department_id: string | null
          display_order: number | null
          id: string
          image_url: string | null
          name: string
          position: string
          updated_at: string | null
        }
        Insert: {
          bio?: string | null
          created_at?: string | null
          department_id?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          name: string
          position: string
          updated_at?: string | null
        }
        Update: {
          bio?: string | null
          created_at?: string | null
          department_id?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          name?: string
          position?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "department_staff_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          created_at: string | null
          description: string
          display_order: number | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description: string
          display_order?: number | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string
          display_order?: number | null
          id?: string
          name?: string
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
          welfare_message: string | null
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
          welfare_message?: string | null
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
          welfare_message?: string | null
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
      facilities: {
        Row: {
          created_at: string | null
          description: string
          display_order: number | null
          id: string
          image_url: string
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description: string
          display_order?: number | null
          id?: string
          image_url: string
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string
          display_order?: number | null
          id?: string
          image_url?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      faqs: {
        Row: {
          answer: string
          created_at: string | null
          display_order: number | null
          id: string
          question: string
          updated_at: string | null
        }
        Insert: {
          answer: string
          created_at?: string | null
          display_order?: number | null
          id?: string
          question: string
          updated_at?: string | null
        }
        Update: {
          answer?: string
          created_at?: string | null
          display_order?: number | null
          id?: string
          question?: string
          updated_at?: string | null
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
      hero_content: {
        Row: {
          badge1_text: string | null
          badge2_text: string | null
          badge3_text: string | null
          cta1_link: string | null
          cta1_text: string | null
          cta2_link: string | null
          cta2_text: string | null
          description: string
          enrollment_badge_text: string | null
          heading_line1: string
          heading_line2: string
          id: string
          image_url: string
          updated_at: string | null
        }
        Insert: {
          badge1_text?: string | null
          badge2_text?: string | null
          badge3_text?: string | null
          cta1_link?: string | null
          cta1_text?: string | null
          cta2_link?: string | null
          cta2_text?: string | null
          description?: string
          enrollment_badge_text?: string | null
          heading_line1?: string
          heading_line2?: string
          id?: string
          image_url: string
          updated_at?: string | null
        }
        Update: {
          badge1_text?: string | null
          badge2_text?: string | null
          badge3_text?: string | null
          cta1_link?: string | null
          cta1_text?: string | null
          cta2_link?: string | null
          cta2_text?: string | null
          description?: string
          enrollment_badge_text?: string | null
          heading_line1?: string
          heading_line2?: string
          id?: string
          image_url?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      home_features: {
        Row: {
          created_at: string | null
          description: string
          display_order: number | null
          icon_name: string
          id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description: string
          display_order?: number | null
          icon_name: string
          id?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string
          display_order?: number | null
          icon_name?: string
          id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      leadership_programs: {
        Row: {
          created_at: string | null
          description: string
          display_order: number | null
          id: string
          image_url: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description: string
          display_order?: number | null
          id?: string
          image_url?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string
          display_order?: number | null
          id?: string
          image_url?: string | null
          title?: string
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
      notable_alumni: {
        Row: {
          achievement: string
          class_year: number
          created_at: string | null
          current_position: string
          display_order: number | null
          full_name: string
          id: string
          image_url: string | null
          updated_at: string | null
        }
        Insert: {
          achievement: string
          class_year: number
          created_at?: string | null
          current_position: string
          display_order?: number | null
          full_name: string
          id?: string
          image_url?: string | null
          updated_at?: string | null
        }
        Update: {
          achievement?: string
          class_year?: number
          created_at?: string | null
          current_position?: string
          display_order?: number | null
          full_name?: string
          id?: string
          image_url?: string | null
          updated_at?: string | null
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
      parent_testimonials: {
        Row: {
          class_representative: string
          created_at: string | null
          display_order: number | null
          id: string
          message: string
          parent_name: string
          stars: number | null
          updated_at: string | null
        }
        Insert: {
          class_representative: string
          created_at?: string | null
          display_order?: number | null
          id?: string
          message: string
          parent_name: string
          stars?: number | null
          updated_at?: string | null
        }
        Update: {
          class_representative?: string
          created_at?: string | null
          display_order?: number | null
          id?: string
          message?: string
          parent_name?: string
          stars?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      previous_leaders: {
        Row: {
          achievement: string
          created_at: string | null
          display_order: number | null
          id: string
          image_url: string | null
          name: string
          role: string
          updated_at: string | null
          year: number
        }
        Insert: {
          achievement: string
          created_at?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          name: string
          role: string
          updated_at?: string | null
          year: number
        }
        Update: {
          achievement?: string
          created_at?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          name?: string
          role?: string
          updated_at?: string | null
          year?: number
        }
        Relationships: []
      }
      principal_message: {
        Row: {
          id: string
          image_url: string
          message: string
          name: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          image_url: string
          message: string
          name: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          image_url?: string
          message?: string
          name?: string
          updated_at?: string | null
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
      program_members: {
        Row: {
          created_at: string | null
          display_order: number | null
          id: string
          image_url: string | null
          message: string | null
          name: string
          program_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          message?: string | null
          name: string
          program_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          message?: string | null
          name?: string
          program_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "program_members_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "leadership_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      required_documents: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          document_name: string
          id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          document_name: string
          id?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          document_name?: string
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      school_occasions: {
        Row: {
          created_at: string | null
          display_order: number | null
          end_date: string
          id: string
          message: string
          name: string
          start_date: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          end_date: string
          id?: string
          message: string
          name: string
          start_date: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          end_date?: string
          id?: string
          message?: string
          name?: string
          start_date?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      site_stats: {
        Row: {
          created_at: string | null
          display_order: number | null
          icon_name: string
          id: string
          label: string
          suffix: string
          updated_at: string | null
          value: number
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          icon_name: string
          id?: string
          label: string
          suffix?: string
          updated_at?: string | null
          value: number
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          icon_name?: string
          id?: string
          label?: string
          suffix?: string
          updated_at?: string | null
          value?: number
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
      student_ambassador: {
        Row: {
          id: string
          image_url: string
          message: string
          name: string
          quote: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          image_url: string
          message: string
          name: string
          quote?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          image_url?: string
          message?: string
          name?: string
          quote?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      student_life_videos: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          thumbnail_url: string | null
          title: string
          updated_at: string | null
          video_url: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
          video_url: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
          video_url?: string
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
      subjects: {
        Row: {
          created_at: string | null
          description: string
          display_order: number | null
          icon_name: string | null
          id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description: string
          display_order?: number | null
          icon_name?: string | null
          id?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string
          display_order?: number | null
          icon_name?: string | null
          id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      trust_badges: {
        Row: {
          created_at: string | null
          description: string
          display_order: number | null
          icon_name: string
          id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description: string
          display_order?: number | null
          icon_name: string
          id?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string
          display_order?: number | null
          icon_name?: string
          id?: string
          title?: string
          updated_at?: string | null
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
