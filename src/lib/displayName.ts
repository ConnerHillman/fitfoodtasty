/**
 * Centralized display name utility for safe name rendering
 * This handles all edge cases for OAuth users, missing names, etc.
 */

export interface NameFields {
  first_name?: string | null;
  last_name?: string | null;
  full_name?: string | null;
  email?: string | null;
}

/**
 * Get a safe display name from various name fields
 * Priority: (first + last) → full_name → email prefix → fallback
 * 
 * @param fields - Object containing name fields
 * @param fallback - Fallback text when no name is available (default: "Customer")
 * @returns A safe display name that's never empty/undefined
 */
export function getDisplayName(fields: NameFields, fallback: string = 'Customer'): string {
  const { first_name, last_name, full_name, email } = fields;
  
  // Priority 1: Combine first + last name if available
  const firstName = first_name?.trim() || '';
  const lastName = last_name?.trim() || '';
  
  if (firstName || lastName) {
    return [firstName, lastName].filter(Boolean).join(' ');
  }
  
  // Priority 2: Use full_name if available
  if (full_name?.trim()) {
    return full_name.trim();
  }
  
  // Priority 3: Extract name from email (before @)
  if (email?.trim()) {
    const emailPrefix = email.split('@')[0];
    // Make it more readable: replace dots/underscores with spaces, capitalize
    const readable = emailPrefix
      .replace(/[._]/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());
    return readable;
  }
  
  // Priority 4: Return fallback
  return fallback;
}

/**
 * Get first name only (for greetings)
 * Falls back to display name if first name not available
 */
export function getFirstNameOnly(fields: NameFields, fallback: string = 'there'): string {
  if (fields.first_name?.trim()) {
    return fields.first_name.trim();
  }
  
  // Try to get first word from full_name
  if (fields.full_name?.trim()) {
    const firstName = fields.full_name.trim().split(' ')[0];
    if (firstName) return firstName;
  }
  
  return fallback;
}

/**
 * Check if a user has a complete name (first AND last)
 */
export function hasCompleteName(fields: NameFields): boolean {
  return !!(fields.first_name?.trim() && fields.last_name?.trim());
}

/**
 * Check if a user has any name at all
 */
export function hasAnyName(fields: NameFields): boolean {
  return !!(
    fields.first_name?.trim() || 
    fields.last_name?.trim() || 
    fields.full_name?.trim()
  );
}

/**
 * Get initials from name fields (for avatars)
 */
export function getInitials(fields: NameFields, maxChars: number = 2): string {
  const { first_name, last_name, full_name, email } = fields;
  
  // Priority 1: First letter of first and last name
  if (first_name?.trim() && last_name?.trim()) {
    return (first_name[0] + last_name[0]).toUpperCase();
  }
  
  // Priority 2: First letters from full_name words
  if (full_name?.trim()) {
    const words = full_name.trim().split(/\s+/);
    return words
      .slice(0, maxChars)
      .map(w => w[0])
      .join('')
      .toUpperCase();
  }
  
  // Priority 3: First letter of first_name only
  if (first_name?.trim()) {
    return first_name[0].toUpperCase();
  }
  
  // Priority 4: First letter of email
  if (email?.trim()) {
    return email[0].toUpperCase();
  }
  
  return '?';
}
