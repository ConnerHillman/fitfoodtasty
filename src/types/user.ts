// User-related types for better type safety

import type { User } from '@supabase/supabase-js';

/**
 * Extended user metadata interface for customer profiles
 */
export interface UserMetadata {
  first_name?: string;
  last_name?: string;
  full_name?: string; // Deprecated: use first_name + last_name
  delivery_address?: string;
  phone?: string;
  postal_code?: string;
  city?: string;
  county?: string;
  delivery_instructions?: string;
}

/**
 * Get full display name from first_name and last_name
 */
export function getDisplayName(firstName?: string, lastName?: string, fullName?: string): string {
  if (firstName || lastName) {
    return [firstName, lastName].filter(Boolean).join(' ').trim();
  }
  return fullName || '';
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
 * Get first name from user metadata safely
 */
export function getUserFirstName(user: User | null): string | undefined {
  return getUserMetadata(user).first_name;
}

/**
 * Get last name from user metadata safely
 */
export function getUserLastName(user: User | null): string | undefined {
  return getUserMetadata(user).last_name;
}

/**
 * Get full display name from user metadata safely
 */
export function getUserFullName(user: User | null): string {
  const metadata = getUserMetadata(user);
  return getDisplayName(metadata.first_name, metadata.last_name, metadata.full_name);
}

/**
 * Get delivery address from user metadata safely
 */
export function getUserDeliveryAddress(user: User | null): string | undefined {
  return getUserMetadata(user).delivery_address;
}
