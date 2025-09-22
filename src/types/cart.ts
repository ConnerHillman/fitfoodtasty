// Shared types for cart functionality

export interface CartItem {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  total_fiber: number;
  shelf_life_days: number;
  image_url?: string;
  quantity: number;
  type?: 'meal' | 'package';
  packageData?: {
    packageId: string;
    packageName: string;
    mealCount: number;
    selectedMeals: Record<string, number>;
  };
}

export interface CartContextType {
  items: CartItem[];
  addToCart: (meal: Omit<CartItem, 'quantity'>) => void;
  addPackageToCart: (packageItem: Omit<CartItem, 'quantity'>) => void;
  removeFromCart: (mealId: string) => void;
  updateQuantity: (mealId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  startReorder?: (orderId: string, orderType?: 'package' | 'regular') => Promise<{ success: boolean; needsReplacements?: boolean; unavailableCount?: number; error?: string; message?: string }>;
  reorderData?: {
    originalOrderId: string;
    packageData: any;
    unavailableMeals: any[];
    replacements: Record<string, string>;
  };
  adminOrderData?: {
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    deliveryAddress: string;
    postcode: string;
    deliveryZoneId?: string;
    isNewAccount?: boolean;
    sendEmail?: boolean;
  };
  setAdminOrderData?: (data: CartContextType['adminOrderData']) => void;
  clearAdminOrderData?: () => void;
}

// Simplified cart item for abandoned cart tracking
export interface SimpleCartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface AbandonedCartProps {
  cartItems: SimpleCartItem[];
  total: number;
  customerEmail?: string;
  customerName?: string;
}