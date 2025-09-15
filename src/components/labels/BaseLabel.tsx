import React from 'react';
import logoImage from '@/assets/fit-food-tasty-logo.png';
import { LabelData, LABEL_DIMENSIONS, DEFAULT_INSTRUCTIONS } from '@/types/label';

interface BaseLabelProps {
  data: LabelData;
}

export const BaseLabel: React.FC<BaseLabelProps> = ({ data }) => {
  const storageInstructions = data.storageInstructions || DEFAULT_INSTRUCTIONS.storage;

  // Phase 1: Content Analysis Engine
  const analyzeContentDensity = () => {
    const mealNameLength = data.mealName.length;
    const ingredientsLength = data.ingredients ? data.ingredients.length : 0;
    const allergensLength = data.allergens ? data.allergens.length : 0;
    const storageLength = storageInstructions.length;
    
    // Calculate total character count
    const totalCharacters = mealNameLength + ingredientsLength + allergensLength + storageLength;
    
    // Content density scoring (0-100)
    // Based on empirical testing with various meal data
    let densityScore = 0;
    
    // Meal name impact (short names = lower density)
    densityScore += Math.min(mealNameLength * 1.5, 25);
    
    // Ingredients impact (major factor)
    densityScore += Math.min(ingredientsLength * 0.15, 40);
    
    // Allergens impact
    densityScore += Math.min(allergensLength * 0.8, 15);
    
    // Storage instructions impact
    densityScore += Math.min(storageLength * 0.1, 10);
    
    // Additional complexity factors
    if (ingredientsLength > 200) densityScore += 10; // Very long ingredients
    if (data.allergens && allergensLength > 50) densityScore += 5; // Many allergens
    
    return Math.min(Math.round(densityScore), 100);
  };

  // Calculate scaling factors based on content density
  const getScalingFactors = (density: number) => {
    // Low density (0-30): Scale up for better visual impact
    if (density <= 30) {
      return {
        mealNameScale: 1.3,    // 30% larger
        nutritionScale: 1.2,   // 20% larger
        useByScale: 1.15,      // 15% larger
        storageScale: 1.1,     // 10% larger
        ingredientsScale: 1.05, // 5% larger
        allergensScale: 1.05,  // 5% larger
        spacingScale: 1.4,     // More generous spacing
        logoScale: 1.1         // Slightly larger logo
      };
    }
    
    // Medium density (31-65): Current sizing (baseline)
    if (density <= 65) {
      return {
        mealNameScale: 1.0,
        nutritionScale: 1.0,
        useByScale: 1.0,
        storageScale: 1.0,
        ingredientsScale: 1.0,
        allergensScale: 1.0,
        spacingScale: 1.0,
        logoScale: 1.0
      };
    }
    
    // High density (66-85): Scale down to fit
    if (density <= 85) {
      return {
        mealNameScale: 0.9,    // 10% smaller
        nutritionScale: 0.95,  // 5% smaller
        useByScale: 0.95,      // 5% smaller
        storageScale: 0.9,     // 10% smaller
        ingredientsScale: 0.85, // 15% smaller
        allergensScale: 0.9,   // 10% smaller
        spacingScale: 0.7,     // Tighter spacing
        logoScale: 0.95        // Slightly smaller logo
      };
    }
    
    // Very high density (86-100): Aggressive compression
    return {
      mealNameScale: 0.8,     // 20% smaller
      nutritionScale: 0.85,   // 15% smaller
      useByScale: 0.9,        // 10% smaller
      storageScale: 0.8,      // 20% smaller
      ingredientsScale: 0.7,  // 30% smaller
      allergensScale: 0.8,    // 20% smaller
      spacingScale: 0.5,      // Very tight spacing
      logoScale: 0.9          // Smaller logo
    };
  };

  // Apply content analysis
  const contentDensity = analyzeContentDensity();
  const scalingFactors = getScalingFactors(contentDensity);
  
  // Dynamic size calculations (base sizes in mm)
  const baseSizes = {
    mealName: 5.2,
    nutrition: 3.0,
    useBy: 2.8,
    storage: 2.0,
    ingredients: 1.8,
    allergens: 1.9,
    logo: 10.0,
    footer: 1.9
  };
  
  const dynamicSizes = {
    mealName: baseSizes.mealName * scalingFactors.mealNameScale,
    nutrition: baseSizes.nutrition * scalingFactors.nutritionScale,
    useBy: baseSizes.useBy * scalingFactors.useByScale,
    storage: baseSizes.storage * scalingFactors.storageScale,
    ingredients: baseSizes.ingredients * scalingFactors.ingredientsScale,
    allergens: baseSizes.allergens * scalingFactors.allergensScale,
    logo: baseSizes.logo * scalingFactors.logoScale,
    footer: baseSizes.footer
  };
  
  // Dynamic spacing calculations
  const baseSpacing = {
    headerMargin: 0.8,
    logoMargin: 0.5,
    mealNameMargin: 0.8,
    separatorMargin: 0.8,
    nutritionMargin: 1.0,
    sectionMargin: 1.0,
    useByMargin: 0.5,
    storageMargin: 0.8,
    ingredientsMargin: 0.8,
    footerMargin: 1.0
  };
  
  const dynamicSpacing = {
    headerMargin: baseSpacing.headerMargin * scalingFactors.spacingScale,
    logoMargin: baseSpacing.logoMargin * scalingFactors.spacingScale,
    mealNameMargin: baseSpacing.mealNameMargin * scalingFactors.spacingScale,
    separatorMargin: baseSpacing.separatorMargin * scalingFactors.spacingScale,
    nutritionMargin: baseSpacing.nutritionMargin * scalingFactors.spacingScale,
    sectionMargin: baseSpacing.sectionMargin * scalingFactors.spacingScale,
    useByMargin: baseSpacing.useByMargin * scalingFactors.spacingScale,
    storageMargin: baseSpacing.storageMargin * scalingFactors.spacingScale,
    ingredientsMargin: baseSpacing.ingredientsMargin * scalingFactors.spacingScale,
    footerMargin: baseSpacing.footerMargin * scalingFactors.spacingScale
  };

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
      {/* Header Zone - Dynamic spacing based on content density */}
      <div className="flex flex-col items-center" style={{ marginBottom: `${dynamicSpacing.headerMargin}mm` }}>
        {/* Logo - Dynamic sizing */}
        <div style={{ marginBottom: `${dynamicSpacing.logoMargin}mm` }}>
          <img 
            src={logoImage} 
            alt="Fit Food Tasty logo"
            style={{ height: `${dynamicSizes.logo}mm`, width: 'auto', objectFit: 'contain' }}
          />
        </div>
        
        {/* Meal Name - Dynamic sizing based on content analysis */}
        <h1 
          className="text-center font-bold text-foreground" 
          style={{ 
            fontSize: `${dynamicSizes.mealName}mm`,
            fontWeight: '800',
            lineHeight: '0.95',
            marginBottom: `${dynamicSpacing.mealNameMargin}mm`,
            width: '100%',
            wordWrap: 'break-word',
            letterSpacing: '0.02em'
          }}
        >
          {data.mealName}
        </h1>
        
        {/* Visual separator - Dynamic spacing */}
        <div 
          className="bg-primary/50" 
          style={{ 
            width: '25%', 
            height: '0.4mm', 
            marginBottom: `${dynamicSpacing.separatorMargin}mm`
          }} 
          aria-hidden="true"
        ></div>
      </div>

      {/* Nutrition Bar - Dynamic sizing and spacing */}
      <div 
        className="text-center font-semibold text-primary" 
        style={{ 
          fontSize: `${dynamicSizes.nutrition}mm`,
          fontWeight: '650',
          lineHeight: '1.0',
          padding: `${dynamicSpacing.nutritionMargin}mm 0`,
          marginBottom: `${dynamicSpacing.nutritionMargin}mm`,
          background: 'linear-gradient(90deg, transparent, rgba(var(--primary), 0.08) 20%, rgba(var(--primary), 0.08) 80%, transparent)',
          letterSpacing: '0.01em'
        }}
      >
        {data.calories} Calories • {data.protein}g Protein • {data.fat}g Fat • {data.carbs}g Carbs
      </div>
      
      {/* Content Density Debug Info - Remove in production */}
      <div className="text-center text-xs text-gray-500" style={{ fontSize: '1mm', marginBottom: '1mm' }}>
        Density: {contentDensity}% | Scale: {scalingFactors.mealNameScale.toFixed(2)}x
      </div>

      {/* Main Content - Dynamic density-aware layout */}
      <div className="flex-1" style={{ display: 'flex', flexDirection: 'column' }}>
        
        {/* Safety Information Section - Dynamic spacing */}
        <div style={{ marginBottom: `${dynamicSpacing.sectionMargin}mm` }}>
          
          {/* USE BY Date - Dynamic sizing */}
          <div 
            className="font-bold text-foreground text-center" 
            style={{ 
              fontSize: `${dynamicSizes.useBy}mm`,
              fontWeight: '750',
              lineHeight: '1.0',
              marginBottom: `${dynamicSpacing.useByMargin}mm`,
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

          {/* Storage Instructions - Dynamic sizing */}
          <div 
            className="text-foreground text-center" 
            style={{ 
              fontSize: `${dynamicSizes.storage}mm`,
              fontWeight: '500',
              lineHeight: '1.15',
              marginBottom: `${dynamicSpacing.storageMargin}mm`
            }}
          >
            {storageInstructions}
          </div>
        </div>

        {/* Product Details Section - Dynamic content optimization */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          
          {/* Ingredients - Dynamic sizing based on content length */}
          <div style={{ marginBottom: `${dynamicSpacing.ingredientsMargin}mm` }}>
            <div className="text-center" style={{ 
              fontSize: `${Math.max(dynamicSizes.ingredients + 0.2, 1.6)}mm`, // Slightly larger for labels
              lineHeight: '1.1', 
              marginBottom: '0.3mm' 
            }}>
              <span 
                className="font-semibold text-foreground" 
                style={{ fontWeight: '650' }}
              >
                Ingredients:
              </span>
            </div>
            <div 
              className="text-foreground text-center" 
              style={{ 
                fontWeight: '450', 
                fontSize: `${dynamicSizes.ingredients}mm`,
                lineHeight: '1.25',
                wordWrap: 'break-word',
                overflowWrap: 'break-word'
              }}
            >
              {data.ingredients ? (() => {
                // Enhanced intelligent ingredient processing based on density
                let processedIngredients = data.ingredients;
                
                // Apply more aggressive abbreviations for high density content
                if (contentDensity > 65) {
                  processedIngredients = processedIngredients
                    .replace(/\(Extra Virgin\)/g, '(EV)')
                    .replace(/\(Light\)/g, '(Lt)')
                    .replace(/Chicken Breast/g, 'Chicken')
                    .replace(/Sweet Chilli Sauce/g, 'Sweet Chilli')
                    .replace(/Sriracha Sauce/g, 'Sriracha')
                    .replace(/Smoked Paprika/g, 'Paprika')
                    .replace(/Olive Oil/g, 'Oil')
                    .replace(/Parsley/g, 'Parsley')
                    .replace(/Lime Juice/g, 'Lime')
                    .replace(/Chilli Flakes/g, 'Chilli');
                }
                
                return processedIngredients.split(',').map((ingredient, index) => (
                  <span key={index}>
                    {ingredient.trim()}
                    {index < processedIngredients.split(',').length - 1 && ', '}
                  </span>
                ));
              })() : 'Not specified'}
            </div>
          </div>

          {/* Allergens - Dynamic sizing for safety compliance */}
          {data.allergens && (
            <div className="text-center" style={{ 
              fontSize: `${dynamicSizes.allergens}mm`, 
              lineHeight: '1.2' 
            }}>
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

      {/* Footer Section - Consistent sizing */}
      <div 
        className="text-center font-medium text-primary" 
        style={{ 
          fontSize: `${dynamicSizes.footer}mm`,
          fontWeight: '550',
          lineHeight: '1.0',
          marginTop: `${dynamicSpacing.footerMargin}mm`,
          paddingTop: `${dynamicSpacing.footerMargin}mm`,
          borderTop: '0.15mm solid rgba(var(--primary), 0.25)',
          letterSpacing: '0.03em'
        }}
      >
        www.fitfoodtasty.co.uk
      </div>
    </div>
  );
};