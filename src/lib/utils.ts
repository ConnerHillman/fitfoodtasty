import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Re-export utility functions for easy access
export * from './formatters';
export * from './validators';
export * from './dateUtils';
