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
        
        {/* Meal Name - Level 1: Dominant visual hierarchy */}
        <h1 
          className="text-center font-bold text-foreground" 
          style={{ 
            fontSize: '5.5mm', // Increased for true dominance
            fontWeight: '800', // Extra bold for maximum impact
            lineHeight: '1.1',
            marginBottom: '2mm',
            width: '100%',
            wordWrap: 'break-word',
            letterSpacing: '0.02em' // Slight spacing for premium feel
          }}
        >
          {data.mealName}
        </h1>
        
        {/* Visual separator - Clean and purposeful */}
        <div 
          className="bg-primary/50" 
          style={{ 
            width: '25%', 
            height: '0.4mm', 
            marginBottom: '2mm' 
          }} 
          aria-hidden="true"
        ></div>
      </div>

      {/* Nutrition Zone - Level 2: Prominent secondary information */}
      <div 
        className="bg-primary/10 text-center font-semibold text-primary" 
        style={{ 
          fontSize: '3.2mm', // Increased for better readability 
          fontWeight: '650', // Perfect balance between regular and bold
          lineHeight: '1.2',
          padding: '2mm 2.5mm',
          marginBottom: '2.5mm',
          borderRadius: '1.5mm',
          letterSpacing: '0.01em'
        }}
      >
        {data.calories} Calories • {data.protein}g Protein • {data.fat}g Fat • {data.carbs}g Carbs
      </div>

      {/* Main Content Zone - Structured information layout */}
      <div className="flex-1" style={{ display: 'flex', flexDirection: 'column', gap: '1.5mm' }}>
        
        {/* Safety Information Zone */}
        <div>
          {/* USE BY Date - Level 3: Critical safety information */}
          <div 
            className="font-bold text-foreground text-center" 
            style={{ 
              fontSize: '3mm', // Increased for critical safety info
              fontWeight: '750', // Strong emphasis for safety
              lineHeight: '1.1',
              marginBottom: '1.5mm',
              letterSpacing: '0.02em'
            }}
          >
            USE BY: {data.useByDate ? new Date(data.useByDate).toLocaleDateString('en-GB', {
              weekday: 'short',
              day: '2-digit',
              month: '2-digit',
              year: 'numeric'
            }) : 'Fri, 19/09/2025'}
          </div>

          {/* Storage Instructions - Level 4: Important but secondary */}
          <div 
            className="text-foreground text-center" 
            style={{ 
              fontSize: '2.3mm', // Optimal readability size
              fontWeight: '500', // Medium weight for good readability
              lineHeight: '1.3', // Better line spacing for multi-line text
              marginBottom: '2mm'
            }}
          >
            {storageInstructions}
          </div>
        </div>

        {/* Product Information Zone */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1mm' }}>
          {/* Ingredients - Level 4: Body text with clear hierarchy */}
          <div style={{ fontSize: '2.2mm', lineHeight: '1.4', marginBottom: '1.5mm' }}>
            <span 
              className="font-semibold text-foreground" 
              style={{ fontWeight: '650', fontSize: '2.3mm' }} // Slightly larger for labels
            >
              Ingredients:
            </span>{' '}
            <span 
              className="text-foreground" 
              style={{ fontWeight: '450', lineHeight: '1.4' }} // Optimized for readability
            >
              {data.ingredients ? data.ingredients.split(',').map((ingredient, index) => (
                <span key={index}>
                  {ingredient.trim()}
                  {index < data.ingredients.split(',').length - 1 && ', '}
                </span>
              )) : 'Not specified'}
            </span>
          </div>

          {/* Allergens - Level 3: Critical safety with visual emphasis */}
          {data.allergens && (
            <div style={{ fontSize: '2.2mm', lineHeight: '1.4' }}>
              <span 
                className="font-semibold text-foreground" 
                style={{ fontWeight: '650', fontSize: '2.3mm' }}
              >
                Allergens:
              </span>{' '}
              <span 
                className="font-bold text-foreground" 
                style={{ fontWeight: '750' }} // Strong emphasis for safety
              >
                {data.allergens}
              </span>
            </div>
          )}
        </div>

      </div>

      {/* Footer Zone - Level 5: Subtle brand presence */}
      <div 
        className="text-center font-medium text-primary" 
        style={{ 
          fontSize: '2mm', // Increased slightly for better readability
          fontWeight: '550', // Refined weight for professional appearance
          lineHeight: '1.2',
          marginTop: '2mm',
          paddingTop: '1.5mm',
          borderTop: '0.1mm solid rgba(var(--border), 0.4)',
          letterSpacing: '0.03em' // Professional letter spacing
        }}
      >
        www.fitfoodtasty.co.uk
      </div>
    </div>
  );
};