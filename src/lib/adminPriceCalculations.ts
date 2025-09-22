// Unified price calculation system for admin orders
import type { CartItem } from "@/types/cart";

export interface AdminPriceOverrides {
  [itemId: string]: number;
}

export interface AdminPriceCalculation {
  itemCalculations: Array<{
    id: string;
    name: string;
    quantity: number;
    originalPrice: number;
    currentPrice: number;
    isOverridden: boolean;
    lineTotal: number;
  }>;
  subtotal: number;
  hasOverrides: boolean;
  totalOverrides: number;
}

/**
 * Calculate totals considering admin price overrides
 */
export const calculateAdminTotals = (
  items: CartItem[],
  priceOverrides: AdminPriceOverrides = {}
): AdminPriceCalculation => {
  const itemCalculations = items.map(item => {
    const currentPrice = priceOverrides[item.id] ?? item.price;
    const isOverridden = item.id in priceOverrides;
    const lineTotal = currentPrice * item.quantity;

    return {
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      originalPrice: item.price,
      currentPrice,
      isOverridden,
      lineTotal,
    };
  });

  const subtotal = itemCalculations.reduce((total, item) => total + item.lineTotal, 0);
  const hasOverrides = itemCalculations.some(item => item.isOverridden);
  const totalOverrides = itemCalculations.filter(item => item.isOverridden).length;

  return {
    itemCalculations,
    subtotal,
    hasOverrides,
    totalOverrides,
  };
};

/**
 * Get the effective price for an item (considering overrides)
 */
export const getEffectivePrice = (
  item: CartItem,
  priceOverrides: AdminPriceOverrides = {}
): number => {
  return priceOverrides[item.id] ?? item.price;
};

/**
 * Calculate line total for an item (considering overrides)
 */
export const getLineTotal = (
  item: CartItem,
  priceOverrides: AdminPriceOverrides = {}
): number => {
  const effectivePrice = getEffectivePrice(item, priceOverrides);
  return effectivePrice * item.quantity;
};