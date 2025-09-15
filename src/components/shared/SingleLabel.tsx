import React from 'react';
import logoImage from '@/assets/fit-food-tasty-logo.png';

// Unified interface that can handle both data formats
interface SingleLabelProps {
  // LabelData format (from generator)
  data?: {
    mealName: string;
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
    ingredients: string;
    allergens: string;
    useByDate: string;
    storageInstructions?: string;
    heatingInstructions?: string;
  };
  // Individual props format (from report)
  mealName?: string;
  calories?: number;
  protein?: number;
  fat?: number;
  carbs?: number;
  ingredients?: string;
  allergens?: string;
  useByDate?: string;
  storageInstructions?: string;
  heatingInstructions?: string;
}

export const SingleLabel: React.FC<SingleLabelProps> = (props) => {
  // Extract data from either format
  const data = props.data || {
    mealName: props.mealName || '',
    calories: props.calories || 0,
    protein: props.protein || 0,
    fat: props.fat || 0,
    carbs: props.carbs || 0,
    ingredients: props.ingredients || '',
    allergens: props.allergens || '',
    useByDate: props.useByDate || '',
    storageInstructions: props.storageInstructions,
    heatingInstructions: props.heatingInstructions
  };

  // Format ingredients with bullet points and highlight allergens
  const formatIngredients = (ingredientsList: string, allergensList: string) => {
    if (!ingredientsList) return 'Not specified';
    
    const ingredients = ingredientsList.split(', ').map(ing => ing.trim());
    const allergens = allergensList.split(', ').map(all => all.trim().toLowerCase());
    
    return ingredients.map(ingredient => {
      const isAllergen = allergens.some(allergen => 
        ingredient.toLowerCase().includes(allergen) || 
        allergen.includes(ingredient.toLowerCase())
      );
      return isAllergen ? `**${ingredient}**` : ingredient;
    }).map(ing => `• ${ing}`).join('\n');
  };

  // Default instructions if not provided
  const defaultStorageInstructions = 'Store refrigerated below 5°C';
  const defaultHeatingInstructions = 'Microwave 3-4 mins until piping hot';

  const storageText = data.storageInstructions || defaultStorageInstructions;
  const heatingText = data.heatingInstructions || defaultHeatingInstructions;

  return (
    <div 
      className="w-full h-full font-inter relative overflow-hidden"
      style={{
        width: '96mm',
        height: '50.8mm',
        boxSizing: 'border-box',
        background: 'linear-gradient(135deg, #e6ffe6 0%, #ffffff 50%, #f0fff0 100%)',
        border: '1px solid #d4d4d8',
        borderRadius: '2px',
        display: 'flex',
        flexDirection: 'column',
        fontSize: '6px',
        lineHeight: '1.3',
        position: 'relative'
      }}
    >
      {/* Premium Header with larger logo */}
      <div className="text-center px-3 py-2" style={{ backgroundColor: 'rgba(34, 197, 94, 0.05)' }}>
        <div className="flex justify-center mb-1">
          <img 
            src={logoImage} 
            alt="Fit Food Tasty"
            style={{ height: '12mm', width: 'auto', objectFit: 'contain' }}
          />
        </div>
        <h1 className="font-bold text-gray-800 leading-tight mb-1" style={{ fontSize: '11px', fontFamily: 'serif' }}>
          {data.mealName}
        </h1>
        <div className="text-center text-green-600 font-medium italic" style={{ fontSize: '5px', fontFamily: 'serif' }}>
          Fresh, Fit, Flavorful
        </div>
      </div>

      {/* Premium Nutrition Box */}
      <div className="mx-2 mb-2 bg-green-50 border border-green-200 rounded px-2 py-1.5">
        <div className="grid grid-cols-2 gap-1 text-center">
          <div>
            <div className="font-bold text-gray-800" style={{ fontSize: '7px' }}>**{data.calories}**</div>
            <div className="text-gray-600" style={{ fontSize: '5px' }}>CALORIES</div>
          </div>
          <div>
            <div className="font-bold text-gray-800" style={{ fontSize: '7px' }}>**{data.protein}g**</div>
            <div className="text-gray-600" style={{ fontSize: '5px' }}>PROTEIN</div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-1 text-center mt-1">
          <div>
            <div className="font-bold text-gray-800" style={{ fontSize: '7px' }}>**{data.fat}g**</div>
            <div className="text-gray-600" style={{ fontSize: '5px' }}>FAT</div>
          </div>
          <div>
            <div className="font-bold text-gray-800" style={{ fontSize: '7px' }}>**{data.carbs}g**</div>
            <div className="text-gray-600" style={{ fontSize: '5px' }}>CARBS</div>
          </div>
        </div>
      </div>

      {/* Use By Date with Icon */}
      <div className="mx-2 mb-1 bg-yellow-50 border border-yellow-200 rounded px-2 py-1 flex items-center gap-1">
        <div style={{ fontSize: '6px' }}>📅</div>
        <div className="font-bold text-gray-800 leading-tight" style={{ fontSize: '6px' }}>
          USE BY: {data.useByDate ? new Date(data.useByDate).toLocaleDateString('en-GB', {
            weekday: 'short',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          }) : 'Fri, 19/09/2025'}
        </div>
      </div>

      {/* Storage & Heating Instructions with Icon */}
      <div className="mx-2 mb-1 bg-blue-50 border border-blue-200 rounded px-2 py-1">
        <div className="flex items-center gap-1 mb-1">
          <div style={{ fontSize: '6px' }}>🔥</div>
          <div className="text-gray-700 font-medium" style={{ fontSize: '5px' }}>HEATING</div>
        </div>
        <div className="text-gray-600 leading-tight" style={{ fontSize: '5px' }}>
          {heatingText}
        </div>
        <div className="text-gray-600 leading-tight" style={{ fontSize: '5px' }}>
          {storageText}
        </div>
      </div>

      {/* Ingredients Section */}
      <div className="mx-2 mb-1 bg-green-50 border border-green-200 rounded px-2 py-1 flex-1">
        <div className="font-semibold text-gray-800 mb-1" style={{ fontSize: '5px' }}>INGREDIENTS:</div>
        <div className="text-gray-700 leading-tight whitespace-pre-line" style={{ fontSize: '5px', lineHeight: '1.2' }}>
          {formatIngredients(data.ingredients, data.allergens || '')}
        </div>
      </div>

      {/* Allergens Section - Prominent */}
      {data.allergens && (
        <div className="mx-2 mb-1 bg-red-50 border border-red-300 rounded px-2 py-1">
          <div className="font-bold text-red-800 mb-1" style={{ fontSize: '5px' }}>⚠️ ALLERGENS:</div>
          <div className="font-bold text-red-700 leading-tight" style={{ fontSize: '6px' }}>
            {data.allergens.split(', ').map(allergen => allergen.trim().toUpperCase()).join(' • ')}
          </div>
        </div>
      )}

      {/* Premium Footer */}
      <div className="mt-auto bg-gray-50 border-t border-gray-200 px-2 py-1">
        <div className="text-center font-medium text-green-700 leading-tight" style={{ fontSize: '5px' }}>
          www.fitfoodtasty.co.uk
        </div>
      </div>
    </div>
  );
};