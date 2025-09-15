import React from 'react';
import logoImage from '@/assets/fit-food-tasty-logo.png';
import { LabelData, LABEL_DIMENSIONS, DEFAULT_INSTRUCTIONS } from '@/types/label';

interface BaseLabelProps {
  data: LabelData;
}

export const BaseLabel: React.FC<BaseLabelProps> = ({ data }) => {
  const storageHeatingInstructions = data.storageHeatingInstructions || DEFAULT_INSTRUCTIONS.storageHeating;

  // Simplified content analysis focusing on meal name length for consistent sizing
  const analyzeContentDensity = () => {
    const mealNameLength = data.mealName.length;
    const ingredientsLength = data.ingredients ? data.ingredients.length : 0;
    const allergensLength = data.allergens ? data.allergens.length : 0;
    
    // Primary factor: meal name length (most important for title sizing)
    let densityScore = 0;
    
    // Meal name scoring - simpler and more predictable
    if (mealNameLength <= 15) densityScore += 10;      // Short names get low density (larger text)
    else if (mealNameLength <= 25) densityScore += 20; // Medium names get medium density
    else if (mealNameLength <= 35) densityScore += 35; // Long names get higher density
    else densityScore += 50;                           // Very long names get high density
    
    // Secondary factors (minor impact)
    if (ingredientsLength > 200) densityScore += 15;   // Very long ingredients
    if (allergensLength > 50) densityScore += 10;      // Many allergens
    
    return Math.min(densityScore, 100);
  };

  // Simplified scaling system with consistent meal name sizing
  const getScalingFactors = (density: number) => {
    // Focus on meal name consistency first
    if (density >= 60) {
      return {
        mealNameScale: 0.8,     // Compact for very long names
        nutritionScale: 0.85,   
        useByScale: 0.9,        
        storageScale: 0.8,      
        ingredientsScale: 0.75, 
        allergensScale: 0.8,    
        spacingScale: 0.6,      
        logoScale: 0.9,        
        qualityMode: 'compact'
      };
    }
    
    if (density >= 35) {
      return {
        mealNameScale: 0.95,    // Slightly smaller for long names
        nutritionScale: 0.95,   
        useByScale: 0.95,       
        storageScale: 0.9,      
        ingredientsScale: 0.85, 
        allergensScale: 0.9,    
        spacingScale: 0.8,      
        logoScale: 0.95,        
        qualityMode: 'balanced'
      };
    }
    
    if (density >= 20) {
      return {
        mealNameScale: 1.0,     // Standard size for medium names
        nutritionScale: 1.0,    
        useByScale: 1.0,        
        storageScale: 1.0,      
        ingredientsScale: 1.0,  
        allergensScale: 1.0,    
        spacingScale: 1.0,      
        logoScale: 1.0,         
        qualityMode: 'optimal'
      };
    }
    
    // Short names get enhanced sizing
    return {
      mealNameScale: 1.2,      // Larger for short names
      nutritionScale: 1.1,     
      useByScale: 1.05,        
      storageScale: 1.05,      
      ingredientsScale: 1.0,   
      allergensScale: 1.05,    
      spacingScale: 1.2,       
      logoScale: 1.05,         
      qualityMode: 'enhanced'
    };
  };

  // Phase 2: Quality threshold enforcement
  const enforceQualityThresholds = (sizes: any, factors: any) => {
    const minReadableSizes = {
      mealName: 3.5,    // Minimum for meal name dominance
      nutrition: 2.2,   // Minimum for nutrition readability
      useBy: 2.0,       // Minimum for safety compliance
      storage: 1.6,     // Minimum for instruction readability
      ingredients: 1.4, // Minimum for ingredient legibility
      allergens: 1.5,   // Minimum for safety compliance
      logo: 8.0,        // Minimum for brand recognition
      footer: 1.5       // Minimum for contact info
    };

    // Enforce minimum sizes while maintaining proportions
    Object.keys(sizes).forEach(key => {
      if (minReadableSizes[key] && sizes[key] < minReadableSizes[key]) {
        const adjustmentFactor = minReadableSizes[key] / sizes[key];
        // Apply proportional adjustment to all related elements
        if (adjustmentFactor > 1.1) { // Only adjust if significant
          sizes[key] = minReadableSizes[key];
          // Reduce spacing to compensate
          factors.spacingScale *= 0.9;
        }
      }
    });

    return { sizes, factors };
  };

  // Apply simplified content analysis
  const contentDensity = analyzeContentDensity();
  const scalingFactors = getScalingFactors(contentDensity);
  
  // Simplified base sizes
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
  
  // Calculate sizes directly (no complex quality enforcement)
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
  
  // Simplified spacing calculation
  const calculateSpacing = (factors: any) => {
    const baseSpacing = {
      headerMargin: 0.8,
      logoMargin: 0.5,
      mealNameMargin: 0.8,
      nutritionMargin: 1.0,
      sectionMargin: 1.0,
      useByMargin: 0.5,
      storageMargin: 0.8,
      ingredientsMargin: 0.8,
      footerMargin: 1.0
    };
    
    const spacingMultiplier = factors.spacingScale;
    
    return {
      headerMargin: Math.max(baseSpacing.headerMargin * spacingMultiplier, 0.3),
      logoMargin: Math.max(baseSpacing.logoMargin * spacingMultiplier, 0.2),
      mealNameMargin: Math.max(baseSpacing.mealNameMargin * spacingMultiplier, 0.3),
      nutritionMargin: Math.max(baseSpacing.nutritionMargin * spacingMultiplier, 0.4),
      sectionMargin: Math.max(baseSpacing.sectionMargin * spacingMultiplier, 0.4),
      useByMargin: Math.max(baseSpacing.useByMargin * spacingMultiplier, 0.2),
      storageMargin: Math.max(baseSpacing.storageMargin * spacingMultiplier, 0.3),
      ingredientsMargin: Math.max(baseSpacing.ingredientsMargin * spacingMultiplier, 0.3),
      footerMargin: Math.max(baseSpacing.footerMargin * spacingMultiplier, 0.4)
    };
  };
  
  const dynamicSpacing = calculateSpacing(scalingFactors);

  return (
    <div 
      className="w-full h-full bg-card text-card-foreground font-inter" 
      style={{
        width: LABEL_DIMENSIONS.width,
        height: LABEL_DIMENSIONS.height,
        boxSizing: 'border-box',
        padding: '3mm',
        display: 'flex',
        flexDirection: 'column',
        fontSize: '6px',
        lineHeight: '1.2',
        position: 'relative',
        overflow: 'visible', // Allow content to be visible for debugging
        backgroundColor: '#ffffff' // Ensure white background for PDF
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
        
        {/* Meal Name - Dynamic sizing based on content analysis with mandatory spacing */}
        <h1 
          className="text-center font-bold text-foreground" 
          style={{ 
            fontSize: `${dynamicSizes.mealName}mm`,
            fontWeight: '800',
            lineHeight: '0.95',
            marginTop: `${Math.max(dynamicSpacing.mealNameMargin * 1.2, 1.0)}mm`, // Mandatory top spacing
            marginBottom: `${Math.max(dynamicSpacing.mealNameMargin * 1.5, 1.2)}mm`, // Mandatory bottom spacing
            paddingLeft: '2mm', // Mandatory side spacing
            paddingRight: '2mm', // Mandatory side spacing
            width: '100%',
            wordWrap: 'break-word',
            letterSpacing: '0.02em'
          }}
        >
          {data.mealName}
        </h1>
      </div>

      {/* Nutrition Bar - Dynamic sizing and spacing with mandatory bottom margin */}
      <div 
        className="text-center font-semibold text-primary" 
        style={{ 
          fontSize: `${dynamicSizes.nutrition}mm`,
          fontWeight: '650',
          lineHeight: '1.0',
          padding: `${dynamicSpacing.nutritionMargin}mm 0`,
          marginBottom: `${Math.max(dynamicSpacing.nutritionMargin * 1.5, 1.5)}mm`, // Mandatory bottom spacing
          background: 'linear-gradient(90deg, transparent, rgba(var(--primary), 0.08) 20%, rgba(var(--primary), 0.08) 80%, transparent)',
          letterSpacing: '0.01em'
        }}
      >
        {data.calories} Calories • {data.protein}g Protein • {data.fat}g Fat • {data.carbs}g Carbs
      </div>
      

      {/* Main Content - Dynamic density-aware layout */}
      <div className="flex-1" style={{ display: 'flex', flexDirection: 'column' }}>
        
        {/* Storage Instructions Section - Dynamic spacing */}
        <div style={{ marginBottom: `${dynamicSpacing.sectionMargin}mm` }}>
          <div 
            className="text-foreground text-center" 
            style={{ 
              fontSize: `${dynamicSizes.storage}mm`,
              fontWeight: '500',
              lineHeight: '1.15',
              marginBottom: `${dynamicSpacing.storageMargin}mm`
            }}
          >
            {storageHeatingInstructions}
          </div>
        </div>

        {/* Product Details Section - Dynamic content optimization */}
        <div style={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column'
        }}>
          
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
                // Phase 2: Advanced intelligent processing based on density and quality mode
                let processedIngredients = data.ingredients;
                
                // Progressive abbreviation based on content density
                if (contentDensity > 50) {
                  processedIngredients = processedIngredients
                    .replace(/\(Extra Virgin\)/g, '(EV)')
                    .replace(/\(Light\)/g, '(Lt)')
                    .replace(/Chicken Breast/g, 'Chicken');
                }
                
                if (contentDensity > 65) {
                  processedIngredients = processedIngredients
                    .replace(/Sweet Chilli Sauce/g, 'Sweet Chilli')
                    .replace(/Sriracha Sauce/g, 'Sriracha')
                    .replace(/Smoked Paprika/g, 'Paprika');
                }
                
                // Compact mode: Aggressive abbreviations for very long names
                if (scalingFactors.qualityMode === 'compact') {
                  processedIngredients = processedIngredients
                    .replace(/Olive Oil/g, 'Oil')
                    .replace(/Parsley/g, 'Parsley')
                    .replace(/Lime Juice/g, 'Lime')
                    .replace(/Chilli Flakes/g, 'Chilli')
                    .replace(/\s+/g, ' ') // Remove extra spaces
                    .replace(/\(\d+g\)/g, ''); // Remove weights in compact mode
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
              lineHeight: '1.2',
              marginBottom: `${dynamicSpacing.useByMargin}mm`
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

          {/* USE BY Date - Smaller, positioned before URL */}
          <div 
            className="font-bold text-foreground text-center" 
            style={{ 
              fontSize: `${dynamicSizes.useBy * 0.7}mm`, // Make it smaller
              fontWeight: '650',
              lineHeight: '1.0',
              marginBottom: '1mm',
              letterSpacing: '0.01em'
            }}
          >
            USE BY: {data.useByDate ? new Date(data.useByDate).toLocaleDateString('en-GB', {
              weekday: 'short',
              day: '2-digit',
              month: '2-digit',
              year: 'numeric'
            }) : 'Fri, 19/09/2025'}
          </div>

          {/* Website URL - Positioned directly under USE BY date */}
          <div 
            className="text-center font-medium text-primary" 
            style={{ 
              fontSize: `${dynamicSizes.footer}mm`,
              fontWeight: '550',
              lineHeight: '1.0',
              letterSpacing: '0.03em',
              borderTop: '0.15mm solid rgba(var(--primary), 0.25)',
              paddingTop: '1mm',
              marginBottom: '1mm'
            }}
          >
            www.fitfoodtasty.co.uk
          </div>
        </div>

      </div>
    </div>
  );
};