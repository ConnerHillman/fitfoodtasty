// User-related types for better type safety

import type { User } from '@supabase/supabase-js';

/**
 * Extended user metadata interface for customer profiles
 */
export interface UserMetadata {
  full_name?: string;
  delivery_address?: string;
  phone?: string;
  postal_code?: string;
  city?: string;
  county?: string;
  delivery_instructions?: string;
}

/**
 * Extended User type with typed metadata
 */
export interface TypedUser extends Omit<User, 'user_metadata'> {
  user_metadata: UserMetadata;
}

/**
 * Type guard to check if user has metadata
 */
export function hasUserMetadata(user: User | null): user is User & { user_metadata: UserMetadata } {
  return user !== null && typeof user.user_metadata === 'object';
}

/**
 * Safely get user metadata with defaults
 */
export function getUserMetadata(user: User | null): UserMetadata {
  if (!user || !user.user_metadata) {
    return {};
  }
  return user.user_metadata as UserMetadata;
}

/**
 * Get full name from user metadata safely
 */
export function getUserFullName(user: User | null): string | undefined {
  return getUserMetadata(user).full_name;
}

/**
 * Get delivery address from user metadata safely
 */
export function getUserDeliveryAddress(user: User | null): string | undefined {
  return getUserMetadata(user).delivery_address;
}
