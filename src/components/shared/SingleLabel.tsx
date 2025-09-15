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

  // Default instructions if not provided
  const defaultStorageInstructions = 'Store in refrigerator below 5°C';
  const defaultHeatingInstructions = 'Pierce film and heat for 3-4 minutes or until piping hot';

  const storageText = data.storageInstructions || defaultStorageInstructions;
  const heatingText = data.heatingInstructions || defaultHeatingInstructions;

  return (
    <div 
      className="label-component"
      style={{
        width: '96mm',
        height: '50.8mm',
        backgroundColor: '#ffffff',
        border: '1px solid #ddd',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'Arial, sans-serif',
        fontSize: '8px',
        lineHeight: '1.2',
        padding: '2mm',
        position: 'relative',
        backgroundImage: 'none',
        background: '#ffffff'
      }}
    >
      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: '1mm' }}>
        <img 
          src={logoImage} 
          alt="Fit Food Tasty"
          style={{ height: '8mm', width: 'auto', objectFit: 'contain' }}
        />
      </div>

      {/* Meal Name */}
      <div style={{ 
        textAlign: 'center', 
        fontWeight: 'bold', 
        fontSize: '10px',
        marginBottom: '1mm',
        color: '#000'
      }}>
        {data.mealName}
      </div>

      {/* Nutrition Info */}
      <div style={{ 
        textAlign: 'center', 
        fontWeight: 'bold', 
        fontSize: '8px',
        color: '#059669',
        marginBottom: '2mm'
      }}>
        {data.calories} Calories • {data.protein}g Protein • {data.fat}g Fat • {data.carbs}g Carbs
      </div>

      {/* Use By Date */}
      <div style={{ 
        fontWeight: 'bold', 
        fontSize: '7px',
        marginBottom: '1mm',
        color: '#000'
      }}>
        USE BY: {data.useByDate ? new Date(data.useByDate).toLocaleDateString('en-GB', {
          weekday: 'short',
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        }) : 'Fri, 19/09/2025'}
      </div>

      {/* Storage Instructions */}
      <div style={{ 
        fontSize: '6px',
        color: '#666',
        marginBottom: '1mm'
      }}>
        {storageText}
      </div>

      {/* Heating Instructions */}
      <div style={{ 
        fontSize: '6px',
        color: '#666',
        marginBottom: '1mm'
      }}>
        {heatingText}
      </div>

      {/* Ingredients */}
      <div style={{ 
        fontSize: '6px',
        color: '#000',
        marginBottom: '1mm'
      }}>
        <strong>Ingredients:</strong> {data.ingredients || 'Not specified'}
      </div>

      {/* Allergens */}
      {data.allergens && (
        <div style={{ 
          fontSize: '6px',
          fontWeight: 'bold',
          color: '#000',
          marginBottom: '1mm'
        }}>
          <strong>Allergens:</strong> {data.allergens}
        </div>
      )}

      {/* Website */}
      <div style={{ 
        textAlign: 'center', 
        fontSize: '6px',
        color: '#059669',
        fontWeight: '500',
        marginTop: 'auto'
      }}>
        www.fitfoodtasty.co.uk
      </div>
    </div>
  );
};