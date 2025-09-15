// Phase 3: Production-ready label component with clean architecture
import React from 'react';
import logoImage from '@/assets/fit-food-tasty-logo.png';
import { LabelData, LABEL_DIMENSIONS, DEFAULT_INSTRUCTIONS } from '@/types/label';
import { LabelContentAnalyzer, ContentAnalysis } from './LabelContentAnalyzer';
import { LabelContentOptimizer } from './LabelContentOptimizer';

interface BaseLabelProps {
  data: LabelData;
  debugMode?: boolean; // Clean separation of debug functionality
}

// Phase 3: Debug component (completely separate from production rendering)
const LabelDebugInfo: React.FC<{ analysis: ContentAnalysis }> = ({ analysis }) => (
  <div 
    className="absolute top-0 left-0 bg-red-500/90 text-white text-xs p-1 z-50 rounded-br"
    style={{ fontSize: '8px', lineHeight: '1.2' }}
  >
    <div>Density: {analysis.density}%</div>
    <div>Mode: {analysis.scalingFactors.qualityMode}</div>
    <div>Scale: {analysis.scalingFactors.mealNameScale.toFixed(2)}x</div>
  </div>
);

// Phase 3: Clean, focused label component
export const BaseLabel: React.FC<BaseLabelProps> = ({ data, debugMode = false }) => {
  const storageInstructions = data.storageInstructions || DEFAULT_INSTRUCTIONS.storage;
  const heatingInstructions = data.heatingInstructions || DEFAULT_INSTRUCTIONS.heating;

  // Phase 3: Single point of content analysis
  const analysis = LabelContentAnalyzer.analyze(data);
  const dynamicSizes = LabelContentOptimizer.calculateDynamicSizes(analysis);
  const optimizedIngredients = LabelContentOptimizer.optimizeIngredients(data.ingredients, analysis);
  const contentVisibility = LabelContentOptimizer.shouldShowOptionalContent(analysis);
  const { spacing } = analysis;

  return (
    <div 
      className="relative w-full h-full bg-card text-card-foreground font-inter" 
      style={{
        width: LABEL_DIMENSIONS.width,
        height: LABEL_DIMENSIONS.height,
        boxSizing: 'border-box',
        padding: '3mm',
        display: 'flex',
        flexDirection: 'column',
        fontSize: '6px',
        lineHeight: '1.2',
        justifyContent: 'space-between'
      }}
    >
      {/* Phase 3: Debug overlay (only in debug mode) */}
      {debugMode && <LabelDebugInfo analysis={analysis} />}

      {/* Header Zone */}
      <div className="flex flex-col items-center" style={{ marginBottom: `${spacing.headerMargin}mm` }}>
        {/* Logo */}
        <div style={{ marginBottom: `${spacing.logoMargin}mm` }}>
          <img 
            src={logoImage} 
            alt="Fit Food Tasty logo"
            style={{ height: `${dynamicSizes.logo}mm`, width: 'auto', objectFit: 'contain' }}
          />
        </div>
        
        {/* Meal Name */}
        <h1 
          className="text-center font-bold text-foreground" 
          style={{ 
            fontSize: `${dynamicSizes.mealName}mm`,
            fontWeight: '800',
            lineHeight: '0.95',
            marginBottom: `${spacing.mealNameMargin}mm`,
            width: '100%',
            wordWrap: 'break-word',
            letterSpacing: '0.02em'
          }}
        >
          {data.mealName}
        </h1>
        
        {/* Visual separator */}
        <div 
          className="bg-primary/50" 
          style={{ 
            width: '25%', 
            height: '0.4mm', 
            marginBottom: `${spacing.separatorMargin}mm`
          }} 
          aria-hidden="true"
        />
      </div>

      {/* Nutrition Information */}
      {contentVisibility.showNutritionDetails && (
        <div 
          className="text-center font-medium text-muted-foreground" 
          style={{ 
            fontSize: `${dynamicSizes.nutrition}mm`,
            fontWeight: '600',
            lineHeight: '1.1',
            marginBottom: `${spacing.nutritionMargin}mm`,
            padding: '0.8mm 2mm',
            background: 'linear-gradient(90deg, transparent, rgba(var(--primary), 0.08) 20%, rgba(var(--primary), 0.08) 80%, transparent)',
            letterSpacing: '0.01em'
          }}
        >
          {data.calories} Calories • {data.protein}g Protein • {data.fat}g Fat • {data.carbs}g Carbs
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1" style={{ display: 'flex', flexDirection: 'column' }}>
        
        {/* Safety Information Section */}
        <div style={{ marginBottom: `${spacing.sectionMargin}mm` }}>
          
          {/* USE BY Date */}
          <div 
            className="text-center font-bold text-destructive mb-1" 
            style={{ 
              fontSize: `${dynamicSizes.instructions * 1.1}mm`,
              fontWeight: '750',
              lineHeight: '1.0',
              marginBottom: `${spacing.useByMargin}mm`,
              letterSpacing: '0.02em'
            }}
          >
            USE BY: {data.useByDate}
          </div>

          {/* Storage Instructions */}
          {contentVisibility.showDetailedInstructions && (
            <div 
              className="text-center font-medium text-foreground" 
              style={{ 
                fontSize: `${dynamicSizes.instructions}mm`,
                fontWeight: '600',
                lineHeight: '1.15',
                marginBottom: `${spacing.storageMargin}mm`,
                letterSpacing: '0.01em'
              }}
            >
              {storageInstructions}
            </div>
          )}

          {/* Heating Instructions */}
          {contentVisibility.showDetailedInstructions && heatingInstructions && (
            <div 
              className="text-center font-medium text-muted-foreground" 
              style={{ 
                fontSize: `${dynamicSizes.instructions * 0.95}mm`,
                fontWeight: '550',
                lineHeight: '1.1',
                marginBottom: `${spacing.storageMargin}mm`,
                fontStyle: 'italic',
                letterSpacing: '0.01em'
              }}
            >
              {heatingInstructions}
            </div>
          )}
        </div>

        {/* Ingredients Section */}
        <div style={{ marginBottom: `${spacing.ingredientsMargin}mm` }}>
          <div 
            className="text-left font-medium text-muted-foreground" 
            style={{ 
              fontSize: `${dynamicSizes.ingredients}mm`,
              fontWeight: '500',
              lineHeight: '1.2',
              letterSpacing: '0.005em'
            }}
          >
            <span 
              className="font-semibold text-foreground" 
              style={{ fontWeight: '650' }}
            >
              Ingredients:
            </span>{' '}
            <span>{optimizedIngredients}</span>
          </div>

          {/* Allergens */}
          {contentVisibility.showAllergens && data.allergens && (
            <div 
              className="text-left font-medium text-muted-foreground mt-1" 
              style={{ 
                fontSize: `${dynamicSizes.ingredients}mm`,
                fontWeight: '500',
                lineHeight: '1.15',
                marginTop: '0.6mm',
                letterSpacing: '0.005em'
              }}
            >
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

      {/* Footer Section */}
      <div 
        className="text-center font-medium text-primary" 
        style={{ 
          fontSize: `${dynamicSizes.footer}mm`,
          fontWeight: '550',
          lineHeight: '1.0',
          marginTop: `${spacing.footerMargin}mm`,
          paddingTop: `${spacing.footerMargin}mm`,
          borderTop: '0.15mm solid rgba(var(--primary), 0.25)',
          letterSpacing: '0.03em'
        }}
      >
        www.fitfoodtasty.co.uk
      </div>
    </div>
  );
};