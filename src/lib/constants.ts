/**
 * Application-wide constants
 * Extracted from various files to avoid magic numbers
 */

// Gift Card Limits
export const GIFT_CARD_MIN_AMOUNT = 10;
export const GIFT_CARD_MAX_AMOUNT = 500;

// Cache & Fetch Settings
export const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
export const FETCH_COOLDOWN_MS = 100;

// Pagination
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// Debounce Timing
export const SEARCH_DEBOUNCE_MS = 300;
export const INPUT_DEBOUNCE_MS = 150;

// Date/Time
export const DAYS_OF_WEEK = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;

// Validation
export const MAX_ORDER_NOTES_LENGTH = 500;
export const MAX_CUSTOMER_NAME_LENGTH = 100;
export const MAX_EMAIL_LENGTH = 255;
