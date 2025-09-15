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
    
    // Phase 2: Enhanced density scoring with advanced algorithms
    let densityScore = 0;
    
    // Meal name impact (considers word count and length)
    const mealNameWords = data.mealName.split(' ').length;
    const mealNameComplexity = mealNameLength + (mealNameWords * 3); // Multi-word names are more complex
    densityScore += Math.min(mealNameComplexity * 1.2, 25);
    
    // Ingredients impact (major factor with ingredient count analysis)
    const ingredientCount = data.ingredients ? data.ingredients.split(',').length : 0;
    const ingredientComplexity = ingredientsLength + (ingredientCount * 8); // More ingredients = higher complexity
    densityScore += Math.min(ingredientComplexity * 0.12, 40);
    
    // Allergens impact (safety critical)
    const allergenCount = data.allergens ? data.allergens.split(',').length : 0;
    densityScore += Math.min(allergensLength * 0.8 + (allergenCount * 4), 15);
    
    // Storage instructions impact
    densityScore += Math.min(storageLength * 0.1, 10);
    
    // Phase 2: Advanced complexity factors
    if (ingredientsLength > 300) densityScore += 15; // Extremely long ingredients
    if (ingredientCount > 12) densityScore += 10; // Many individual ingredients
    if (mealNameLength > 25) densityScore += 8; // Very long meal names
    if (allergenCount > 6) densityScore += 8; // Many allergens
    if (totalCharacters > 500) densityScore += 12; // Overall content overload
    
    return Math.min(Math.round(densityScore), 100);
  };

  // Phase 2: Advanced scaling with quality thresholds and emergency modes
  const getAdvancedScalingFactors = (density: number) => {
    // Phase 2: Emergency compression mode for extreme content
    if (density >= 95) {
      return {
        mealNameScale: 0.7,     // Emergency compression
        nutritionScale: 0.8,    // Aggressive reduction
        useByScale: 0.85,       // Maintain safety readability
        storageScale: 0.7,      // Heavy compression
        ingredientsScale: 0.6,  // Maximum compression
        allergensScale: 0.75,   // Safety priority
        spacingScale: 0.3,      // Ultra-tight spacing
        logoScale: 0.85,        // Compact logo
        qualityMode: 'emergency'
      };
    }
    
    // Very high density with quality preservation
    if (density >= 80) {
      return {
        mealNameScale: 0.75,    // Significant reduction
        nutritionScale: 0.82,   // Controlled reduction
        useByScale: 0.88,       // Safety priority
        storageScale: 0.75,     // Space efficient
        ingredientsScale: 0.65, // Aggressive but readable
        allergensScale: 0.8,    // Safety compliance
        spacingScale: 0.4,      // Very tight
        logoScale: 0.88,        // Slightly smaller
        qualityMode: 'compressed'
      };
    }
    
    // High density - balanced optimization
    if (density >= 65) {
      return {
        mealNameScale: 0.85,    // Moderate reduction
        nutritionScale: 0.92,   // Slight reduction
        useByScale: 0.95,       // Minimal impact
        storageScale: 0.85,     // Efficient spacing
        ingredientsScale: 0.8,  // Readable compression
        allergensScale: 0.9,    // Safety maintained
        spacingScale: 0.6,      // Tighter spacing
        logoScale: 0.95,        // Minimal reduction
        qualityMode: 'optimized'
      };
    }
    
    // Medium density - baseline perfection
    if (density >= 35) {
      return {
        mealNameScale: 1.0,
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
    
    // Low density - enhanced visual impact
    if (density >= 15) {
      return {
        mealNameScale: 1.25,    // Enhanced prominence
        nutritionScale: 1.15,   // Better visibility
        useByScale: 1.1,        // Clear safety info
        storageScale: 1.05,     // Improved readability
        ingredientsScale: 1.0,  // Maintain baseline
        allergensScale: 1.05,   // Clear safety
        spacingScale: 1.3,      // Premium spacing
        logoScale: 1.08,        // Enhanced branding
        qualityMode: 'enhanced'
      };
    }
    
    // Very low density - premium presentation
    return {
      mealNameScale: 1.4,      // Maximum impact
      nutritionScale: 1.25,    // Prominent display
      useByScale: 1.2,         // Clear communication
      storageScale: 1.15,      // Enhanced readability
      ingredientsScale: 1.1,   // Improved presentation
      allergensScale: 1.15,    // Clear safety info
      spacingScale: 1.5,       // Luxury spacing
      logoScale: 1.15,         // Strong branding
      qualityMode: 'premium'
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

  // Apply enhanced content analysis
  const contentDensity = analyzeContentDensity();
  const rawScalingFactors = getAdvancedScalingFactors(contentDensity);
  
  // Phase 2: Base sizes with enhanced precision
  const enhancedBaseSizes = {
    mealName: 5.2,
    nutrition: 3.0,
    useBy: 2.8,
    storage: 2.0,
    ingredients: 1.8,
    allergens: 1.9,
    logo: 10.0,
    footer: 1.9
  };
  
  // Calculate dynamic sizes with quality enforcement
  let dynamicSizes = {
    mealName: enhancedBaseSizes.mealName * rawScalingFactors.mealNameScale,
    nutrition: enhancedBaseSizes.nutrition * rawScalingFactors.nutritionScale,
    useBy: enhancedBaseSizes.useBy * rawScalingFactors.useByScale,
    storage: enhancedBaseSizes.storage * rawScalingFactors.storageScale,
    ingredients: enhancedBaseSizes.ingredients * rawScalingFactors.ingredientsScale,
    allergens: enhancedBaseSizes.allergens * rawScalingFactors.allergensScale,
    logo: enhancedBaseSizes.logo * rawScalingFactors.logoScale,
    footer: enhancedBaseSizes.footer
  };

  // Apply quality thresholds
  const qualityEnforced = enforceQualityThresholds(dynamicSizes, rawScalingFactors);
  dynamicSizes = qualityEnforced.sizes;
  const scalingFactors = qualityEnforced.factors;
  
  // Phase 2: Advanced spacing with adaptive algorithms
  const calculateAdvancedSpacing = (factors: any) => {
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
    
    // Apply advanced spacing algorithms based on quality mode
    const spacingMultiplier = factors.spacingScale;
    const qualityAdjustment = {
      emergency: 0.8,   // Even tighter in emergency mode
      compressed: 0.9,  // Slightly tighter
      optimized: 1.0,   // Standard
      optimal: 1.0,     // Perfect baseline
      enhanced: 1.1,    // Slightly more generous
      premium: 1.2      // Luxury spacing
    };
    
    const adjustment = qualityAdjustment[factors.qualityMode] || 1.0;
    const finalMultiplier = spacingMultiplier * adjustment;
    
    return {
      headerMargin: Math.max(baseSpacing.headerMargin * finalMultiplier, 0.3),
      logoMargin: Math.max(baseSpacing.logoMargin * finalMultiplier, 0.2),
      mealNameMargin: Math.max(baseSpacing.mealNameMargin * finalMultiplier, 0.3),
      separatorMargin: Math.max(baseSpacing.separatorMargin * finalMultiplier, 0.3),
      nutritionMargin: Math.max(baseSpacing.nutritionMargin * finalMultiplier, 0.4),
      sectionMargin: Math.max(baseSpacing.sectionMargin * finalMultiplier, 0.4),
      useByMargin: Math.max(baseSpacing.useByMargin * finalMultiplier, 0.2),
      storageMargin: Math.max(baseSpacing.storageMargin * finalMultiplier, 0.3),
      ingredientsMargin: Math.max(baseSpacing.ingredientsMargin * finalMultiplier, 0.3),
      footerMargin: Math.max(baseSpacing.footerMargin * finalMultiplier, 0.4)
    };
  };
  
  const dynamicSpacing = calculateAdvancedSpacing(rawScalingFactors);

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
      
      {/* Phase 2: Enhanced debug information */}
      <div className="text-center text-xs text-gray-500" style={{ fontSize: '1mm', marginBottom: '1mm' }}>
        Density: {contentDensity}% | Mode: {rawScalingFactors.qualityMode} | Scale: {rawScalingFactors.mealNameScale.toFixed(2)}x
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
                
                // Emergency mode: Aggressive abbreviations
                if (rawScalingFactors.qualityMode === 'emergency') {
                  processedIngredients = processedIngredients
                    .replace(/Olive Oil/g, 'Oil')
                    .replace(/Parsley/g, 'Parsley')
                    .replace(/Lime Juice/g, 'Lime')
                    .replace(/Chilli Flakes/g, 'Chilli')
                    .replace(/\s+/g, ' ') // Remove extra spaces
                    .replace(/\(\d+g\)/g, ''); // Remove weights in emergency
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