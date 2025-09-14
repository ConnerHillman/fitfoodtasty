// Shared types for fulfillment system
import type { BaseEntity } from './common';

export interface FulfillmentSetting extends BaseEntity {
  setting_type: string;
  setting_key: string;
  setting_value: any;
}

export interface GlobalSchedule extends BaseEntity {
  day_of_week: string;
  default_cutoff_time: string;
  default_cutoff_day?: string;
  default_production_lead_days: number;
  default_production_same_day: boolean;
  is_business_open: boolean;
}

export interface DeliveryZone extends BaseEntity {
  zone_name: string;
  postcodes: string[];
  postcode_prefixes?: string[];
  delivery_days: string[];
  delivery_fee: number;
  minimum_order: number;
  maximum_distance_km: number | null;
  production_day_offset?: number;
  production_lead_days?: number;
  production_same_day?: boolean;
  allow_custom_dates?: boolean;
  production_notes?: string | null;
  order_cutoffs?: Record<string, { cutoff_day: string; cutoff_time: string }> | any;
  business_hours_override?: Record<string, { is_open: boolean; override_reason?: string }> | null;
}

export interface CollectionPoint extends BaseEntity {
  point_name: string;
  address: string;
  city: string;
  postcode: string;
  phone: string | null;
  email: string | null;
  collection_days: string[];
  opening_hours: any;
  collection_fee: number;
  maximum_capacity: number;
  special_instructions: string | null;
  order_cutoffs?: any;
  production_lead_days?: number;
  production_same_day?: boolean;
  production_notes?: string;
}

export const DAYS_OF_WEEK = [
  { value: "sunday", label: "Sunday" },
  { value: "monday", label: "Monday" },
  { value: "tuesday", label: "Tuesday" },
  { value: "wednesday", label: "Wednesday" },
  { value: "thursday", label: "Thursday" },
  { value: "friday", label: "Friday" },
  { value: "saturday", label: "Saturday" }
];