// Centralized validation utilities

/**
 * Email validation
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

/**
 * Phone validation (UK format)
 */
export const isValidUKPhone = (phone: string): boolean => {
  const cleaned = phone.replace(/\D/g, '');
  // UK mobile (07) or landline (01/02) numbers
  return /^(07\d{9}|0[12]\d{9})$/.test(cleaned);
};

/**
 * Postal code validation (UK format)
 */
export const isValidUKPostcode = (postcode: string): boolean => {
  const cleaned = postcode.replace(/\s/g, '').toUpperCase();
  // UK postcode regex
  return /^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i.test(cleaned);
};

/**
 * Required field validation
 */
export const isRequired = (value: string | number | null | undefined): boolean => {
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }
  return value !== null && value !== undefined;
};

/**
 * String length validation
 */
export const hasMinLength = (value: string, minLength: number): boolean => {
  return value.trim().length >= minLength;
};

export const hasMaxLength = (value: string, maxLength: number): boolean => {
  return value.trim().length <= maxLength;
};

/**
 * Number validation
 */
export const isPositiveNumber = (value: number): boolean => {
  return !isNaN(value) && value > 0;
};

export const isValidPrice = (price: number): boolean => {
  return !isNaN(price) && price >= 0 && Number.isFinite(price);
};

/**
 * Date validation
 */
export const isValidDate = (date: string | Date): boolean => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj instanceof Date && !isNaN(dateObj.getTime());
};

export const isFutureDate = (date: string | Date): boolean => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return isValidDate(dateObj) && dateObj > new Date();
};

export const isDateInRange = (date: string | Date, startDate: Date, endDate: Date): boolean => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return isValidDate(dateObj) && dateObj >= startDate && dateObj <= endDate;
};

/**
 * Business-specific validations
 */
export const isValidMealName = (name: string): boolean => {
  return hasMinLength(name, 2) && hasMaxLength(name, 100);
};

export const isValidCustomerName = (name: string): boolean => {
  return hasMinLength(name, 2) && hasMaxLength(name, 50);
};

/**
 * Form validation helper
 */
export interface ValidationError {
  field: string;
  message: string;
}

export const validateCustomerForm = (data: {
  full_name: string;
  email: string;
  phone?: string;
  postal_code?: string;
}): ValidationError[] => {
  const errors: ValidationError[] = [];

  if (!isRequired(data.full_name)) {
    errors.push({ field: 'full_name', message: 'Full name is required' });
  } else if (!isValidCustomerName(data.full_name)) {
    errors.push({ field: 'full_name', message: 'Full name must be between 2 and 50 characters' });
  }

  if (!isRequired(data.email)) {
    errors.push({ field: 'email', message: 'Email is required' });
  } else if (!isValidEmail(data.email)) {
    errors.push({ field: 'email', message: 'Please enter a valid email address' });
  }

  if (data.phone && !isValidUKPhone(data.phone)) {
    errors.push({ field: 'phone', message: 'Please enter a valid UK phone number' });
  }

  if (data.postal_code && !isValidUKPostcode(data.postal_code)) {
    errors.push({ field: 'postal_code', message: 'Please enter a valid UK postcode' });
  }

  return errors;
};

export const validateMealForm = (data: {
  name: string;
  price: number;
  description?: string;
}): ValidationError[] => {
  const errors: ValidationError[] = [];

  if (!isRequired(data.name)) {
    errors.push({ field: 'name', message: 'Meal name is required' });
  } else if (!isValidMealName(data.name)) {
    errors.push({ field: 'name', message: 'Meal name must be between 2 and 100 characters' });
  }

  if (!isValidPrice(data.price)) {
    errors.push({ field: 'price', message: 'Please enter a valid price' });
  }

  if (data.description && hasMaxLength(data.description, 500)) {
    errors.push({ field: 'description', message: 'Description must be under 500 characters' });
  }

  return errors;
};