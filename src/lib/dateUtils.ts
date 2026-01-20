// Centralized date utilities for business logic

import { addDays, format, startOfDay, endOfDay, isValid, parseISO } from 'date-fns';

/**
 * Date generation utilities
 */
export const generateDateFromDays = (days: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

export const generateFutureDates = (count: number, startDaysFromNow = 0): Date[] => {
  const dates: Date[] = [];
  for (let i = startDaysFromNow; i < startDaysFromNow + count; i++) {
    dates.push(addDays(new Date(), i));
  }
  return dates;
};

/**
 * Date range utilities
 */
export const getDateRange = (days: number): { from: Date; to: Date } => {
  const to = new Date();
  const from = addDays(to, -days);
  return { from: startOfDay(from), to: endOfDay(to) };
};

export const getTodayRange = (): { from: Date; to: Date } => {
  const today = new Date();
  return { from: startOfDay(today), to: endOfDay(today) };
};

export const getWeekRange = (): { from: Date; to: Date } => {
  return getDateRange(7);
};

export const getMonthRange = (): { from: Date; to: Date } => {
  return getDateRange(30);
};

/**
 * Day of week utilities
 */
export const getDayOfWeek = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
};

export const isWeekend = (date: Date | string): boolean => {
  const dayOfWeek = getDayOfWeek(date);
  return dayOfWeek === 'saturday' || dayOfWeek === 'sunday';
};

export const isToday = (date: Date | string): boolean => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  return dateObj.toDateString() === today.toDateString();
};

/**
 * Business day calculations
 */
export const getNextBusinessDay = (from: Date = new Date()): Date => {
  let nextDay = addDays(from, 1);
  while (isWeekend(nextDay)) {
    nextDay = addDays(nextDay, 1);
  }
  return nextDay;
};

export const addBusinessDays = (from: Date, days: number): Date => {
  let result = from;
  let addedDays = 0;
  
  while (addedDays < days) {
    result = addDays(result, 1);
    if (!isWeekend(result)) {
      addedDays++;
    }
  }
  
  return result;
};

/**
 * Use by date calculations for labels
 */
export const calculateUseByDate = (collectionDate: Date, shelfLifeDays = 5): string => {
  const useByDate = addDays(collectionDate, shelfLifeDays);
  return format(useByDate, 'yyyy-MM-dd');
};

/**
 * Order cutoff calculations
 */
export const isOrderCutoffPassed = (
  cutoffDay: string, 
  cutoffTime: string, 
  targetDate: Date
): boolean => {
  const now = new Date();
  const currentDayOfWeek = getDayOfWeek(now);
  
  // Convert cutoff day to index (0 = Sunday)
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const cutoffDayIndex = dayNames.indexOf(cutoffDay.toLowerCase());
  const currentDayIndex = dayNames.indexOf(currentDayOfWeek);
  
  // If we're past the cutoff day in the week
  if (currentDayIndex > cutoffDayIndex) {
    return true;
  }
  
  // If it's the cutoff day, check the time
  if (currentDayIndex === cutoffDayIndex) {
    const [hours, minutes] = cutoffTime.split(':').map(Number);
    const cutoffDateTime = new Date(now);
    cutoffDateTime.setHours(hours, minutes, 0, 0);
    
    return now > cutoffDateTime;
  }
  
  return false;
};

/**
 * Date difference calculations
 */
export const daysBetween = (date1: Date | string, date2: Date | string): number => {
  const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
  const d2 = typeof date2 === 'string' ? new Date(date2) : date2;
  
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const isRecentDate = (date: Date | string, daysThreshold = 30): boolean => {
  const daysDiff = daysBetween(new Date(), date);
  return daysDiff <= daysThreshold;
};

/**
 * Kitchen date utilities with timezone awareness
 */

/**
 * Validates if a date string or Date object is valid (handles null/undefined)
 */
export function isValidDateInput(date: string | Date | null | undefined): boolean {
  if (!date) return false;
  
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return isValid(dateObj);
  } catch {
    return false;
  }
}

/**
 * Safely converts a date string to Date object with validation
 */
export function safeParseDate(dateString: string | null | undefined, fallback?: Date): Date | null {
  if (!dateString) return fallback || null;
  
  try {
    // Try parsing as ISO string first
    let parsed = parseISO(dateString);
    if (isValid(parsed)) return parsed;
    
    // Try parsing as Date constructor
    parsed = new Date(dateString);
    if (isValid(parsed)) return parsed;
    
    return fallback || null;
  } catch (error) {
    console.warn(`[DateUtils] Failed to parse date: ${dateString}`, error);
    return fallback || null;
  }
}

/**
 * Compares two dates for same day using local comparison to avoid timezone issues
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  if (!isValid(date1) || !isValid(date2)) return false;
  
  // Compare local dates to avoid timezone shifting midnight to previous day
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
}

/**
 * Checks if an order matches a specific collection/delivery date
 * Uses requested_delivery_date as the primary field
 */
export function matchesCollectionDate(
  order: { requested_delivery_date?: string | null; created_at: string; id: string },
  targetDate: Date
): boolean {
  // Validate target date
  if (!isValid(targetDate)) {
    console.warn(`[DateUtils] Invalid target date provided`);
    return false;
  }

  // Primary: Use requested_delivery_date if available and valid
  if (order.requested_delivery_date) {
    const deliveryDate = safeParseDate(order.requested_delivery_date);
    if (deliveryDate) {
      const matches = isSameDay(deliveryDate, targetDate);
      if (matches) {
        console.log(`[DateUtils] Order ${order.id} matched by requested_delivery_date`);
      }
      return matches;
    } else {
      console.warn(`[DateUtils] Order ${order.id} has invalid requested_delivery_date: ${order.requested_delivery_date}`);
    }
  }

  // Fallback: Use created_at if requested_delivery_date is missing or invalid
  const createdDate = safeParseDate(order.created_at);
  if (createdDate) {
    const matches = isSameDay(createdDate, targetDate);
    if (matches) {
      console.log(`[DateUtils] Order ${order.id} matched by created_at fallback`);
    }
    return matches;
  } else {
    console.error(`[DateUtils] Order ${order.id} has invalid created_at: ${order.created_at}`);
    return false;
  }
}

/**
 * Filters orders by collection/delivery date with comprehensive validation
 */
export function filterOrdersByCollectionDate<T extends { 
  requested_delivery_date?: string | null; 
  created_at: string; 
  id: string 
}>(orders: T[], targetDate: Date): T[] {
  if (!isValid(targetDate)) {
    console.error(`[DateUtils] Invalid target date for filtering orders`);
    return [];
  }

  const validOrders = orders.filter(order => {
    if (!order.id) {
      console.warn(`[DateUtils] Order missing ID, skipping`);
      return false;
    }
    
    if (!order.created_at) {
      console.warn(`[DateUtils] Order ${order.id} missing created_at, skipping`);
      return false;
    }

    return matchesCollectionDate(order, targetDate);
  });

  console.log(`[DateUtils] Filtered ${validOrders.length}/${orders.length} orders for date ${targetDate.toISOString().split('T')[0]}`);
  return validOrders;
}