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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      appointments: {
        Row: {
          clinic_id: string | null
          clinic_name: string
          created_at: string
          email: string
          id: string
          name: string
          notes: string | null
          phone: string
          preferred_date: string | null
          service: string
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          clinic_id?: string | null
          clinic_name: string
          created_at?: string
          email: string
          id?: string
          name: string
          notes?: string | null
          phone: string
          preferred_date?: string | null
          service?: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          clinic_id?: string | null
          clinic_name?: string
          created_at?: string
          email?: string
          id?: string
          name?: string
          notes?: string | null
          phone?: string
          preferred_date?: string | null
          service?: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      clinics: {
        Row: {
          address: string
          created_at: string
          id: string
          is_active: boolean
          is_flagship: boolean
          latitude: number | null
          longitude: number | null
          name: string
          opening_hours: Json
          optometrist_count: number
          phone: string | null
          services: string[]
          slug: string
          sort_order: number
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          address: string
          created_at?: string
          id?: string
          is_active?: boolean
          is_flagship?: boolean
          latitude?: number | null
          longitude?: number | null
          name: string
          opening_hours?: Json
          optometrist_count?: number
          phone?: string | null
          services?: string[]
          slug: string
          sort_order?: number
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          address?: string
          created_at?: string
          id?: string
          is_active?: boolean
          is_flagship?: boolean
          latitude?: number | null
          longitude?: number | null
          name?: string
          opening_hours?: Json
          optometrist_count?: number
          phone?: string | null
          services?: string[]
          slug?: string
          sort_order?: number
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      frame_categories: {
        Row: {
          created_at: string
          description: string | null
          hero_subtitle: string | null
          hero_title: string | null
          id: string
          is_active: boolean
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          hero_subtitle?: string | null
          hero_title?: string | null
          id?: string
          is_active?: boolean
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          hero_subtitle?: string | null
          hero_title?: string | null
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      frames: {
        Row: {
          badge: string | null
          category_id: string | null
          colors: Json
          created_at: string
          description: string | null
          gender: string | null
          id: string
          is_active: boolean
          material: string | null
          materials: Json
          name: string
          photo_urls: string[]
          price_ghs: number
          shape: string | null
          slug: string
          stock: number
          updated_at: string
        }
        Insert: {
          badge?: string | null
          category_id?: string | null
          colors?: Json
          created_at?: string
          description?: string | null
          gender?: string | null
          id?: string
          is_active?: boolean
          material?: string | null
          materials?: Json
          name: string
          photo_urls?: string[]
          price_ghs: number
          shape?: string | null
          slug: string
          stock?: number
          updated_at?: string
        }
        Update: {
          badge?: string | null
          category_id?: string | null
          colors?: Json
          created_at?: string
          description?: string | null
          gender?: string | null
          id?: string
          is_active?: boolean
          material?: string | null
          materials?: Json
          name?: string
          photo_urls?: string[]
          price_ghs?: number
          shape?: string | null
          slug?: string
          stock?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "frames_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "frame_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_categories: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      journal_posts: {
        Row: {
          author: string | null
          body: string | null
          category_id: string | null
          cover_image_url: string | null
          created_at: string
          excerpt: string | null
          id: string
          is_featured: boolean
          published_at: string | null
          read_minutes: number | null
          slug: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          author?: string | null
          body?: string | null
          category_id?: string | null
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          is_featured?: boolean
          published_at?: string | null
          read_minutes?: number | null
          slug: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          author?: string | null
          body?: string | null
          category_id?: string | null
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          is_featured?: boolean
          published_at?: string | null
          read_minutes?: number | null
          slug?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "journal_posts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "journal_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      lens_addons: {
        Row: {
          addon_group: string
          created_at: string
          description: string | null
          id: string
          included: boolean
          is_active: boolean
          name: string
          price_ghs: number
          single_select: boolean
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          addon_group?: string
          created_at?: string
          description?: string | null
          id?: string
          included?: boolean
          is_active?: boolean
          name: string
          price_ghs?: number
          single_select?: boolean
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          addon_group?: string
          created_at?: string
          description?: string | null
          id?: string
          included?: boolean
          is_active?: boolean
          name?: string
          price_ghs?: number
          single_select?: boolean
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      lens_types: {
        Row: {
          badge: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          price_ghs: number
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          badge?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          price_ghs?: number
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          badge?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          price_ghs?: number
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      newsletter_signups: {
        Row: {
          created_at: string
          email: string
          id: string
          source: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          source?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          source?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          color_selected: string | null
          created_at: string
          frame_id: string | null
          id: string
          lens_config: Json | null
          lens_price_ghs: number
          order_id: string
          price_ghs: number
          quantity: number
        }
        Insert: {
          color_selected?: string | null
          created_at?: string
          frame_id?: string | null
          id?: string
          lens_config?: Json | null
          lens_price_ghs?: number
          order_id: string
          price_ghs: number
          quantity?: number
        }
        Update: {
          color_selected?: string | null
          created_at?: string
          frame_id?: string | null
          id?: string
          lens_config?: Json | null
          lens_price_ghs?: number
          order_id?: string
          price_ghs?: number
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_frame_id_fkey"
            columns: ["frame_id"]
            isOneToOne: false
            referencedRelation: "frames"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          courier: string | null
          created_at: string
          currency: string
          delivery_address: string | null
          delivery_city: string | null
          delivery_landmark: string | null
          delivery_name: string | null
          delivery_phone: string | null
          delivery_type: string | null
          e_levy_amount: number
          id: string
          idempotency_key: string | null
          payment_method: string | null
          payment_reference: string | null
          status: string
          total_ghs: number
          tracking_number: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          courier?: string | null
          created_at?: string
          currency?: string
          delivery_address?: string | null
          delivery_city?: string | null
          delivery_landmark?: string | null
          delivery_name?: string | null
          delivery_phone?: string | null
          delivery_type?: string | null
          e_levy_amount?: number
          id?: string
          idempotency_key?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          status?: string
          total_ghs: number
          tracking_number?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          courier?: string | null
          created_at?: string
          currency?: string
          delivery_address?: string | null
          delivery_city?: string | null
          delivery_landmark?: string | null
          delivery_name?: string | null
          delivery_phone?: string | null
          delivery_type?: string | null
          e_levy_amount?: number
          id?: string
          idempotency_key?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          status?: string
          total_ghs?: number
          tracking_number?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      prescription_access_log: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          id: string
          prescription_id: string | null
          reason: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          id?: string
          prescription_id?: string | null
          reason?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          id?: string
          prescription_id?: string | null
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prescription_access_log_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescription_access_log_prescription_id_fkey"
            columns: ["prescription_id"]
            isOneToOne: false
            referencedRelation: "prescriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      prescriptions: {
        Row: {
          consent_at: string
          created_at: string
          file_path: string | null
          id: string
          issued_on: string | null
          mime_type: string | null
          notes: string | null
          original_name: string | null
          practitioner_name: string | null
          review_notes: string | null
          rx_values: Json | null
          size_bytes: number | null
          source: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          consent_at: string
          created_at?: string
          file_path?: string | null
          id?: string
          issued_on?: string | null
          mime_type?: string | null
          notes?: string | null
          original_name?: string | null
          practitioner_name?: string | null
          review_notes?: string | null
          rx_values?: Json | null
          size_bytes?: number | null
          source?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          consent_at?: string
          created_at?: string
          file_path?: string | null
          id?: string
          issued_on?: string | null
          mime_type?: string | null
          notes?: string | null
          original_name?: string | null
          practitioner_name?: string | null
          review_notes?: string | null
          rx_values?: Json | null
          size_bytes?: number | null
          source?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prescriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string | null
          phone: string | null
          role: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          name?: string | null
          phone?: string | null
          role?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string | null
          phone?: string | null
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      webhook_events: {
        Row: {
          event: string
          id: string
          payload: Json
          paystack_event_id: string
          processed_at: string
        }
        Insert: {
          event: string
          id?: string
          payload: Json
          paystack_event_id: string
          processed_at?: string
        }
        Update: {
          event?: string
          id?: string
          payload?: Json
          paystack_event_id?: string
          processed_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: { Args: never; Returns: boolean }
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
