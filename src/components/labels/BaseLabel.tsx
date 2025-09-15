import React from 'react';
import logoImage from '@/assets/fit-food-tasty-logo.png';
import { LabelData, LABEL_DIMENSIONS, DEFAULT_INSTRUCTIONS } from '@/types/label';

interface BaseLabelProps {
  data: LabelData;
}

export const BaseLabel: React.FC<BaseLabelProps> = ({ data }) => {
  const storageInstructions = data.storageInstructions || DEFAULT_INSTRUCTIONS.storage;

  return (
    <div 
      className="w-full h-full bg-card text-card-foreground font-inter" 
      style={{
        width: LABEL_DIMENSIONS.width,
        height: LABEL_DIMENSIONS.height,
        boxSizing: 'border-box',
        padding: '4mm', // Optimized padding for better space usage
        display: 'flex',
        flexDirection: 'column',
        fontSize: '6px',
        lineHeight: '1.2',
        justifyContent: 'space-between'
      }}
    >
      {/* Header Zone - Logo + Meal Name */}
      <div className="flex flex-col items-center" style={{ marginBottom: '2mm' }}>
        {/* Logo - Properly sized and positioned */}
        <div style={{ marginBottom: '1.5mm' }}>
          <img 
            src={logoImage} 
            alt="Fit Food Tasty logo"
            style={{ height: '12mm', width: 'auto', objectFit: 'contain' }}
          />
        </div>
        
        {/* Meal Name - Dominant visual element with proper spacing */}
        <h1 
          className="text-center font-bold text-foreground leading-tight" 
          style={{ 
            fontSize: '4.5mm', 
            fontWeight: '700',
            marginBottom: '1.5mm',
            width: '100%',
            wordWrap: 'break-word'
          }}
        >
          {data.mealName}
        </h1>
        
        {/* Clean separator */}
        <div 
          className="bg-primary/40" 
          style={{ 
            width: '30%', 
            height: '0.3mm', 
            marginBottom: '1.5mm' 
          }} 
          aria-hidden="true"
        ></div>
      </div>

      {/* Nutrition Zone - Clean horizontal emphasis */}
      <div 
        className="bg-primary/8 text-center font-semibold text-primary leading-tight" 
        style={{ 
          fontSize: '2.8mm', 
          fontWeight: '600',
          padding: '1.5mm 2mm',
          marginBottom: '2mm',
          borderRadius: '1mm'
        }}
      >
        {data.calories} Calories • {data.protein}g Protein • {data.fat}g Fat • {data.carbs}g Carbs
      </div>

      {/* Main Content Zone - Structured information layout */}
      <div className="flex-1" style={{ display: 'flex', flexDirection: 'column', gap: '1.5mm' }}>
        
        {/* Safety Information Zone */}
        <div>
          {/* USE BY Date - Critical safety information */}
          <div 
            className="font-bold text-foreground text-center" 
            style={{ 
              fontSize: '2.5mm', 
              fontWeight: '700',
              marginBottom: '1mm'
            }}
          >
            USE BY: {data.useByDate ? new Date(data.useByDate).toLocaleDateString('en-GB', {
              weekday: 'short',
              day: '2-digit',
              month: '2-digit',
              year: 'numeric'
            }) : 'Fri, 19/09/2025'}
          </div>

          {/* Storage Instructions */}
          <div 
            className="text-foreground text-center leading-relaxed" 
            style={{ 
              fontSize: '2mm', 
              fontWeight: '400',
              marginBottom: '1.5mm'
            }}
          >
            {storageInstructions}
          </div>
        </div>

        {/* Product Information Zone */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1mm' }}>
          {/* Ingredients */}
          <div style={{ fontSize: '2mm', lineHeight: '1.3' }}>
            <span className="font-semibold text-foreground" style={{ fontWeight: '600' }}>
              Ingredients:
            </span>{' '}
            <span className="text-foreground" style={{ fontWeight: '400' }}>
              {data.ingredients ? data.ingredients.split(',').map((ingredient, index) => (
                <span key={index}>
                  {ingredient.trim()}
                  {index < data.ingredients.split(',').length - 1 && ', '}
                </span>
              )) : 'Not specified'}
            </span>
          </div>

          {/* Allergens */}
          {data.allergens && (
            <div style={{ fontSize: '2mm', lineHeight: '1.3' }}>
              <span className="font-semibold text-foreground" style={{ fontWeight: '600' }}>
                Allergens:
              </span>{' '}
              <span className="font-bold text-foreground" style={{ fontWeight: '700' }}>
                {data.allergens}
              </span>
            </div>
          )}
        </div>

      </div>

      {/* Footer Zone - Clean brand presence */}
      <div 
        className="text-center font-medium text-primary" 
        style={{ 
          fontSize: '1.8mm', 
          fontWeight: '500',
          marginTop: '1.5mm',
          paddingTop: '1mm',
          borderTop: '0.1mm solid rgba(var(--border), 0.3)'
        }}
      >
        www.fitfoodtasty.co.uk
      </div>
    </div>
  );
};