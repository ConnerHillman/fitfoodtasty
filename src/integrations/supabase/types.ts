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
      coupons: {
        Row: {
          active: boolean
          code: string
          created_at: string
          discount_amount: number | null
          discount_percentage: number
          expires_at: string | null
          free_delivery: boolean
          free_item_id: string | null
          id: string
          min_order_value: number | null
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          discount_amount?: number | null
          discount_percentage: number
          expires_at?: string | null
          free_delivery?: boolean
          free_item_id?: string | null
          id?: string
          min_order_value?: number | null
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          discount_amount?: number | null
          discount_percentage?: number
          expires_at?: string | null
          free_delivery?: boolean
          free_item_id?: string | null
          id?: string
          min_order_value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_coupons_free_item"
            columns: ["free_item_id"]
            isOneToOne: false
            referencedRelation: "meals"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_zones: {
        Row: {
          allow_custom_dates: boolean | null
          business_hours_override: Json | null
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
          business_hours_override?: Json | null
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
          business_hours_override?: Json | null
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
      filters: {
        Row: {
          category: string | null
          created_at: string
          id: string
          is_active: boolean
          name: string
          threshold: Json | null
          type: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          threshold?: Json | null
          type: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          threshold?: Json | null
          type?: string
          updated_at?: string
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
      gift_card_products: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          sort_order: number
          stripe_price_id: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          sort_order?: number
          stripe_price_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          sort_order?: number
          stripe_price_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      gift_card_transactions: {
        Row: {
          amount_used: number
          created_at: string
          gift_card_id: string
          id: string
          order_id: string | null
          remaining_balance: number
          transaction_type: string
          user_id: string | null
        }
        Insert: {
          amount_used: number
          created_at?: string
          gift_card_id: string
          id?: string
          order_id?: string | null
          remaining_balance: number
          transaction_type: string
          user_id?: string | null
        }
        Update: {
          amount_used?: number
          created_at?: string
          gift_card_id?: string
          id?: string
          order_id?: string | null
          remaining_balance?: number
          transaction_type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gift_card_transactions_gift_card_id_fkey"
            columns: ["gift_card_id"]
            isOneToOne: false
            referencedRelation: "gift_cards"
            referencedColumns: ["id"]
          },
        ]
      }
      gift_cards: {
        Row: {
          amount: number
          balance: number
          code: string
          created_at: string
          expires_at: string
          id: string
          message: string | null
          order_id: string | null
          purchased_at: string
          purchaser_email: string
          purchaser_name: string
          purchaser_user_id: string | null
          recipient_email: string | null
          recipient_name: string | null
          redeemed_at: string | null
          redeemed_by_user_id: string | null
          status: string
          stripe_payment_intent_id: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          balance: number
          code: string
          created_at?: string
          expires_at?: string
          id?: string
          message?: string | null
          order_id?: string | null
          purchased_at?: string
          purchaser_email: string
          purchaser_name: string
          purchaser_user_id?: string | null
          recipient_email?: string | null
          recipient_name?: string | null
          redeemed_at?: string | null
          redeemed_by_user_id?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          balance?: number
          code?: string
          created_at?: string
          expires_at?: string
          id?: string
          message?: string | null
          order_id?: string | null
          purchased_at?: string
          purchaser_email?: string
          purchaser_name?: string
          purchaser_user_id?: string | null
          recipient_email?: string | null
          recipient_name?: string | null
          redeemed_at?: string | null
          redeemed_by_user_id?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
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
          is_business_open: boolean
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
          is_business_open?: boolean
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
          is_business_open?: boolean
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
      meal_ingredients_allergens: {
        Row: {
          allergen_type: string | null
          created_at: string
          id: string
          ingredient: string
          is_allergen: boolean
          meal_id: string
        }
        Insert: {
          allergen_type?: string | null
          created_at?: string
          id?: string
          ingredient: string
          is_allergen?: boolean
          meal_id: string
        }
        Update: {
          allergen_type?: string | null
          created_at?: string
          id?: string
          ingredient?: string
          is_allergen?: boolean
          meal_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meal_ingredients_allergens_meal_id_fkey"
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
          storage_heating_instructions: string | null
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
          storage_heating_instructions?: string | null
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
          storage_heating_instructions?: string | null
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
      order_audit_log: {
        Row: {
          action_type: string
          amount_changed: number | null
          created_at: string
          id: string
          metadata: Json | null
          new_values: Json | null
          old_values: Json | null
          order_id: string
          order_type: string
          performed_by: string
          reason: string | null
        }
        Insert: {
          action_type: string
          amount_changed?: number | null
          created_at?: string
          id?: string
          metadata?: Json | null
          new_values?: Json | null
          old_values?: Json | null
          order_id: string
          order_type?: string
          performed_by: string
          reason?: string | null
        }
        Update: {
          action_type?: string
          amount_changed?: number | null
          created_at?: string
          id?: string
          metadata?: Json | null
          new_values?: Json | null
          old_values?: Json | null
          order_id?: string
          order_type?: string
          performed_by?: string
          reason?: string | null
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
          coupon_discount_amount: number | null
          coupon_discount_percentage: number | null
          coupon_free_delivery: boolean | null
          coupon_free_item_id: string | null
          coupon_type: string | null
          created_at: string
          currency: string
          customer_email: string | null
          customer_name: string | null
          delivery_address: string | null
          discount_amount: number | null
          id: string
          last_modified_by: string | null
          order_notes: string | null
          production_date: string | null
          referral_code_used: string | null
          refund_amount: number | null
          refund_reason: string | null
          requested_delivery_date: string | null
          status: string
          stripe_session_id: string | null
          total_amount: number
          updated_at: string
          user_id: string
          voided_at: string | null
          voided_by: string | null
        }
        Insert: {
          actual_delivery_date?: string | null
          actual_production_date?: string | null
          coupon_discount_amount?: number | null
          coupon_discount_percentage?: number | null
          coupon_free_delivery?: boolean | null
          coupon_free_item_id?: string | null
          coupon_type?: string | null
          created_at?: string
          currency?: string
          customer_email?: string | null
          customer_name?: string | null
          delivery_address?: string | null
          discount_amount?: number | null
          id?: string
          last_modified_by?: string | null
          order_notes?: string | null
          production_date?: string | null
          referral_code_used?: string | null
          refund_amount?: number | null
          refund_reason?: string | null
          requested_delivery_date?: string | null
          status?: string
          stripe_session_id?: string | null
          total_amount: number
          updated_at?: string
          user_id: string
          voided_at?: string | null
          voided_by?: string | null
        }
        Update: {
          actual_delivery_date?: string | null
          actual_production_date?: string | null
          coupon_discount_amount?: number | null
          coupon_discount_percentage?: number | null
          coupon_free_delivery?: boolean | null
          coupon_free_item_id?: string | null
          coupon_type?: string | null
          created_at?: string
          currency?: string
          customer_email?: string | null
          customer_name?: string | null
          delivery_address?: string | null
          discount_amount?: number | null
          id?: string
          last_modified_by?: string | null
          order_notes?: string | null
          production_date?: string | null
          referral_code_used?: string | null
          refund_amount?: number | null
          refund_reason?: string | null
          requested_delivery_date?: string | null
          status?: string
          stripe_session_id?: string | null
          total_amount?: number
          updated_at?: string
          user_id?: string
          voided_at?: string | null
          voided_by?: string | null
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
          last_modified_by: string | null
          order_notes: string | null
          package_id: string | null
          production_date: string | null
          refund_amount: number | null
          refund_reason: string | null
          requested_delivery_date: string | null
          status: string
          stripe_session_id: string | null
          total_amount: number
          updated_at: string
          user_id: string | null
          voided_at: string | null
          voided_by: string | null
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
          last_modified_by?: string | null
          order_notes?: string | null
          package_id?: string | null
          production_date?: string | null
          refund_amount?: number | null
          refund_reason?: string | null
          requested_delivery_date?: string | null
          status?: string
          stripe_session_id?: string | null
          total_amount: number
          updated_at?: string
          user_id?: string | null
          voided_at?: string | null
          voided_by?: string | null
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
          last_modified_by?: string | null
          order_notes?: string | null
          package_id?: string | null
          production_date?: string | null
          refund_amount?: number | null
          refund_reason?: string | null
          requested_delivery_date?: string | null
          status?: string
          stripe_session_id?: string | null
          total_amount?: number
          updated_at?: string
          user_id?: string | null
          voided_at?: string | null
          voided_by?: string | null
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
          id: string
          ingredients: string | null
          name: string
          protein: number
          storage_heating_instructions: string
          updated_at: string
          user_id: string
        }
        Insert: {
          allergens?: string | null
          calories?: number
          carbs?: number
          created_at?: string
          fat?: number
          id?: string
          ingredients?: string | null
          name: string
          protein?: number
          storage_heating_instructions?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          allergens?: string | null
          calories?: number
          carbs?: number
          created_at?: string
          fat?: number
          id?: string
          ingredients?: string | null
          name?: string
          protein?: number
          storage_heating_instructions?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      security_audit_log: {
        Row: {
          action_type: string
          created_at: string | null
          id: string
          ip_address: string | null
          metadata: Json | null
          record_id: string | null
          table_name: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action_type: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          record_id?: string | null
          table_name: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          record_id?: string | null
          table_name?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      subscription_audit_log: {
        Row: {
          action_type: string
          created_at: string | null
          id: string
          metadata: Json | null
          new_values: Json | null
          old_values: Json | null
          performed_by: string | null
          reason: string | null
          user_subscription_id: string
        }
        Insert: {
          action_type: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          new_values?: Json | null
          old_values?: Json | null
          performed_by?: string | null
          reason?: string | null
          user_subscription_id: string
        }
        Update: {
          action_type?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          new_values?: Json | null
          old_values?: Json | null
          performed_by?: string | null
          reason?: string | null
          user_subscription_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_audit_log_user_subscription_id_fkey"
            columns: ["user_subscription_id"]
            isOneToOne: false
            referencedRelation: "user_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_deliveries: {
        Row: {
          actual_delivery_date: string | null
          admin_notes: string | null
          collection_point_id: string | null
          completed_at: string | null
          created_at: string
          customer_feedback: string | null
          customer_rating: number | null
          delivery_address: string | null
          delivery_attempt_count: number | null
          delivery_instructions: string | null
          delivery_method: string | null
          delivery_notes: string | null
          delivery_zone_id: string | null
          discount_amount: number | null
          final_amount: number | null
          id: string
          last_delivery_attempt: string | null
          meal_selections: Json | null
          payment_status: string | null
          planned_delivery_date: string
          production_date: string | null
          skipped_reason: string | null
          status: string
          stripe_invoice_id: string | null
          total_amount: number | null
          updated_at: string
          user_subscription_id: string
        }
        Insert: {
          actual_delivery_date?: string | null
          admin_notes?: string | null
          collection_point_id?: string | null
          completed_at?: string | null
          created_at?: string
          customer_feedback?: string | null
          customer_rating?: number | null
          delivery_address?: string | null
          delivery_attempt_count?: number | null
          delivery_instructions?: string | null
          delivery_method?: string | null
          delivery_notes?: string | null
          delivery_zone_id?: string | null
          discount_amount?: number | null
          final_amount?: number | null
          id?: string
          last_delivery_attempt?: string | null
          meal_selections?: Json | null
          payment_status?: string | null
          planned_delivery_date: string
          production_date?: string | null
          skipped_reason?: string | null
          status?: string
          stripe_invoice_id?: string | null
          total_amount?: number | null
          updated_at?: string
          user_subscription_id: string
        }
        Update: {
          actual_delivery_date?: string | null
          admin_notes?: string | null
          collection_point_id?: string | null
          completed_at?: string | null
          created_at?: string
          customer_feedback?: string | null
          customer_rating?: number | null
          delivery_address?: string | null
          delivery_attempt_count?: number | null
          delivery_instructions?: string | null
          delivery_method?: string | null
          delivery_notes?: string | null
          delivery_zone_id?: string | null
          discount_amount?: number | null
          final_amount?: number | null
          id?: string
          last_delivery_attempt?: string | null
          meal_selections?: Json | null
          payment_status?: string | null
          planned_delivery_date?: string
          production_date?: string | null
          skipped_reason?: string | null
          status?: string
          stripe_invoice_id?: string | null
          total_amount?: number | null
          updated_at?: string
          user_subscription_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_deliveries_collection_point_id_fkey"
            columns: ["collection_point_id"]
            isOneToOne: false
            referencedRelation: "collection_points"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_deliveries_delivery_zone_id_fkey"
            columns: ["delivery_zone_id"]
            isOneToOne: false
            referencedRelation: "delivery_zones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_deliveries_user_subscription_id_fkey"
            columns: ["user_subscription_id"]
            isOneToOne: false
            referencedRelation: "user_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          cancellation_period_days: number | null
          created_at: string
          delivery_frequency: string
          description: string | null
          discount_percentage: number | null
          id: string
          is_active: boolean
          max_pauses_per_period: number | null
          meal_count: number
          minimum_commitment_deliveries: number | null
          name: string
          pause_duration_days: number | null
          price_per_delivery: number
          sort_order: number | null
          stripe_price_id: string | null
          stripe_product_id: string | null
          trial_period_days: number | null
          updated_at: string
        }
        Insert: {
          cancellation_period_days?: number | null
          created_at?: string
          delivery_frequency: string
          description?: string | null
          discount_percentage?: number | null
          id?: string
          is_active?: boolean
          max_pauses_per_period?: number | null
          meal_count: number
          minimum_commitment_deliveries?: number | null
          name: string
          pause_duration_days?: number | null
          price_per_delivery: number
          sort_order?: number | null
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          trial_period_days?: number | null
          updated_at?: string
        }
        Update: {
          cancellation_period_days?: number | null
          created_at?: string
          delivery_frequency?: string
          description?: string | null
          discount_percentage?: number | null
          id?: string
          is_active?: boolean
          max_pauses_per_period?: number | null
          meal_count?: number
          minimum_commitment_deliveries?: number | null
          name?: string
          pause_duration_days?: number | null
          price_per_delivery?: number
          sort_order?: number | null
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          trial_period_days?: number | null
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
      user_order_favorites: {
        Row: {
          created_at: string | null
          favorited_at: string | null
          id: string
          order_id: string
          order_type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          favorited_at?: string | null
          id?: string
          order_id: string
          order_type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          favorited_at?: string | null
          id?: string
          order_id?: string
          order_type?: string
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
      user_subscriptions: {
        Row: {
          cancellation_reason: string | null
          cancelled_at: string | null
          collection_point_id: string | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          delivery_address: string | null
          delivery_instructions: string | null
          delivery_method: string | null
          delivery_zone_id: string | null
          id: string
          last_charge_date: string | null
          meal_preferences: Json | null
          metadata: Json | null
          next_charge_date: string | null
          next_delivery_date: string | null
          pause_reason: string | null
          paused_deliveries_count: number | null
          paused_until: string | null
          skip_next_delivery: boolean | null
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_plan_id: string
          total_deliveries_count: number | null
          trial_ends_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cancellation_reason?: string | null
          cancelled_at?: string | null
          collection_point_id?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          delivery_address?: string | null
          delivery_instructions?: string | null
          delivery_method?: string | null
          delivery_zone_id?: string | null
          id?: string
          last_charge_date?: string | null
          meal_preferences?: Json | null
          metadata?: Json | null
          next_charge_date?: string | null
          next_delivery_date?: string | null
          pause_reason?: string | null
          paused_deliveries_count?: number | null
          paused_until?: string | null
          skip_next_delivery?: boolean | null
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_plan_id: string
          total_deliveries_count?: number | null
          trial_ends_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cancellation_reason?: string | null
          cancelled_at?: string | null
          collection_point_id?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          delivery_address?: string | null
          delivery_instructions?: string | null
          delivery_method?: string | null
          delivery_zone_id?: string | null
          id?: string
          last_charge_date?: string | null
          meal_preferences?: Json | null
          metadata?: Json | null
          next_charge_date?: string | null
          next_delivery_date?: string | null
          pause_reason?: string | null
          paused_deliveries_count?: number | null
          paused_until?: string | null
          skip_next_delivery?: boolean | null
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_plan_id?: string
          total_deliveries_count?: number | null
          trial_ends_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_collection_point_id_fkey"
            columns: ["collection_point_id"]
            isOneToOne: false
            referencedRelation: "collection_points"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_subscriptions_delivery_zone_id_fkey"
            columns: ["delivery_zone_id"]
            isOneToOne: false
            referencedRelation: "delivery_zones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_subscriptions_subscription_plan_id_fkey"
            columns: ["subscription_plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
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
      calculate_next_delivery_date: {
        Args: {
          p_current_date: string
          p_delivery_frequency: string
          p_delivery_zone_id?: string
        }
        Returns: string
      }
      calculate_production_date: {
        Args: { delivery_date: string; zone_id?: string }
        Returns: string
      }
      can_access_abandoned_cart: {
        Args: { cart_session_id: string; cart_user_id: string }
        Returns: boolean
      }
      can_access_gift_card: {
        Args: {
          card_purchaser_email: string
          card_purchaser_user_id: string
          card_recipient_email: string
          card_redeemed_by_user_id: string
        }
        Returns: boolean
      }
      generate_gift_card_code: {
        Args: Record<PropertyKey, never>
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
      get_subscription_summary: {
        Args: Record<PropertyKey, never>
        Returns: {
          active_subscriptions: number
          cancelled_subscriptions: number
          monthly_revenue: number
          paused_subscriptions: number
          total_subscriptions: number
          trial_subscriptions: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      log_order_change: {
        Args: {
          p_action_type: string
          p_amount_changed?: number
          p_metadata?: Json
          p_new_values?: Json
          p_old_values?: Json
          p_order_id: string
          p_order_type: string
          p_performed_by: string
          p_reason?: string
        }
        Returns: string
      }
      log_sensitive_access: {
        Args: {
          p_action_type: string
          p_metadata?: Json
          p_record_id?: string
          p_table_name: string
        }
        Returns: undefined
      }
      log_subscription_change: {
        Args: {
          p_action_type: string
          p_metadata?: Json
          p_new_values?: Json
          p_old_values?: Json
          p_reason?: string
          p_user_subscription_id: string
        }
        Returns: string
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
      validate_gift_card: {
        Args: { amount_to_use?: number; gift_card_code: string }
        Returns: Json
      }
      validate_referral_code_usage: {
        Args: { referral_code: string; user_id: string }
        Returns: boolean
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
