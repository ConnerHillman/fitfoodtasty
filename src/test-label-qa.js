// Manual QA Test Script for Label Generator
// This tests the functionality without needing UI interaction

import { normalizeStorageInstructions } from './lib/storageInstructionsUtils.js';

// Test 1: Normalization with legacy fields
console.log('=== QA Test 1: Field Normalization ===');

const legacyMeal1 = {
  storage_instructions: 'Legacy storage instruction'
};

const legacyMeal2 = {
  heating_instructions: 'Legacy heating instruction'
};

const legacyMeal3 = {
  storage_heating_instructions: 'Combined legacy instruction'
};

const modernMeal = {
  storageHeatingInstructions: 'Modern canonical instruction'
};

const mixedMeal = {
  storageHeatingInstructions: 'Modern instruction',
  storage_instructions: 'Should be ignored',
  heating_instructions: 'Should be ignored'
};

console.log('Legacy storage_instructions:', normalizeStorageInstructions(legacyMeal1));
console.log('Legacy heating_instructions:', normalizeStorageInstructions(legacyMeal2));
console.log('Legacy storage_heating_instructions:', normalizeStorageInstructions(legacyMeal3));
console.log('Modern storageHeatingInstructions:', normalizeStorageInstructions(modernMeal));
console.log('Mixed fields (should prefer modern):', normalizeStorageInstructions(mixedMeal));

// Test 2: Edge cases
console.log('\n=== QA Test 2: Edge Cases ===');
console.log('Null object:', normalizeStorageInstructions(null));
console.log('Undefined object:', normalizeStorageInstructions(undefined));
console.log('Empty object:', normalizeStorageInstructions({}));
console.log('Empty string:', normalizeStorageInstructions({ storageHeatingInstructions: '' }));
console.log('Whitespace string:', normalizeStorageInstructions({ storageHeatingInstructions: '   ' }));

// Test 3: Character limit validation
console.log('\n=== QA Test 3: Character Limit Validation ===');
const longInstruction = 'X'.repeat(250);
console.log('250 character instruction length:', longInstruction.length);
console.log('Should be truncated by database constraint');

// Test 4: localStorage simulation
console.log('\n=== QA Test 4: localStorage Simulation ===');
const localStorageData = [
  {
    id: '1234567890',
    name: 'Local Storage Meal 1',
    storage_instructions: 'Old field name from localStorage',
    calories: 400
  },
  {
    id: '1234567891', 
    name: 'Local Storage Meal 2',
    storageHeatingInstructions: 'New field name in localStorage',
    calories: 500
  }
];

localStorageData.forEach(meal => {
  console.log(`${meal.name}: ${normalizeStorageInstructions(meal)}`);
});

console.log('\n=== QA Tests Completed ===');