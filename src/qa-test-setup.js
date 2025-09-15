// QA Test Data Setup for Label Generator
// Run this in browser console to set up test scenarios

console.log('🧪 Setting up QA Test Data...');

// Test 1: UI Interaction Test Data
const uiTestMeal = {
    mealName: 'QA UI Test Meal',
    calories: 450,
    protein: 25,
    fat: 15,
    carbs: 30,
    ingredients: 'Chicken breast, jasmine rice, mixed vegetables, teriyaki sauce',
    allergens: 'Soy, Gluten',
    storageHeatingInstructions: 'Store in refrigerator below 5°C. Remove film and heat in microwave for 3-4 minutes until piping hot.',
    useByDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    quantity: 10
};

// Test 2: Network Fallback - localStorage Data
const localStorageFallbackData = [
    {
        id: '1737940000000', // Timestamp-based ID
        name: 'LocalStorage Fallback Test Meal',
        calories: 380,
        protein: 22,
        fat: 14,
        carbs: 28,
        ingredients: 'Beef, potatoes, carrots, onions',
        allergens: 'None',
        storageHeatingInstructions: 'Keep refrigerated. Microwave for 4 minutes, stir, then heat for additional 1-2 minutes.'
    }
];

// Test 3: Mixed Data - Both Storage Types
const mixedStorageData = [
    {
        id: '1737941000000',
        name: 'Mixed Storage Test 1 (Modern Format)',
        calories: 420,
        protein: 28,
        fat: 16,
        carbs: 22,
        ingredients: 'Salmon, quinoa, asparagus, lemon butter',
        allergens: 'Fish, Milk',
        storageHeatingInstructions: 'Store below 5°C. Heat thoroughly until steaming hot throughout.'
    },
    {
        id: '1737942000000',
        name: 'Mixed Storage Test 2 (Legacy Format)',
        calories: 350,
        protein: 18,
        fat: 12,
        carbs: 32,
        ingredients: 'Turkey, sweet potato, green beans, gravy',
        allergens: 'Gluten',
        storage_instructions: 'Keep in refrigerator',
        heating_instructions: 'Microwave for 3-4 minutes'
    }
];

// Test 4: Legacy Migration Data
const legacyMigrationData = [
    {
        id: '1737943000000',
        name: 'Legacy Test - Old Storage Field',
        calories: 390,
        protein: 20,
        fat: 13,
        carbs: 35,
        ingredients: 'Pork, rice, vegetables',
        allergens: 'Soy',
        storage_instructions: 'Store in fridge below 5°C for up to 5 days'
    },
    {
        id: '1737944000000', 
        name: 'Legacy Test - Old Heating Field',
        calories: 410,
        protein: 24,
        fat: 15,
        carbs: 26,
        ingredients: 'Chicken, pasta, mushroom sauce',
        allergens: 'Gluten, Milk',
        heating_instructions: 'Pierce film, heat for 4 minutes until piping hot'
    },
    {
        id: '1737945000000',
        name: 'Legacy Test - Combined Field',
        calories: 370,
        protein: 19,
        fat: 11,
        carbs: 33,
        ingredients: 'Lamb, couscous, roasted vegetables',
        allergens: 'None',
        storage_heating_instructions: 'Store refrigerated. Heat thoroughly in microwave for 3-4 minutes.'
    }
];

// Test 5: Character Limit Test Data
const charLimitTestData = [
    {
        id: '1737946000000',
        name: 'Character Limit Test (Over 200)',
        calories: 400,
        protein: 21,
        fat: 14,
        carbs: 29,
        ingredients: 'Test ingredients',
        allergens: 'Test allergens',
        storageHeatingInstructions: 'This is a very long instruction that exceeds 200 characters to test the database constraint enforcement. ' +
            'It should be truncated or rejected when saving to Supabase. This text is intentionally verbose to test the limits. ' +
            'Additional text to ensure we exceed the 200 character limit by a significant margin for proper testing of constraint handling.'
    }
];

// Setup functions
window.setupQATest = {
    // Test 1: UI Interaction
    setupUITest: function() {
        console.log('✅ UI Test Setup: Test meal data prepared');
        console.log('📝 Manual Action Required: Fill form with this data and test save/load:');
        console.table(uiTestMeal);
        return uiTestMeal;
    },

    // Test 2: Network Fallback
    setupNetworkFallback: function() {
        localStorage.setItem('fitfoodtasty_saved_meals', JSON.stringify(localStorageFallbackData));
        console.log('✅ Network Fallback Setup: localStorage data saved');
        console.log('📝 Manual Action Required: Block network/Supabase and test load functionality');
        console.log('Expected: Should load from localStorage with toast: "Loading meals from local storage"');
        return localStorageFallbackData;
    },

    // Test 3: Mixed Data
    setupMixedData: function() {
        localStorage.setItem('fitfoodtasty_saved_meals', JSON.stringify(mixedStorageData));
        console.log('✅ Mixed Data Setup: Both modern and legacy format data saved to localStorage');
        console.log('📝 Manual Action Required: Load saved meals and verify both appear with normalized instructions');
        console.log('Expected: Both meals should load with properly normalized storageHeatingInstructions');
        return mixedStorageData;
    },

    // Test 4: Legacy Migration
    setupLegacyMigration: function() {
        localStorage.setItem('fitfoodtasty_saved_meals', JSON.stringify(legacyMigrationData));
        console.log('✅ Legacy Migration Setup: Old format data saved');
        console.log('📝 Manual Action Required: Load saved meals and check instruction normalization');
        console.log('Expected: All legacy fields should be normalized to storageHeatingInstructions with proper fallback to defaults');
        return legacyMigrationData;
    },

    // Test 5: Character Limit
    setupCharacterLimit: function() {
        localStorage.setItem('fitfoodtasty_saved_meals', JSON.stringify(charLimitTestData));
        console.log('✅ Character Limit Setup: 250+ character instruction data saved');
        console.log(`📏 Instruction length: ${charLimitTestData[0].storageHeatingInstructions.length} characters`);
        console.log('📝 Manual Action Required: Try to save this meal to Supabase');
        console.log('Expected: Should be truncated to 200 chars or show database error');
        return charLimitTestData;
    },

    // Run all setup
    setupAll: function() {
        console.log('🚀 Running All QA Test Setups...\n');
        this.setupUITest();
        this.setupNetworkFallback();
        this.setupMixedData();
        this.setupLegacyMigration();
        this.setupCharacterLimit();
        console.log('\n✨ All QA test data prepared! Ready for manual testing.');
    },

    // Clear all test data
    clearAll: function() {
        localStorage.removeItem('fitfoodtasty_saved_meals');
        console.log('🧹 All test data cleared from localStorage');
    }
};

// Auto-run setup
console.log('🎯 QA Test Suite Ready!');
console.log('Run: setupQATest.setupAll() to prepare all tests');
console.log('Run: setupQATest.clearAll() to clean up');

// Export for manual testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.setupQATest;
}