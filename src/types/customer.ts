// Shared types for customer management
import type { BaseEntity, BaseFilters, ViewModeFilters, DateRange } from './common';

export interface Customer {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  delivery_address: string;
  city: string;
  postal_code: string;
  county: string;
  email?: string;
  created_at: string;
  total_orders: number;
  total_spent: number;
  last_order_date?: string;
  order_count: number;
  package_order_count: number;
  delivery_instructions?: string;
}

export interface CustomerOrder {
  id: string;
  created_at: string;
  total_amount: number;
  status: string;
  type: 'order' | 'package_order';
  items_count: number;
  currency: string;
}

export interface CustomerFilters extends BaseFilters, ViewModeFilters {
  filterBy: string;
  dateRange: DateRange;
  viewMode: "list" | "card";
}

export interface CustomerStats {
  total: number;
  withOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  activeCustomers: number;
}

// Enhanced types for customer detail modal
export interface CustomerProfile {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  delivery_address: string;
  delivery_instructions: string;
  city: string;
  postal_code: string;
  county: string;
  created_at: string;
}

export interface CustomerDetailStats {
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  orderFrequency: number;
  daysSinceLastOrder?: number;
  customerLifetimeValue?: number;
}

export interface MonthlyRevenue {
  month: string;
  orders: number;
  revenue: number;
}

export interface ActivityItem {
  id: string;
  created_at: string;
  type: 'view' | 'cart_abandoned' | 'order';
  page?: string;
  total_amount?: number;
}

// Type for customer modal context
export interface CustomerModalData {
  user_id: string;
  full_name: string;
  phone?: string;
  delivery_address?: string;
  delivery_instructions?: string;
  city?: string;
  postal_code?: string;
  county?: string;
  email?: string;
  created_at: string;
  total_orders?: number;
  total_spent?: number;
  last_order_date?: string;
}