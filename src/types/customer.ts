// Shared types for customer management

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

export interface CustomerFilters {
  searchTerm: string;
  sortBy: string;
  sortOrder: "asc" | "desc";
  filterBy: string;
  viewMode: "list" | "card";
  dateRange: { from: Date; to: Date };
}

export interface CustomerStats {
  total: number;
  withOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  activeCustomers: number;
}