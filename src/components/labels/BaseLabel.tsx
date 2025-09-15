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
        padding: '6px',
        display: 'flex',
        flexDirection: 'column',
        fontSize: '6px',
        lineHeight: '1.2',
        justifyContent: 'space-between'
      }}
    >
      {/* Header Section */}
      <div className="flex flex-col items-center">
        {/* Logo */}
        <div className="mb-2">
          <img 
            src={logoImage} 
            alt="Fit Food Tasty logo"
            className="h-8 w-auto object-contain"
          />
        </div>
        
        {/* Meal Name */}
        <h1 className="text-center font-bold text-foreground leading-tight mb-2" style={{ fontSize: '14px' }}>
          {data.mealName}
        </h1>
        
        {/* Separator */}
        <div className="w-8 h-px bg-primary/30 mb-2" aria-hidden="true"></div>
      </div>

      {/* Nutrition Section */}
      <div className="bg-gradient-to-r from-primary/8 to-primary/12 rounded border border-primary/20 px-2 py-1.5 mb-2">
        <div className="text-center font-bold text-primary leading-tight" style={{ fontSize: '8px' }}>
          {data.calories} Calories • {data.protein}g Protein • {data.fat}g Fat • {data.carbs}g Carbs
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 space-y-1.5 min-h-0">
        {/* Use By Date - Most Important */}
        <div className="bg-muted/50 rounded px-2 py-1">
          <div className="font-bold text-foreground leading-tight" style={{ fontSize: '7px' }}>
            USE BY: {data.useByDate ? new Date(data.useByDate).toLocaleDateString('en-GB', {
              weekday: 'short',
              day: '2-digit',
              month: '2-digit',
              year: 'numeric'
            }) : 'Fri, 19/09/2025'}
          </div>
        </div>

        {/* Storage Instructions */}
        <div className="text-foreground leading-tight" style={{ fontSize: '6px' }}>
          {storageInstructions}
        </div>

        {/* Ingredients */}
        <div className="leading-tight" style={{ fontSize: '6px' }}>
          <span className="font-semibold text-foreground">Ingredients:</span>{' '}
          <span className="text-foreground">
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
          <div className="leading-tight" style={{ fontSize: '6px' }}>
            <span className="font-semibold text-foreground">Allergens:</span>{' '}
            <span className="font-bold text-foreground">{data.allergens}</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-border/30 pt-1 mt-auto">
        <div className="text-center font-medium text-primary leading-tight" style={{ fontSize: '6px' }}>
          www.fitfoodtasty.co.uk
        </div>
      </div>
    </div>
  );
};