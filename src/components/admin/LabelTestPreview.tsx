import React from 'react';
import { LabelPrintPreview } from './LabelPrintPreview';

// Test component with sample data
export const LabelTestPreview: React.FC = () => {
  // Sample meal production data with allergens
  const testMealProduction = [
    {
      mealId: '1',
      mealName: 'Chipotle Chicken Tagliatelle',
      quantity: 3,
      totalCalories: 450,
      totalProtein: 35,
      totalFat: 12,
      totalCarbs: 45,
      ingredients: 'Chicken Breast, Chipotle Paste, Chorizo, Garlic, Semi-skimmed Milk, Extra Virgin Olive Oil, Red Peppers, Smoked Paprika, Spring Onion, Tagliatelle',
      allergens: 'Milk, Wheat',
      orderCount: 2
    },
    {
      mealId: '2',
      mealName: 'Korean Beef Bowl',
      quantity: 2,
      totalCalories: 520,
      totalProtein: 28,
      totalFat: 18,
      totalCarbs: 55,
      ingredients: 'Basmati Rice, Red Chilli, Dark Soy Sauce, Garlic, Garlic Powder, Honey, Lean Beef Mince 5%, Light Soy Sauce, Light Mayo, Spring Onion, Sriracha Sauce, Sweet Chilli Sauce, Tomato Paste, White Onion, White Rice Wine Vinegar',
      allergens: 'Eggs, Milk, Mustard, Soy, Wheat',
      orderCount: 1
    }
  ];

  const testUseByDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  return (
    <div className="p-4">
      <h2 className="text-lg font-bold mb-4">Premium Label Design Test</h2>
      <div className="mb-4 p-4 bg-green-50 rounded border">
        <h3 className="font-semibold mb-2">Test Summary:</h3>
        <ul className="text-sm space-y-1">
          <li>• Testing premium label design with gradient backgrounds</li>
          <li>• Allergens properly highlighted in red warning boxes</li>
          <li>• Ingredients formatted with bullet points</li>
          <li>• Icons for use-by date and heating instructions</li>
          <li>• Labels fit 96mm × 50.8mm specification</li>
        </ul>
      </div>
      <LabelPrintPreview 
        mealProduction={testMealProduction} 
        useByDate={testUseByDate}
      />
    </div>
  );
};