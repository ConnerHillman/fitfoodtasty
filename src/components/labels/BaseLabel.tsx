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

      {/* Nutrition Section - Premium styling with better contrast */}
      <div className="bg-gradient-to-r from-primary/12 via-primary/15 to-primary/12 rounded-lg border border-primary/25 shadow-sm px-3 py-2.5 mb-3">
        <div className="text-center font-semibold text-primary leading-tight" style={{ fontSize: '10px', fontWeight: '600', letterSpacing: '0.025em' }}>
          {data.calories} Calories • {data.protein}g Protein • {data.fat}g Fat • {data.carbs}g Carbs
        </div>
      </div>

      {/* Main Content - Organized information architecture */}
      <div className="flex-1 space-y-2.5 min-h-0">
        
        {/* Critical Information Container */}
        <div className="bg-card/80 rounded-lg border border-border/40 p-2.5 space-y-2">
          {/* Use By Date - Critical safety information */}
          <div className="text-center">
            <div className="font-bold text-foreground leading-tight" style={{ fontSize: '9px', fontWeight: '700', letterSpacing: '0.025em' }}>
              USE BY: {data.useByDate ? new Date(data.useByDate).toLocaleDateString('en-GB', {
                weekday: 'short',
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
              }) : 'Fri, 19/09/2025'}
            </div>
          </div>

          {/* Storage Instructions - Important handling info */}
          <div className="bg-muted/30 rounded-md px-2.5 py-2 border border-muted-foreground/15">
            <div className="text-foreground leading-relaxed text-center" style={{ fontSize: '7px', fontWeight: '500' }}>
              {storageInstructions}
            </div>
          </div>
        </div>

        {/* Product Information Container */}
        <div className="bg-card/60 rounded-lg border border-border/30 p-2.5 space-y-2">
          {/* Ingredients - Product composition */}
          <div className="leading-relaxed" style={{ fontSize: '7px' }}>
            <div className="font-semibold text-foreground mb-1" style={{ fontWeight: '600', fontSize: '7.5px' }}>
              Ingredients:
            </div>
            <div className="text-foreground pl-1" style={{ fontWeight: '400', lineHeight: '1.3' }}>
              {data.ingredients ? data.ingredients.split(',').map((ingredient, index) => (
                <span key={index}>
                  {ingredient.trim()}
                  {index < data.ingredients.split(',').length - 1 && ', '}
                </span>
              )) : 'Not specified'}
            </div>
          </div>

          {/* Allergens - Critical safety information */}
          {data.allergens && (
            <div className="bg-amber-50 rounded-md px-2 py-1.5 border border-amber-200/60">
              <div className="leading-relaxed" style={{ fontSize: '7px' }}>
                <span className="font-semibold text-amber-800" style={{ fontWeight: '600', fontSize: '7.5px' }}>Allergens:</span>{' '}
                <span className="font-bold text-amber-900" style={{ fontWeight: '700' }}>{data.allergens}</span>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Footer - Brand information with subtle styling */}
      <div className="border-t border-border/40 pt-2.5 mt-auto">
        <div className="text-center font-medium text-primary leading-tight bg-primary/5 rounded-md py-1" style={{ fontSize: '7px', fontWeight: '500', letterSpacing: '0.05em' }}>
          www.fitfoodtasty.co.uk
        </div>
      </div>
    </div>
  );
};