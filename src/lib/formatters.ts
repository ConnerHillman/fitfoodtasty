// Centralized formatting utilities for consistent display across the app

/**
 * Currency formatting utilities
 */
export const formatCurrency = (amount: number, currency = 'GBP'): string => {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency,
  }).format(amount);
};

export const formatPrice = (amount: number): string => {
  return `£${amount.toFixed(2)}`;
};

/**
 * Date formatting utilities
 */
export const formatDate = (date: Date | string, options?: Intl.DateTimeFormatOptions): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('en-GB', options);
};

export const formatTime = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleTimeString('en-GB', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
};

export const formatDateTime = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return `${formatDate(dateObj)} ${formatTime(dateObj)}`;
};

export const formatShortDate = (date: Date | string): string => {
  return formatDate(date, {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

export const formatLongDate = (date: Date | string): string => {
  return formatDate(date, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

export const formatMonthYear = (date: Date | string): string => {
  return formatDate(date, {
    year: 'numeric',
    month: 'long'
  });
};

/**
 * Text formatting utilities
 */
export const formatDisplayName = (name: string): string => {
  if (!name) return 'Uncategorized';
  
  // Handle special cases
  const specialCases: Record<string, string> = {
    '(lowcal)': 'Low Cal',
    'all meals (regular size)': 'Regular',
    'massive meals': 'Massive',
  };
  
  if (specialCases[name]) {
    return specialCases[name];
  }
  
  // Convert to title case and clean up
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
    .replace(/[()]/g, '')
    .trim();
};

export const formatPhoneNumber = (phone: string): string => {
  if (!phone) return '';
  
  // Remove all non-digits
  const cleaned = phone.replace(/\D/g, '');
  
  // Format UK mobile numbers
  if (cleaned.length === 11 && cleaned.startsWith('07')) {
    return `${cleaned.slice(0, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8)}`;
  }
  
  // Format UK landlines
  if (cleaned.length === 11 && cleaned.startsWith('01')) {
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
  }
  
  return phone; // Return original if no pattern matches
};

/**
 * Business logic formatters
 */
export const formatOrderStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    'pending': 'Pending',
    'confirmed': 'Confirmed',
    'preparing': 'Preparing',
    'ready': 'Ready',
    'delivered': 'Delivered',
    'cancelled': 'Cancelled',
  };
  
  return statusMap[status] || status;
};

export const formatCustomerSegment = (totalSpent: number, totalOrders: number): string => {
  if (totalSpent > 500) return "VIP";
  if (totalSpent > 200) return "High Value";
  if (totalOrders > 5) return "Loyal";
  return "New";
};

/**
 * Number formatting utilities
 */
export const formatPercentage = (value: number, decimals = 1): string => {
  return `${value.toFixed(decimals)}%`;
};

export const formatWeight = (grams: number): string => {
  if (grams >= 1000) {
    return `${(grams / 1000).toFixed(1)}kg`;
  }
  return `${grams}g`;
};