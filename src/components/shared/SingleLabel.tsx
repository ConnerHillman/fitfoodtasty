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

  // Enhanced formatting for ingredients with better readability  
  const formatIngredients = (ingredientsList: string, allergensList: string) => {
    console.log('Formatting ingredients:', { ingredientsList, allergensList }); // Debug log
    if (!ingredientsList || ingredientsList.trim() === '') return 'Ingredients not specified';
    
    const ingredients = ingredientsList.split(', ').map(ing => ing.trim()).filter(ing => ing.length > 0);
    const allergens = (allergensList || '').split(', ').map(all => all.trim().toLowerCase()).filter(all => all.length > 0);
    
    console.log('Processed:', { ingredients, allergens }); // Debug log
    
    return ingredients.map(ingredient => {
      const isAllergen = allergens.some(allergen => 
        ingredient.toLowerCase().includes(allergen) || 
        allergen.includes(ingredient.toLowerCase())
      );
      // Enhanced allergen highlighting with better spacing
      return isAllergen ? `**${ingredient}**` : ingredient;
    }).map(ing => `•  ${ing}`).join('\n'); // Added extra space for better readability
  };

  // Default instructions if not provided
  const defaultStorageInstructions = 'Store refrigerated below 5°C';
  const defaultHeatingInstructions = 'Microwave 3-4 mins until piping hot';

  const storageText = data.storageInstructions || defaultStorageInstructions;
  const heatingText = data.heatingInstructions || defaultHeatingInstructions;

  return (
    <div 
      className="w-full h-full font-inter relative overflow-hidden border-2 border-green-200"
      style={{
        width: '96mm',
        height: '50.8mm',
        boxSizing: 'border-box',
        // Enhanced premium gradient
        background: 'linear-gradient(135deg, #e6ffe6 0%, #d4edda 50%, #f8f9f7 100%)',
        borderRadius: '3px',
        display: 'flex',
        flexDirection: 'column',
        fontSize: '7px', // Increased base font size
        lineHeight: '1.4',
        position: 'relative',
        justifyContent: 'center', // Center content to reduce left-side waste
        alignItems: 'stretch'
      }}
    >
      {/* Premium Header with gold accents */}
      <div className="text-center px-2 py-1.5" style={{ backgroundColor: 'rgba(34, 197, 94, 0.08)' }}>
        <div className="flex justify-center mb-1">
          <img 
            src={logoImage} 
            alt="Fit Food Tasty"
            style={{ height: '10mm', width: 'auto', objectFit: 'contain' }}
          />
        </div>
        <h1 className="font-bold text-gray-800 leading-tight mb-1 font-playfair" style={{ fontSize: '10px' }}>
          {data.mealName}
        </h1>
        <div className="text-center text-yellow-700 font-medium italic font-playfair" style={{ fontSize: '6px' }}>
          Fresh, Fit, Flavorful
        </div>
      </div>

      {/* Premium Nutrition Box with gold accents */}
      <div className="mx-2 mb-1.5 bg-gradient-to-r from-green-50 to-yellow-50 border border-green-300 rounded-md px-2 py-1.5">
        <div className="grid grid-cols-2 gap-1 text-center">
          <div>
            <div className="font-bold text-yellow-700" style={{ fontSize: '8px' }}>{data.calories}</div>
            <div className="text-gray-600 font-medium" style={{ fontSize: '6px' }}>CALORIES</div>
          </div>
          <div>
            <div className="font-bold text-yellow-700" style={{ fontSize: '8px' }}>{data.protein}g</div>
            <div className="text-gray-600 font-medium" style={{ fontSize: '6px' }}>PROTEIN</div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-1 text-center mt-1">
          <div>
            <div className="font-bold text-yellow-700" style={{ fontSize: '8px' }}>{data.fat}g</div>
            <div className="text-gray-600 font-medium" style={{ fontSize: '6px' }}>FAT</div>
          </div>
          <div>
            <div className="font-bold text-yellow-700" style={{ fontSize: '8px' }}>{data.carbs}g</div>
            <div className="text-gray-600 font-medium" style={{ fontSize: '6px' }}>CARBS</div>
          </div>
        </div>
      </div>

      {/* Use By Date with enhanced styling */}
      <div className="mx-2 mb-1 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-300 rounded px-2 py-1 flex items-center gap-1.5">
        <div style={{ fontSize: '7px' }}>📅</div>
        <div className="font-bold text-gray-800 leading-relaxed" style={{ fontSize: '7px' }}>
          USE BY: {data.useByDate ? new Date(data.useByDate).toLocaleDateString('en-GB', {
            weekday: 'short',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          }) : 'Fri, 19/09/2025'}
        </div>
      </div>

      {/* Storage & Heating Instructions with enhanced readability */}
      <div className="mx-2 mb-1 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-300 rounded px-2 py-1">
        <div className="flex items-center gap-1.5 mb-1">
          <div style={{ fontSize: '7px' }}>🔥</div>
          <div className="text-gray-700 font-bold" style={{ fontSize: '6px' }}>HEATING & STORAGE</div>
        </div>
        <div className="text-gray-700 leading-relaxed" style={{ fontSize: '6px', lineHeight: '1.3' }}>
          {heatingText}
        </div>
        <div className="text-gray-700 leading-relaxed" style={{ fontSize: '6px', lineHeight: '1.3' }}>
          {storageText}
        </div>
      </div>

      {/* Enhanced Ingredients Section with better readability */}
      <div className="mx-2 mb-1 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-300 rounded px-2 py-1 flex-1">
        <div className="font-bold text-gray-800 mb-1" style={{ fontSize: '6px' }}>INGREDIENTS:</div>
        <div 
          className="text-gray-800 whitespace-pre-line" 
          style={{ 
            fontSize: '12px', // Increased to 12px for premium readability (10-12pt as requested)
            lineHeight: '1.5', // Optimal line spacing
            paddingLeft: '6px', // More padding for bullet points
            fontWeight: '500', // Medium weight for better readability
            minHeight: '20px' // Ensure space even if ingredients are missing
          }}
        >
          {data.ingredients && data.ingredients.trim() ? (
            <div dangerouslySetInnerHTML={{
              __html: formatIngredients(data.ingredients, data.allergens || '')
                .replace(/\*\*(.*?)\*\*/g, '<span style="background: #fef2f2; color: #dc2626; font-weight: bold; padding: 1px 3px; border-radius: 3px;">$1</span>')
            }} />
          ) : (
            <div style={{ color: '#666', fontStyle: 'italic' }}>
              • Ingredients not available
            </div>
          )}
        </div>
      </div>

      {/* Prominent Allergens Section with enhanced styling */}
      {data.allergens && (
        <div className="mx-2 mb-1 bg-gradient-to-r from-red-100 to-pink-100 border-2 border-red-400 rounded px-2 py-1">
          <div className="font-bold text-red-800 mb-1 flex items-center gap-1" style={{ fontSize: '6px' }}>
            <span style={{ fontSize: '7px' }}>⚠️</span>
            <span>ALLERGENS:</span>
          </div>
          <div className="font-bold text-red-700 leading-relaxed" style={{ fontSize: '7px', lineHeight: '1.4' }}>
            {data.allergens.split(', ').map(allergen => allergen.trim().toUpperCase()).join(' • ')}
          </div>
        </div>
      )}

      {/* Premium Footer with gold accent */}
      <div className="mt-auto bg-gradient-to-r from-gray-50 to-green-50 border-t border-green-300 px-2 py-1">
        <div className="text-center font-medium text-yellow-700 leading-tight font-playfair" style={{ fontSize: '6px' }}>
          www.fitfoodtasty.co.uk
        </div>
      </div>
    </div>
  );
};