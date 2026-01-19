/**
 * Customer data validation and sanitization utilities
 */

// Validation constants
export const VALIDATION_RULES = {
  firstName: {
    minLength: 1,
    maxLength: 50,
    pattern: /^[a-zA-Z\s\-'\.]+$/
  },
  lastName: {
    minLength: 1,
    maxLength: 50,
    pattern: /^[a-zA-Z\s\-'\.]+$/
  },
  fullName: {
    minLength: 2,
    maxLength: 100,
    pattern: /^[a-zA-Z\s\-'\.]+$/
  },
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    maxLength: 254
  },
  phone: {
    pattern: /^[\+]?[\d\s\-\(\)]{7,20}$/,
    maxLength: 25
  },
  postalCode: {
    pattern: /^[A-Z]{1,2}[0-9R][0-9A-Z]?\s?[0-9][ABD-HJLNP-UW-Z]{2}$/i, // UK postcode
    maxLength: 10
  },
  address: {
    maxLength: 255
  },
  city: {
    maxLength: 100,
    pattern: /^[a-zA-Z\s\-'\.]+$/
  },
  county: {
    maxLength: 100,
    pattern: /^[a-zA-Z\s\-'\.]+$/
  }
} as const;

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  sanitizedData?: any;
}

/**
 * Sanitizes a string by removing potentially harmful characters
 */
export function sanitizeString(input: string): string {
  if (!input) return '';
  
  return input
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .substring(0, 1000); // Limit length
}

/**
 * Validates an email address
 */
export function validateEmail(email: string): ValidationError | null {
  const sanitized = sanitizeString(email).toLowerCase();
  
  if (!sanitized) {
    return { field: 'email', message: 'Email is required', code: 'REQUIRED' };
  }
  
  if (sanitized.length > VALIDATION_RULES.email.maxLength) {
    return { field: 'email', message: 'Email is too long', code: 'TOO_LONG' };
  }
  
  if (!VALIDATION_RULES.email.pattern.test(sanitized)) {
    return { field: 'email', message: 'Please enter a valid email address', code: 'INVALID_FORMAT' };
  }
  
  return null;
}

/**
 * Validates a first name
 */
export function validateFirstName(name: string): ValidationError | null {
  const sanitized = sanitizeString(name);
  
  if (!sanitized) {
    return { field: 'first_name', message: 'First name is required', code: 'REQUIRED' };
  }
  
  if (sanitized.length < VALIDATION_RULES.firstName.minLength) {
    return { field: 'first_name', message: 'First name is too short', code: 'TOO_SHORT' };
  }
  
  if (sanitized.length > VALIDATION_RULES.firstName.maxLength) {
    return { field: 'first_name', message: 'First name is too long', code: 'TOO_LONG' };
  }
  
  if (!VALIDATION_RULES.firstName.pattern.test(sanitized)) {
    return { field: 'first_name', message: 'First name contains invalid characters', code: 'INVALID_FORMAT' };
  }
  
  return null;
}

/**
 * Validates a last name
 */
export function validateLastName(name: string): ValidationError | null {
  const sanitized = sanitizeString(name);
  
  if (!sanitized) {
    return { field: 'last_name', message: 'Last name is required', code: 'REQUIRED' };
  }
  
  if (sanitized.length < VALIDATION_RULES.lastName.minLength) {
    return { field: 'last_name', message: 'Last name is too short', code: 'TOO_SHORT' };
  }
  
  if (sanitized.length > VALIDATION_RULES.lastName.maxLength) {
    return { field: 'last_name', message: 'Last name is too long', code: 'TOO_LONG' };
  }
  
  if (!VALIDATION_RULES.lastName.pattern.test(sanitized)) {
    return { field: 'last_name', message: 'Last name contains invalid characters', code: 'INVALID_FORMAT' };
  }
  
  return null;
}

/**
 * Validates a full name (for backward compatibility)
 */
export function validateFullName(name: string): ValidationError | null {
  const sanitized = sanitizeString(name);
  
  if (!sanitized) {
    return { field: 'full_name', message: 'Full name is required', code: 'REQUIRED' };
  }
  
  if (sanitized.length < VALIDATION_RULES.fullName.minLength) {
    return { field: 'full_name', message: 'Name is too short', code: 'TOO_SHORT' };
  }
  
  if (sanitized.length > VALIDATION_RULES.fullName.maxLength) {
    return { field: 'full_name', message: 'Name is too long', code: 'TOO_LONG' };
  }
  
  if (!VALIDATION_RULES.fullName.pattern.test(sanitized)) {
    return { field: 'full_name', message: 'Name contains invalid characters', code: 'INVALID_FORMAT' };
  }
  
  return null;
}

/**
 * Normalizes a phone number for storage (removes formatting)
 */
export function normalizePhoneNumber(phone: string): string {
  if (!phone) return '';
  return sanitizeString(phone).replace(/[\s\-\(\)]/g, '');
}

/**
 * Validates a phone number (supports international formats)
 */
export function validatePhone(phone: string): ValidationError | null {
  if (!phone) return null; // Phone is optional
  
  const sanitized = sanitizeString(phone);
  
  if (sanitized.length > VALIDATION_RULES.phone.maxLength) {
    return { field: 'phone', message: 'Phone number is too long', code: 'TOO_LONG' };
  }
  
  if (!VALIDATION_RULES.phone.pattern.test(sanitized)) {
    return { 
      field: 'phone', 
      message: 'Please enter a valid phone number (e.g., +44 7123 456789 or 07123 456789)', 
      code: 'INVALID_FORMAT' 
    };
  }
  
  return null;
}

/**
 * Validates a UK postal code
 */
export function validatePostalCode(postalCode: string): ValidationError | null {
  if (!postalCode) return null; // Postal code is optional
  
  const sanitized = sanitizeString(postalCode).toUpperCase().replace(/\s/g, '');
  
  if (sanitized.length > VALIDATION_RULES.postalCode.maxLength) {
    return { field: 'postal_code', message: 'Postal code is too long', code: 'TOO_LONG' };
  }
  
  if (!VALIDATION_RULES.postalCode.pattern.test(sanitized)) {
    return { field: 'postal_code', message: 'Please enter a valid UK postal code', code: 'INVALID_FORMAT' };
  }
  
  return null;
}

/**
 * Validates customer form data with first_name and last_name
 */
export function validateCustomerData(data: {
  first_name?: string;
  last_name?: string;
  full_name?: string; // For backward compatibility
  email: string;
  phone?: string;
  delivery_address?: string;
  city?: string;
  postal_code?: string;
  county?: string;
  delivery_instructions?: string;
}): ValidationResult {
  const errors: ValidationError[] = [];
  
  // Validate name fields - prefer first_name/last_name, fall back to full_name
  if (data.first_name !== undefined || data.last_name !== undefined) {
    const firstNameError = validateFirstName(data.first_name || '');
    if (firstNameError) errors.push(firstNameError);
    
    const lastNameError = validateLastName(data.last_name || '');
    if (lastNameError) errors.push(lastNameError);
  } else if (data.full_name !== undefined) {
    // Backward compatibility: validate full_name if first/last not provided
    const nameError = validateFullName(data.full_name);
    if (nameError) errors.push(nameError);
  } else {
    errors.push({ field: 'first_name', message: 'First name is required', code: 'REQUIRED' });
    errors.push({ field: 'last_name', message: 'Last name is required', code: 'REQUIRED' });
  }
  
  const emailError = validateEmail(data.email);
  if (emailError) errors.push(emailError);
  
  // Validate optional fields
  const phoneError = validatePhone(data.phone || '');
  if (phoneError) errors.push(phoneError);
  
  const postalCodeError = validatePostalCode(data.postal_code || '');
  if (postalCodeError) errors.push(postalCodeError);
  
  // Validate text length limits
  if (data.delivery_address && data.delivery_address.length > VALIDATION_RULES.address.maxLength) {
    errors.push({ field: 'delivery_address', message: 'Address is too long', code: 'TOO_LONG' });
  }
  
  if (data.city && data.city.length > VALIDATION_RULES.city.maxLength) {
    errors.push({ field: 'city', message: 'City name is too long', code: 'TOO_LONG' });
  }
  
  if (data.county && data.county.length > VALIDATION_RULES.county.maxLength) {
    errors.push({ field: 'county', message: 'County name is too long', code: 'TOO_LONG' });
  }
  
  // Validate city/county format if provided
  if (data.city && !VALIDATION_RULES.city.pattern.test(data.city)) {
    errors.push({ field: 'city', message: 'City contains invalid characters', code: 'INVALID_FORMAT' });
  }
  
  if (data.county && !VALIDATION_RULES.county.pattern.test(data.county)) {
    errors.push({ field: 'county', message: 'County contains invalid characters', code: 'INVALID_FORMAT' });
  }

  // Compute full_name from first_name and last_name
  const computedFullName = data.first_name || data.last_name 
    ? [data.first_name, data.last_name].filter(Boolean).join(' ').trim()
    : data.full_name;
  
  // Sanitize all data
  const sanitizedData = {
    first_name: data.first_name ? sanitizeString(data.first_name) : '',
    last_name: data.last_name ? sanitizeString(data.last_name) : '',
    full_name: computedFullName ? sanitizeString(computedFullName) : '',
    email: sanitizeString(data.email).toLowerCase(),
    phone: data.phone ? normalizePhoneNumber(data.phone) : '',
    delivery_address: data.delivery_address ? sanitizeString(data.delivery_address) : '',
    city: data.city ? sanitizeString(data.city) : '',
    postal_code: data.postal_code ? sanitizeString(data.postal_code).toUpperCase().replace(/\s/g, '') : '',
    county: data.county ? sanitizeString(data.county) : '',
    delivery_instructions: data.delivery_instructions ? sanitizeString(data.delivery_instructions) : '',
  };
  
  return {
    isValid: errors.length === 0,
    errors,
    sanitizedData: errors.length === 0 ? sanitizedData : undefined
  };
}

/**
 * Sanitizes customer display data to prevent XSS
 */
export function sanitizeCustomerForDisplay(customer: any): any {
  return {
    ...customer,
    first_name: sanitizeString(customer.first_name || ''),
    last_name: sanitizeString(customer.last_name || ''),
    full_name: sanitizeString(customer.full_name || ''),
    email: sanitizeString(customer.email || ''),
    phone: sanitizeString(customer.phone || ''),
    delivery_address: sanitizeString(customer.delivery_address || ''),
    city: sanitizeString(customer.city || ''),
    postal_code: sanitizeString(customer.postal_code || ''),
    county: sanitizeString(customer.county || ''),
    delivery_instructions: sanitizeString(customer.delivery_instructions || ''),
  };
}

/**
 * Helper to get display name from customer data
 */
export function getDisplayName(firstName?: string, lastName?: string, fullName?: string): string {
  if (firstName || lastName) {
    return [firstName, lastName].filter(Boolean).join(' ').trim();
  }
  return fullName || 'Unknown';
}