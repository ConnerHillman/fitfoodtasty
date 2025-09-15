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

      {/* Nutrition Bar - Clean horizontal emphasis without containers */}
      <div 
        className="text-center font-semibold text-primary" 
        style={{ 
          fontSize: '3.2mm',
          fontWeight: '650',
          lineHeight: '1.2',
          padding: '1.8mm 0', // Vertical padding only
          marginBottom: '3mm',
          background: 'linear-gradient(90deg, transparent, rgba(var(--primary), 0.08) 20%, rgba(var(--primary), 0.08) 80%, transparent)',
          letterSpacing: '0.01em'
        }}
      >
        {data.calories} Calories • {data.protein}g Protein • {data.fat}g Fat • {data.carbs}g Carbs
      </div>

      {/* Main Content - Clean functional sections */}
      <div className="flex-1" style={{ display: 'flex', flexDirection: 'column' }}>
        
        {/* Safety Information Section - Logically grouped without containers */}
        <div style={{ marginBottom: '3mm' }}>
          {/* Critical safety info separator */}
          <div 
            style={{ 
              width: '100%', 
              height: '0.2mm', 
              background: 'rgba(var(--primary), 0.2)',
              marginBottom: '2mm' 
            }}
          ></div>
          
          {/* USE BY Date - Level 3: Critical safety information */}
          <div 
            className="font-bold text-foreground text-center" 
            style={{ 
              fontSize: '3mm',
              fontWeight: '750',
              lineHeight: '1.1',
              marginBottom: '2mm',
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

          {/* Storage Instructions - Grouped with safety info */}
          <div 
            className="text-foreground text-center" 
            style={{ 
              fontSize: '2.3mm',
              fontWeight: '500',
              lineHeight: '1.3',
              marginBottom: '2mm'
            }}
          >
            {storageInstructions}
          </div>
          
          {/* Safety section separator */}
          <div 
            style={{ 
              width: '100%', 
              height: '0.2mm', 
              background: 'rgba(var(--primary), 0.2)',
              marginBottom: '2mm' 
            }}
          ></div>
        </div>

        {/* Product Details Section - Clean organization without containers */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          
          {/* Ingredients - Clean layout without boxes */}
          <div style={{ marginBottom: '2mm' }}>
            <div style={{ fontSize: '2.2mm', lineHeight: '1.4' }}>
              <span 
                className="font-semibold text-foreground" 
                style={{ fontWeight: '650', fontSize: '2.3mm' }}
              >
                Ingredients:
              </span>
            </div>
            <div 
              className="text-foreground" 
              style={{ 
                fontWeight: '450', 
                fontSize: '2.2mm',
                lineHeight: '1.4',
                marginTop: '0.5mm',
                paddingLeft: '1mm' // Subtle indentation for organization
              }}
            >
              {data.ingredients ? data.ingredients.split(',').map((ingredient, index) => (
                <span key={index}>
                  {ingredient.trim()}
                  {index < data.ingredients.split(',').length - 1 && ', '}
                </span>
              )) : 'Not specified'}
            </div>
          </div>

          {/* Allergens - Functional emphasis without gaudy styling */}
          {data.allergens && (
            <div>
              <div 
                style={{ 
                  width: '40%', 
                  height: '0.1mm', 
                  background: 'rgba(var(--primary), 0.3)',
                  marginBottom: '1.5mm' 
                }}
              ></div>
              <div style={{ fontSize: '2.2mm', lineHeight: '1.4' }}>
                <span 
                  className="font-semibold text-foreground" 
                  style={{ fontWeight: '650', fontSize: '2.3mm' }}
                >
                  Allergens:
                </span>{' '}
                <span 
                  className="font-bold text-foreground" 
                  style={{ fontWeight: '750' }}
                >
                  {data.allergens}
                </span>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Footer Section - Minimal, professional brand presence */}
      <div 
        className="text-center font-medium text-primary" 
        style={{ 
          fontSize: '2mm',
          fontWeight: '550',
          lineHeight: '1.2',
          marginTop: '2.5mm',
          paddingTop: '2mm',
          borderTop: '0.15mm solid rgba(var(--primary), 0.25)', // Slightly more prominent separator
          letterSpacing: '0.03em'
        }}
      >
        www.fitfoodtasty.co.uk
      </div>
    </div>
  );
};