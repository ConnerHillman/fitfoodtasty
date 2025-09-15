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
      {/* Header Zone - Optimized for space efficiency */}
      <div className="flex flex-col items-center" style={{ marginBottom: '1.5mm' }}>
        {/* Logo - Reduced size for more content space */}
        <div style={{ marginBottom: '1mm' }}>
          <img 
            src={logoImage} 
            alt="Fit Food Tasty logo"
            style={{ height: '10mm', width: 'auto', objectFit: 'contain' }} // Reduced from 12mm
          />
        </div>
        
        {/* Meal Name - Maintained dominance with optimized spacing */}
        <h1 
          className="text-center font-bold text-foreground" 
          style={{ 
            fontSize: '5.2mm', // Slightly reduced for space efficiency
            fontWeight: '800',
            lineHeight: '1.0', // Tighter line height
            marginBottom: '1.5mm', // Reduced spacing
            width: '100%',
            wordWrap: 'break-word',
            letterSpacing: '0.02em'
          }}
        >
          {data.mealName}
        </h1>
        
        {/* Visual separator - Optimized */}
        <div 
          className="bg-primary/50" 
          style={{ 
            width: '25%', 
            height: '0.4mm', 
            marginBottom: '1.5mm' // Reduced spacing
          }} 
          aria-hidden="true"
        ></div>
      </div>

      {/* Nutrition Bar - Compact but readable */}
      <div 
        className="text-center font-semibold text-primary" 
        style={{ 
          fontSize: '3mm', // Slightly reduced for space
          fontWeight: '650',
          lineHeight: '1.1', // Tighter
          padding: '1.5mm 0', // Reduced padding
          marginBottom: '2mm', // Reduced margin
          background: 'linear-gradient(90deg, transparent, rgba(var(--primary), 0.08) 20%, rgba(var(--primary), 0.08) 80%, transparent)',
          letterSpacing: '0.01em'
        }}
      >
        {data.calories} Calories • {data.protein}g Protein • {data.fat}g Fat • {data.carbs}g Carbs
      </div>

      {/* Main Content - Optimized for space efficiency */}
      <div className="flex-1" style={{ display: 'flex', flexDirection: 'column' }}>
        
        {/* Safety Information Section - Compact layout */}
        <div style={{ marginBottom: '2mm' }}> {/* Reduced from 3mm */}
          {/* Critical safety info separator */}
          <div 
            style={{ 
              width: '100%', 
              height: '0.2mm', 
              background: 'rgba(var(--primary), 0.2)',
              marginBottom: '1.5mm' // Reduced spacing
            }}
          ></div>
          
          {/* USE BY Date - Maintained importance with better spacing */}
          <div 
            className="font-bold text-foreground text-center" 
            style={{ 
              fontSize: '2.8mm', // Slightly reduced for space
              fontWeight: '750',
              lineHeight: '1.0', // Tighter
              marginBottom: '1.5mm', // Reduced spacing
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

          {/* Storage Instructions - Optimized for space */}
          <div 
            className="text-foreground text-center" 
            style={{ 
              fontSize: '2mm', // Reduced for space efficiency
              fontWeight: '500',
              lineHeight: '1.2', // Tighter line spacing
              marginBottom: '1.5mm' // Reduced spacing
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
              marginBottom: '1.5mm' // Reduced spacing
            }}
          ></div>
        </div>

        {/* Product Details Section - Space-optimized layout */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          
          {/* Ingredients - Intelligent space management */}
          <div style={{ marginBottom: '1.5mm' }}>
            <div style={{ fontSize: '2mm', lineHeight: '1.2', marginBottom: '0.5mm' }}>
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
                fontSize: '1.8mm', // Reduced for space efficiency
                lineHeight: '1.3', // Optimized for readability
                paddingLeft: '1mm',
                wordWrap: 'break-word',
                overflowWrap: 'break-word'
              }}
            >
              {data.ingredients ? (() => {
                // Intelligent ingredient processing for space optimization
                const processedIngredients = data.ingredients
                  .replace(/\(Extra Virgin\)/g, '(EV)') // Abbreviate Extra Virgin
                  .replace(/\(Light\)/g, '(Lt)') // Abbreviate Light
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

          {/* Allergens - Compact but prominent */}
          {data.allergens && (
            <div>
              <div 
                style={{ 
                  width: '40%', 
                  height: '0.1mm', 
                  background: 'rgba(var(--primary), 0.3)',
                  marginBottom: '1mm' // Reduced spacing
                }}
              ></div>
              <div style={{ fontSize: '1.9mm', lineHeight: '1.3' }}> {/* Slightly reduced */}
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
            </div>
          )}
        </div>

      </div>

      {/* Footer Section - Compact brand presence */}
      <div 
        className="text-center font-medium text-primary" 
        style={{ 
          fontSize: '1.9mm', // Slightly reduced
          fontWeight: '550',
          lineHeight: '1.1', // Tighter
          marginTop: '2mm', // Reduced spacing
          paddingTop: '1.5mm', // Reduced padding
          borderTop: '0.15mm solid rgba(var(--primary), 0.25)',
          letterSpacing: '0.03em'
        }}
      >
        www.fitfoodtasty.co.uk
      </div>
    </div>
  );
};