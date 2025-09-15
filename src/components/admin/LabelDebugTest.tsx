import React from 'react';
import { SingleLabel } from '@/components/shared/SingleLabel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Test component to debug ingredients display
export const LabelDebugTest: React.FC = () => {
  // Test data with ingredients and allergens
  const testData = {
    mealName: "Korean Beef Bowl",
    calories: 450,
    protein: 28,
    fat: 12,
    carbs: 45,
    ingredients: "Beef, Rice, Carrots, Onions, Soy Sauce, Sesame Oil, Eggs, Milk Powder",
    allergens: "Eggs, Milk, Soy",
    useByDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  };

  // Test data with missing ingredients
  const testDataEmpty = {
    mealName: "Test Meal No Ingredients",
    calories: 300,
    protein: 20,
    fat: 8,
    carbs: 30,
    ingredients: "",
    allergens: "",
    useByDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  };

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Label Ingredients Debug Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Test 1: Label with ingredients and allergens */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Test 1: Korean Beef Bowl with Ingredients & Allergens</h3>
            <div className="p-4 bg-gray-50 rounded">
              <div className="text-sm mb-2">
                <strong>Input Data:</strong><br/>
                Ingredients: "{testData.ingredients}"<br/>
                Allergens: "{testData.allergens}"
              </div>
              <div className="max-w-md">
                <SingleLabel
                  mealName={testData.mealName}
                  calories={testData.calories}
                  protein={testData.protein}
                  fat={testData.fat}
                  carbs={testData.carbs}
                  ingredients={testData.ingredients}
                  allergens={testData.allergens}
                  useByDate={testData.useByDate}
                />
              </div>
            </div>
          </div>

          {/* Test 2: Label with empty ingredients */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Test 2: Empty Ingredients (should show "Not specified")</h3>
            <div className="p-4 bg-gray-50 rounded">
              <div className="text-sm mb-2">
                <strong>Input Data:</strong><br/>
                Ingredients: "{testDataEmpty.ingredients}" (empty)<br/>
                Allergens: "{testDataEmpty.allergens}" (empty)
              </div>
              <div className="max-w-md">
                <SingleLabel
                  mealName={testDataEmpty.mealName}
                  calories={testDataEmpty.calories}
                  protein={testDataEmpty.protein}
                  fat={testDataEmpty.fat}
                  carbs={testDataEmpty.carbs}
                  ingredients={testDataEmpty.ingredients}
                  allergens={testDataEmpty.allergens}
                  useByDate={testDataEmpty.useByDate}
                />
              </div>
            </div>
          </div>

          {/* Debug Information */}
          <div className="mt-6 p-4 bg-blue-50 rounded">
            <h3 className="font-semibold text-blue-800 mb-2">Debug Information</h3>
            <div className="text-sm text-blue-700 space-y-1">
              <div>✓ SingleLabel component loaded successfully</div>
              <div>✓ Test data prepared with ingredients and allergens</div>
              <div>✓ formatIngredients function should process: "{testData.ingredients}"</div>
              <div>✓ Allergens should be highlighted: {testData.allergens.split(', ').join(', ')}</div>
              <div>✓ Font size: 10px for better readability</div>
              <div>✓ Line height: 1.6 for improved spacing</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};