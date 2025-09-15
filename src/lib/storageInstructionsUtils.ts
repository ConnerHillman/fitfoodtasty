// Utility functions for backwards-compatible storage instruction field handling
import { DEFAULT_INSTRUCTIONS } from '@/types/label';

// Type for objects that might have any of the old field names
export interface LegacyStorageFields {
  storage_instructions?: string;
  heating_instructions?: string;
  storageHeatingInstructions?: string;
  storage_heating_instructions?: string;
}

/**
 * Normalizes storage instruction fields to the canonical storageHeatingInstructions
 * Provides backwards compatibility for old field names and handles edge cases
 */
export function normalizeStorageInstructions(obj: LegacyStorageFields): string {
  // Handle null/undefined objects
  if (!obj) return DEFAULT_INSTRUCTIONS.storageHeating;
  
  // Priority order: new canonical name first, then consolidated field, then legacy fields
  const instruction = obj.storageHeatingInstructions || 
                     obj.storage_heating_instructions || 
                     obj.storage_instructions || 
                     obj.heating_instructions;
  
  // Return the instruction if it exists and is not empty, otherwise use default
  return (instruction && instruction.trim()) ? instruction.trim() : DEFAULT_INSTRUCTIONS.storageHeating;
}

/**
 * Creates an object with the canonical field name for saving
 */
export function createStorageInstructionsSaveObject(instructions: string) {
  return {
    storageHeatingInstructions: instructions
  };
}

/**
 * Gets storage instructions from localStorage with backwards compatibility
 */
export function getStorageInstructionsFromSavedMeal(meal: any): string {
  return normalizeStorageInstructions(meal);
}