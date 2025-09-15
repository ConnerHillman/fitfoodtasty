import React from 'react';
import { LabelPrintPreview } from './LabelPrintPreview';
import { LabelDebugTest } from './LabelDebugTest';

// Test component with sample data
export const LabelTestPreview: React.FC = () => {
  // Enhanced test data with Korean Beef Bowl from database
  const testMealProduction = [
    {
      mealId: '1',
      mealName: 'Korean Beef Bowl',
      quantity: 2,
      totalCalories: 482,
      totalProtein: 39,
      totalFat: 9,
      totalCarbs: 63,
      ingredients: 'Basmati Rice (Tilda), Red Chilli, Dark Soy Sauce, Garlic, Garlic Powder, Honey, Lean Beef Mince 5%, Light Soy Sauce, Light Mayo, Spring Onion, Sriracha Sauce, Sweet Chilli Sauce, Tomato Paste, White Onion, White Rice Wine Vinegar',
      allergens: 'Eggs, Milk, Mustard, Soy, Wheat',
      orderCount: 1
    },
    {
      mealId: '2',
      mealName: 'Chipotle Chicken Tagliatelle',
      quantity: 3,
      totalCalories: 361,
      totalProtein: 33,
      totalFat: 10,
      totalCarbs: 35,
      ingredients: 'Chicken Breast, Chipotle Paste, Chorizo, Garlic, Semi-skimmed Milk, Extra Virgin Olive Oil, Red Peppers, Smoked Paprika, Spring Onion, Tagliatelle',
      allergens: 'Milk, Wheat',
      orderCount: 2
    }
  ];

  const testUseByDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  return (
    <div className="p-4 space-y-6">
      <h2 className="text-lg font-bold mb-4">Premium Label Design Test</h2>
      <div className="mb-4 p-4 bg-gradient-to-r from-green-50 to-yellow-50 rounded border-2 border-green-200">
        <h3 className="font-semibold mb-2 text-yellow-700 font-playfair">Enhanced Premium Label Test</h3>
        <ul className="text-sm space-y-1">
          <li>• <strong>Enhanced Readability:</strong> Increased font sizes (7-10px), improved line spacing (1.4-1.5)</li>
          <li>• <strong>Luxury Elements:</strong> Premium gradient, gold accents, Playfair Display font, elegant borders</li>
          <li>• <strong>Optimized Layout:</strong> Centered content, better space utilization, precise 96×50.8mm dimensions</li>
          <li>• <strong>Allergen Highlighting:</strong> Red background highlighting for allergens in ingredients</li>
          <li>• <strong>Real Data:</strong> Korean Beef Bowl with multiple allergens (Eggs, Milk, Mustard, Soy, Wheat)</li>
        </ul>
      </div>
      
      {/* Debug Test Section */}
      <LabelDebugTest />
      
      {/* Print Preview */}
      <LabelPrintPreview 
        mealProduction={testMealProduction} 
        useByDate={testUseByDate}
      />
    </div>
  );
};