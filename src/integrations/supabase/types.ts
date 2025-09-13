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
      abandoned_cart_email_templates: {
        Row: {
          created_at: string
          email_type: string
          html_content: string
          id: string
          subject: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email_type: string
          html_content: string
          id?: string
          subject: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email_type?: string
          html_content?: string
          id?: string
          subject?: string
          updated_at?: string
        }
        Relationships: []
      }
      abandoned_cart_emails: {
        Row: {
          abandoned_cart_id: string
          clicked_at: string | null
          created_at: string
          email_content: string
          email_subject: string
          email_type: string
          id: string
          opened_at: string | null
          sent_at: string
        }
        Insert: {
          abandoned_cart_id: string
          clicked_at?: string | null
          created_at?: string
          email_content: string
          email_subject: string
          email_type: string
          id?: string
          opened_at?: string | null
          sent_at?: string
        }
        Update: {
          abandoned_cart_id?: string
          clicked_at?: string | null
          created_at?: string
          email_content?: string
          email_subject?: string
          email_type?: string
          id?: string
          opened_at?: string | null
          sent_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "abandoned_cart_emails_abandoned_cart_id_fkey"
            columns: ["abandoned_cart_id"]
            isOneToOne: false
            referencedRelation: "abandoned_carts"
            referencedColumns: ["id"]
          },
        ]
      }
      abandoned_cart_settings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          setting_name: string
          setting_value: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          setting_name: string
          setting_value: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          setting_name?: string
          setting_value?: string
          updated_at?: string
        }
        Relationships: []
      }
      abandoned_carts: {
        Row: {
          abandoned_at: string
          cart_items: Json
          created_at: string
          currency: string
          customer_email: string | null
          customer_name: string | null
          id: string
          recovered_at: string | null
          recovery_order_id: string | null
          session_id: string | null
          total_amount: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          abandoned_at?: string
          cart_items: Json
          created_at?: string
          currency?: string
          customer_email?: string | null
          customer_name?: string | null
          id?: string
          recovered_at?: string | null
          recovery_order_id?: string | null
          session_id?: string | null
          total_amount?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          abandoned_at?: string
          cart_items?: Json
          created_at?: string
          currency?: string
          customer_email?: string | null
          customer_name?: string | null
          id?: string
          recovered_at?: string | null
          recovery_order_id?: string | null
          session_id?: string | null
          total_amount?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      allergens: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      collection_points: {
        Row: {
          address: string
          city: string
          collection_days: string[]
          collection_fee: number
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          maximum_capacity: number | null
          opening_hours: Json | null
          order_cutoffs: Json | null
          phone: string | null
          point_name: string
          postcode: string
          production_lead_days: number | null
          production_notes: string | null
          production_same_day: boolean | null
          special_instructions: string | null
          updated_at: string
        }
        Insert: {
          address: string
          city: string
          collection_days: string[]
          collection_fee?: number
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          maximum_capacity?: number | null
          opening_hours?: Json | null
          order_cutoffs?: Json | null
          phone?: string | null
          point_name: string
          postcode: string
          production_lead_days?: number | null
          production_notes?: string | null
          production_same_day?: boolean | null
          special_instructions?: string | null
          updated_at?: string
        }
        Update: {
          address?: string
          city?: string
          collection_days?: string[]
          collection_fee?: number
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          maximum_capacity?: number | null
          opening_hours?: Json | null
          order_cutoffs?: Json | null
          phone?: string | null
          point_name?: string
          postcode?: string
          production_lead_days?: number | null
          production_notes?: string | null
          production_same_day?: boolean | null
          special_instructions?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      delivery_zones: {
        Row: {
          allow_custom_dates: boolean | null
          created_at: string
          delivery_days: string[]
          delivery_fee: number
          id: string
          is_active: boolean
          maximum_distance_km: number | null
          minimum_order: number
          order_cutoffs: Json | null
          postcode_prefixes: string[] | null
          postcodes: string[]
          production_day_offset: number | null
          production_lead_days: number | null
          production_notes: string | null
          production_same_day: boolean | null
          updated_at: string
          zone_name: string
        }
        Insert: {
          allow_custom_dates?: boolean | null
          created_at?: string
          delivery_days: string[]
          delivery_fee?: number
          id?: string
          is_active?: boolean
          maximum_distance_km?: number | null
          minimum_order?: number
          order_cutoffs?: Json | null
          postcode_prefixes?: string[] | null
          postcodes: string[]
          production_day_offset?: number | null
          production_lead_days?: number | null
          production_notes?: string | null
          production_same_day?: boolean | null
          updated_at?: string
          zone_name: string
        }
        Update: {
          allow_custom_dates?: boolean | null
          created_at?: string
          delivery_days?: string[]
          delivery_fee?: number
          id?: string
          is_active?: boolean
          maximum_distance_km?: number | null
          minimum_order?: number
          order_cutoffs?: Json | null
          postcode_prefixes?: string[] | null
          postcodes?: string[]
          production_day_offset?: number | null
          production_lead_days?: number | null
          production_notes?: string | null
          production_same_day?: boolean | null
          updated_at?: string
          zone_name?: string
        }
        Relationships: []
      }
      fulfillment_settings: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          setting_key: string
          setting_type: string
          setting_value: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          setting_key: string
          setting_type: string
          setting_value: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          setting_key?: string
          setting_type?: string
          setting_value?: Json
          updated_at?: string
        }
        Relationships: []
      }
      global_fulfillment_schedule: {
        Row: {
          created_at: string
          day_of_week: string
          default_cutoff_day: string | null
          default_cutoff_time: string
          default_production_lead_days: number
          default_production_same_day: boolean
          id: string
          is_active: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          day_of_week: string
          default_cutoff_day?: string | null
          default_cutoff_time?: string
          default_production_lead_days?: number
          default_production_same_day?: boolean
          id?: string
          is_active?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          day_of_week?: string
          default_cutoff_day?: string | null
          default_cutoff_time?: string
          default_production_lead_days?: number
          default_production_same_day?: boolean
          id?: string
          is_active?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      ingredient_allergens: {
        Row: {
          allergen_id: string
          created_at: string
          id: string
          ingredient_id: string
        }
        Insert: {
          allergen_id: string
          created_at?: string
          id?: string
          ingredient_id: string
        }
        Update: {
          allergen_id?: string
          created_at?: string
          id?: string
          ingredient_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ingredient_allergens_allergen_id_fkey"
            columns: ["allergen_id"]
            isOneToOne: false
            referencedRelation: "allergens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ingredient_allergens_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
        ]
      }
      ingredients: {
        Row: {
          calories_per_100g: number
          carbs_per_100g: number
          created_at: string
          default_unit: string | null
          description: string | null
          fat_per_100g: number
          fiber_per_100g: number | null
          id: string
          name: string
          protein_per_100g: number
          salt_per_100g: number | null
          saturated_fat_per_100g: number | null
          sodium_per_100g: number | null
          sugar_per_100g: number | null
          updated_at: string
        }
        Insert: {
          calories_per_100g?: number
          carbs_per_100g?: number
          created_at?: string
          default_unit?: string | null
          description?: string | null
          fat_per_100g?: number
          fiber_per_100g?: number | null
          id?: string
          name: string
          protein_per_100g?: number
          salt_per_100g?: number | null
          saturated_fat_per_100g?: number | null
          sodium_per_100g?: number | null
          sugar_per_100g?: number | null
          updated_at?: string
        }
        Update: {
          calories_per_100g?: number
          carbs_per_100g?: number
          created_at?: string
          default_unit?: string | null
          description?: string | null
          fat_per_100g?: number
          fiber_per_100g?: number | null
          id?: string
          name?: string
          protein_per_100g?: number
          salt_per_100g?: number | null
          saturated_fat_per_100g?: number | null
          sodium_per_100g?: number | null
          sugar_per_100g?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      meal_allergens: {
        Row: {
          allergen_id: string
          created_at: string
          id: string
          meal_id: string
        }
        Insert: {
          allergen_id: string
          created_at?: string
          id?: string
          meal_id: string
        }
        Update: {
          allergen_id?: string
          created_at?: string
          id?: string
          meal_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meal_allergens_allergen_id_fkey"
            columns: ["allergen_id"]
            isOneToOne: false
            referencedRelation: "allergens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_allergens_meal_id_fkey"
            columns: ["meal_id"]
            isOneToOne: false
            referencedRelation: "meals"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_ingredients: {
        Row: {
          created_at: string
          id: string
          ingredient_id: string
          meal_id: string
          quantity: number
          unit: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          ingredient_id: string
          meal_id: string
          quantity: number
          unit?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          ingredient_id?: string
          meal_id?: string
          quantity?: number
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meal_ingredients_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_ingredients_meal_id_fkey"
            columns: ["meal_id"]
            isOneToOne: false
            referencedRelation: "meals"
            referencedColumns: ["id"]
          },
        ]
      }
      meals: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          price: number | null
          shelf_life_days: number
          sort_order: number | null
          total_calories: number | null
          total_carbs: number | null
          total_fat: number | null
          total_fiber: number | null
          total_protein: number | null
          total_salt: number | null
          total_saturated_fat: number | null
          total_sodium: number | null
          total_sugar: number | null
          total_weight: number | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          price?: number | null
          shelf_life_days?: number
          sort_order?: number | null
          total_calories?: number | null
          total_carbs?: number | null
          total_fat?: number | null
          total_fiber?: number | null
          total_protein?: number | null
          total_salt?: number | null
          total_saturated_fat?: number | null
          total_sodium?: number | null
          total_sugar?: number | null
          total_weight?: number | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          price?: number | null
          shelf_life_days?: number
          sort_order?: number | null
          total_calories?: number | null
          total_carbs?: number | null
          total_fat?: number | null
          total_fiber?: number | null
          total_protein?: number | null
          total_salt?: number | null
          total_saturated_fat?: number | null
          total_sodium?: number | null
          total_sugar?: number | null
          total_weight?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          meal_id: string
          meal_name: string
          order_id: string
          quantity: number
          total_price: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          meal_id: string
          meal_name: string
          order_id: string
          quantity: number
          total_price: number
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          meal_id?: string
          meal_name?: string
          order_id?: string
          quantity?: number
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_meal_id_fkey"
            columns: ["meal_id"]
            isOneToOne: false
            referencedRelation: "meals"
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
          actual_delivery_date: string | null
          actual_production_date: string | null
          created_at: string
          currency: string
          customer_email: string | null
          customer_name: string | null
          delivery_address: string | null
          discount_amount: number | null
          id: string
          production_date: string | null
          referral_code_used: string | null
          requested_delivery_date: string | null
          status: string
          stripe_session_id: string | null
          total_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          actual_delivery_date?: string | null
          actual_production_date?: string | null
          created_at?: string
          currency?: string
          customer_email?: string | null
          customer_name?: string | null
          delivery_address?: string | null
          discount_amount?: number | null
          id?: string
          production_date?: string | null
          referral_code_used?: string | null
          requested_delivery_date?: string | null
          status?: string
          stripe_session_id?: string | null
          total_amount: number
          updated_at?: string
          user_id: string
        }
        Update: {
          actual_delivery_date?: string | null
          actual_production_date?: string | null
          created_at?: string
          currency?: string
          customer_email?: string | null
          customer_name?: string | null
          delivery_address?: string | null
          discount_amount?: number | null
          id?: string
          production_date?: string | null
          referral_code_used?: string | null
          requested_delivery_date?: string | null
          status?: string
          stripe_session_id?: string | null
          total_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      package_meal_selections: {
        Row: {
          created_at: string
          id: string
          meal_id: string | null
          package_order_id: string | null
          quantity: number
        }
        Insert: {
          created_at?: string
          id?: string
          meal_id?: string | null
          package_order_id?: string | null
          quantity?: number
        }
        Update: {
          created_at?: string
          id?: string
          meal_id?: string | null
          package_order_id?: string | null
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "package_meal_selections_meal_id_fkey"
            columns: ["meal_id"]
            isOneToOne: false
            referencedRelation: "meals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "package_meal_selections_package_order_id_fkey"
            columns: ["package_order_id"]
            isOneToOne: false
            referencedRelation: "package_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      package_meals: {
        Row: {
          created_at: string
          id: string
          meal_id: string
          package_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          meal_id: string
          package_id: string
        }
        Update: {
          created_at?: string
          id?: string
          meal_id?: string
          package_id?: string
        }
        Relationships: []
      }
      package_orders: {
        Row: {
          actual_delivery_date: string | null
          actual_production_date: string | null
          created_at: string
          currency: string
          customer_email: string | null
          customer_name: string | null
          delivery_address: string | null
          id: string
          package_id: string | null
          production_date: string | null
          requested_delivery_date: string | null
          status: string
          stripe_session_id: string | null
          total_amount: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          actual_delivery_date?: string | null
          actual_production_date?: string | null
          created_at?: string
          currency?: string
          customer_email?: string | null
          customer_name?: string | null
          delivery_address?: string | null
          id?: string
          package_id?: string | null
          production_date?: string | null
          requested_delivery_date?: string | null
          status?: string
          stripe_session_id?: string | null
          total_amount: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          actual_delivery_date?: string | null
          actual_production_date?: string | null
          created_at?: string
          currency?: string
          customer_email?: string | null
          customer_name?: string | null
          delivery_address?: string | null
          id?: string
          package_id?: string | null
          production_date?: string | null
          requested_delivery_date?: string | null
          status?: string
          stripe_session_id?: string | null
          total_amount?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "package_orders_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
        ]
      }
      packages: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          meal_count: number
          name: string
          price: number
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          meal_count: number
          name: string
          price: number
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          meal_count?: number
          name?: string
          price?: number
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      page_views: {
        Row: {
          created_at: string
          id: string
          ip_address: string | null
          page_id: string | null
          page_type: string
          referrer: string | null
          session_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          ip_address?: string | null
          page_id?: string | null
          page_type: string
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          ip_address?: string | null
          page_id?: string | null
          page_type?: string
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          city: string | null
          county: string | null
          created_at: string
          delivery_address: string | null
          delivery_instructions: string | null
          full_name: string
          id: string
          phone: string | null
          postal_code: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          city?: string | null
          county?: string | null
          created_at?: string
          delivery_address?: string | null
          delivery_instructions?: string | null
          full_name: string
          id?: string
          phone?: string | null
          postal_code?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          city?: string | null
          county?: string | null
          created_at?: string
          delivery_address?: string | null
          delivery_instructions?: string | null
          full_name?: string
          id?: string
          phone?: string | null
          postal_code?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      referral_codes: {
        Row: {
          code: string
          created_at: string
          id: string
          is_active: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      referral_settings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          setting_name: string
          setting_value: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          setting_name: string
          setting_value: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          setting_name?: string
          setting_value?: string
          updated_at?: string
        }
        Relationships: []
      }
      referral_transactions: {
        Row: {
          created_at: string
          id: string
          order_id: string | null
          order_total: number
          referee_discount_given: number
          referee_user_id: string
          referral_code_used: string
          referrer_credit_earned: number
          referrer_user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          order_id?: string | null
          order_total?: number
          referee_discount_given?: number
          referee_user_id: string
          referral_code_used: string
          referrer_credit_earned?: number
          referrer_user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string | null
          order_total?: number
          referee_discount_given?: number
          referee_user_id?: string
          referral_code_used?: string
          referrer_credit_earned?: number
          referrer_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_meal_labels: {
        Row: {
          allergens: string | null
          calories: number
          carbs: number
          created_at: string
          fat: number
          heating_instructions: string | null
          id: string
          ingredients: string | null
          name: string
          protein: number
          storage_instructions: string | null
          updated_at: string
        }
        Insert: {
          allergens?: string | null
          calories?: number
          carbs?: number
          created_at?: string
          fat?: number
          heating_instructions?: string | null
          id?: string
          ingredients?: string | null
          name: string
          protein?: number
          storage_instructions?: string | null
          updated_at?: string
        }
        Update: {
          allergens?: string | null
          calories?: number
          carbs?: number
          created_at?: string
          fat?: number
          heating_instructions?: string | null
          id?: string
          ingredients?: string | null
          name?: string
          protein?: number
          storage_instructions?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_credits: {
        Row: {
          created_at: string
          id: string
          total_credits: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          total_credits?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          total_credits?: number
          updated_at?: string
          user_id?: string
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
      calculate_meal_nutrition: {
        Args: { meal_id_param: string }
        Returns: undefined
      }
      calculate_production_date: {
        Args: { delivery_date: string; zone_id?: string }
        Returns: string
      }
      generate_referral_code: {
        Args: { user_email: string }
        Returns: string
      }
      get_delivery_zone_for_postcode: {
        Args: { customer_postcode: string }
        Returns: string
      }
      get_next_delivery_date: {
        Args: { target_day?: string; zone_id: string }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      recalculate_all_meal_nutrition: {
        Args: Record<PropertyKey, never>
        Returns: {
          meal_id: string
          meal_name: string
          new_calories: number
          old_calories: number
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
