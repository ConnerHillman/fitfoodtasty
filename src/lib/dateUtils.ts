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
export const calculateUseByDate = (productionDate: Date, shelfLifeDays = 5): string => {
  const useByDate = addDays(productionDate, shelfLifeDays);
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
 * Kitchen production date utilities with timezone awareness
 */

/**
 * Validates if a date string or Date object is valid
 */
export function isValidProductionDate(date: string | Date | null | undefined): boolean {
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
 * Compares two dates for same day using UTC to avoid timezone issues
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  if (!isValid(date1) || !isValid(date2)) return false;
  
  // Convert to UTC strings for comparison to avoid timezone issues
  const utc1 = date1.toISOString().split('T')[0];
  const utc2 = date2.toISOString().split('T')[0];
  
  return utc1 === utc2;
}

/**
 * Checks if an order matches a specific production date with fallback logic
 */
export function matchesProductionDate(
  order: { production_date?: string | null; created_at: string; id: string },
  targetDate: Date
): boolean {
  // Validate target date
  if (!isValid(targetDate)) {
    console.warn(`[DateUtils] Invalid target date provided`);
    return false;
  }

  // Primary: Use production_date if available and valid
  if (order.production_date) {
    const productionDate = safeParseDate(order.production_date);
    if (productionDate) {
      const matches = isSameDay(productionDate, targetDate);
      if (matches) {
        console.log(`[DateUtils] Order ${order.id} matched by production_date`);
      }
      return matches;
    } else {
      console.warn(`[DateUtils] Order ${order.id} has invalid production_date: ${order.production_date}`);
    }
  }

  // Fallback: Use created_at if production_date is missing or invalid
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
 * Filters orders by production date with comprehensive validation
 */
export function filterOrdersByProductionDate<T extends { 
  production_date?: string | null; 
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

    return matchesProductionDate(order, targetDate);
  });

  console.log(`[DateUtils] Filtered ${validOrders.length}/${orders.length} orders for date ${targetDate.toISOString().split('T')[0]}`);
  return validOrders;
}