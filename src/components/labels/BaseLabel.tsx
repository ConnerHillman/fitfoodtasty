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
        padding: '8px',
        display: 'flex',
        flexDirection: 'column',
        fontSize: '6px',
        lineHeight: '1.2',
        justifyContent: 'space-between'
      }}
    >
      {/* Header Section */}
      <div className="flex flex-col items-center">
        {/* Logo - Enhanced size and prominence */}
        <div className="mb-3 p-1 bg-background/80 rounded-md border border-primary/10">
          <img 
            src={logoImage} 
            alt="Fit Food Tasty logo"
            className="h-16 w-auto object-contain"
          />
        </div>
        
        {/* Meal Name - Dominant visual element */}
        <h1 className="text-center font-bold text-foreground leading-tight mb-3 px-1" style={{ fontSize: '16px', fontWeight: '700' }}>
          {data.mealName}
        </h1>
        
        {/* Separator - Enhanced visual impact */}
        <div className="w-12 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent mb-3" aria-hidden="true"></div>
      </div>

      {/* Nutrition Section - Subheader level */}
      <div className="bg-gradient-to-r from-primary/8 to-primary/12 rounded-md border border-primary/20 px-3 py-2 mb-3">
        <div className="text-center font-semibold text-primary leading-tight" style={{ fontSize: '10px', fontWeight: '600' }}>
          {data.calories} Calories • {data.protein}g Protein • {data.fat}g Fat • {data.carbs}g Carbs
        </div>
      </div>

      {/* Main Content - Improved typography and spacing */}
      <div className="flex-1 space-y-2 min-h-0">
        {/* Use By Date - Most Important - Subheader level */}
        <div className="bg-muted/60 rounded-md px-2 py-1.5 border border-muted-foreground/20">
          <div className="font-bold text-foreground leading-tight" style={{ fontSize: '9px', fontWeight: '700' }}>
            USE BY: {data.useByDate ? new Date(data.useByDate).toLocaleDateString('en-GB', {
              weekday: 'short',
              day: '2-digit',
              month: '2-digit',
              year: 'numeric'
            }) : 'Fri, 19/09/2025'}
          </div>
        </div>

        {/* Storage Instructions - Body text */}
        <div className="text-foreground leading-relaxed px-1" style={{ fontSize: '7px', fontWeight: '400' }}>
          {storageInstructions}
        </div>

        {/* Ingredients - Body text with improved hierarchy */}
        <div className="leading-relaxed px-1" style={{ fontSize: '7px' }}>
          <span className="font-semibold text-foreground" style={{ fontWeight: '600' }}>Ingredients:</span>{' '}
          <span className="text-foreground" style={{ fontWeight: '400' }}>
            {data.ingredients ? data.ingredients.split(',').map((ingredient, index) => (
              <span key={index}>
                {ingredient.trim()}
                {index < data.ingredients.split(',').length - 1 && ', '}
              </span>
            )) : 'Not specified'}
          </span>
        </div>

        {/* Allergens - Body text with emphasis */}
        {data.allergens && (
          <div className="leading-relaxed px-1" style={{ fontSize: '7px' }}>
            <span className="font-semibold text-foreground" style={{ fontWeight: '600' }}>Allergens:</span>{' '}
            <span className="font-bold text-foreground" style={{ fontWeight: '700' }}>{data.allergens}</span>
          </div>
        )}
      </div>

      {/* Footer - Body text level */}
      <div className="border-t border-border/30 pt-2 mt-auto">
        <div className="text-center font-medium text-primary leading-tight" style={{ fontSize: '7px', fontWeight: '500' }}>
          www.fitfoodtasty.co.uk
        </div>
      </div>
    </div>
  );
};