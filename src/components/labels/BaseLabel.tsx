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
        padding: '3mm', // Reduced from 4mm for more content space
        display: 'flex',
        flexDirection: 'column',
        fontSize: '6px',
        lineHeight: '1.2',
        justifyContent: 'space-between'
      }}
    >
      {/* Header Zone - Micro-optimized spacing */}
      <div className="flex flex-col items-center" style={{ marginBottom: '0.8mm' }}> {/* Reduced from 1.5mm */}
        {/* Logo - Tight spacing */}
        <div style={{ marginBottom: '0.5mm' }}> {/* Reduced from 1mm */}
          <img 
            src={logoImage} 
            alt="Fit Food Tasty logo"
            style={{ height: '10mm', width: 'auto', objectFit: 'contain' }}
          />
        </div>
        
        {/* Meal Name - Tight spacing for maximum content area */}
        <h1 
          className="text-center font-bold text-foreground" 
          style={{ 
            fontSize: '5.2mm',
            fontWeight: '800',
            lineHeight: '0.95', // Ultra-tight line height
            marginBottom: '0.8mm', // Reduced from 1.5mm
            width: '100%',
            wordWrap: 'break-word',
            letterSpacing: '0.02em'
          }}
        >
          {data.mealName}
        </h1>
        
        {/* Visual separator - Minimal spacing */}
        <div 
          className="bg-primary/50" 
          style={{ 
            width: '25%', 
            height: '0.4mm', 
            marginBottom: '0.8mm' // Reduced from 1.5mm
          }} 
          aria-hidden="true"
        ></div>
      </div>

      {/* Nutrition Bar - Ultra-compact */}
      <div 
        className="text-center font-semibold text-primary" 
        style={{ 
          fontSize: '3mm',
          fontWeight: '650',
          lineHeight: '1.0', // Ultra-tight
          padding: '1mm 0', // Reduced from 1.5mm
          marginBottom: '1mm', // Reduced from 2mm
          background: 'linear-gradient(90deg, transparent, rgba(var(--primary), 0.08) 20%, rgba(var(--primary), 0.08) 80%, transparent)',
          letterSpacing: '0.01em'
        }}
      >
        {data.calories} Calories • {data.protein}g Protein • {data.fat}g Fat • {data.carbs}g Carbs
      </div>

      {/* Main Content - Maximum density optimization */}
      <div className="flex-1" style={{ display: 'flex', flexDirection: 'column' }}>
        
        {/* Safety Information Section - Consolidated block */}
        <div style={{ marginBottom: '1mm' }}> {/* Reduced from 2mm */}
          
          {/* USE BY Date - No decorative separators, rely on typography */}
          <div 
            className="font-bold text-foreground text-center" 
            style={{ 
              fontSize: '2.8mm',
              fontWeight: '750',
              lineHeight: '1.0',
              marginBottom: '0.5mm', // Minimal spacing to storage
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

          {/* Storage Instructions - Grouped tightly with USE BY */}
          <div 
            className="text-foreground text-center" 
            style={{ 
              fontSize: '2mm',
              fontWeight: '500',
              lineHeight: '1.15', // Optimized for multi-line
              marginBottom: '0.8mm' // Minimal separation before next section
            }}
          >
            {storageInstructions}
          </div>
        </div>

        {/* Product Details Section - Maximum density */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          
          {/* Ingredients - Ultra-compact layout */}
          <div style={{ marginBottom: '0.8mm' }}> {/* Reduced from 1.5mm */}
            <div style={{ fontSize: '2mm', lineHeight: '1.1', marginBottom: '0.3mm' }}> {/* Reduced spacing */}
              <span 
                className="font-semibold text-foreground" 
                style={{ fontWeight: '650' }}
              >
                Ingredients:
              </span>
            </div>
            <div 
              className="text-foreground" 
              style={{ 
                fontWeight: '450', 
                fontSize: '1.8mm',
                lineHeight: '1.25', // Optimized for density
                paddingLeft: '1mm',
                wordWrap: 'break-word',
                overflowWrap: 'break-word'
              }}
            >
              {data.ingredients ? (() => {
                // Intelligent ingredient processing for space optimization
                const processedIngredients = data.ingredients
                  .replace(/\(Extra Virgin\)/g, '(EV)')
                  .replace(/\(Light\)/g, '(Lt)')
                  .replace(/Chicken Breast/g, 'Chicken')
                  .replace(/Sweet Chilli Sauce/g, 'Sweet Chilli')
                  .replace(/Sriracha Sauce/g, 'Sriracha')
                  .replace(/Smoked Paprika/g, 'Smoked Paprika')
                  .replace(/Olive Oil/g, 'Olive Oil');
                
                return processedIngredients.split(',').map((ingredient, index) => (
                  <span key={index}>
                    {ingredient.trim()}
                    {index < processedIngredients.split(',').length - 1 && ', '}
                  </span>
                ));
              })() : 'Not specified'}
            </div>
          </div>

          {/* Allergens - No separator line, rely on typography */}
          {data.allergens && (
            <div style={{ fontSize: '1.9mm', lineHeight: '1.2' }}>
              <span 
                className="font-semibold text-foreground" 
                style={{ fontWeight: '650' }}
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
          )}
        </div>

      </div>

      {/* Footer Section - Minimal spacing */}
      <div 
        className="text-center font-medium text-primary" 
        style={{ 
          fontSize: '1.9mm',
          fontWeight: '550',
          lineHeight: '1.0', // Ultra-tight
          marginTop: '1mm', // Reduced from 2mm
          paddingTop: '1mm', // Reduced from 1.5mm
          borderTop: '0.15mm solid rgba(var(--primary), 0.25)',
          letterSpacing: '0.03em'
        }}
      >
        www.fitfoodtasty.co.uk
      </div>
    </div>
  );
};