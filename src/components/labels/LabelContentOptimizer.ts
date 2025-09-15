// Phase 3: Smart content optimization for label rendering
import { LabelData } from '@/types/label';
import { ContentAnalysis } from './LabelContentAnalyzer';

export class LabelContentOptimizer {
  static optimizeIngredients(ingredients: string, analysis: ContentAnalysis): string {
    if (!ingredients) return '';
    
    // Progressive abbreviation based on content density
    const { density, qualityMode } = analysis;
    
    if (density < 50) {
      return ingredients; // No optimization needed for low density
    }

    let optimized = ingredients;

    // Level 1: Basic abbreviations (density 50-70)
    if (density >= 50) {
      const basicReplacements = {
        'Sunflower oil': 'Sunflower oil',
        'Rapeseed oil': 'Rapeseed oil',
        'Natural flavourings': 'Natural flavours',
        'Emulsifier': 'Emuls.',
        'Stabiliser': 'Stab.',
        'Preservative': 'Pres.',
        'Antioxidant': 'Antiox.',
        'Acidity regulator': 'Acid. reg.',
        'Colour': 'Col.',
        'Flavour enhancer': 'Flav. enh.'
      };

      Object.entries(basicReplacements).forEach(([full, abbrev]) => {
        optimized = optimized.replace(new RegExp(full, 'gi'), abbrev);
      });
    }

    // Level 2: Aggressive abbreviations (density 70-85)
    if (density >= 70) {
      const aggressiveReplacements = {
        'Water': 'Water',
        'Salt': 'Salt',
        'Sugar': 'Sugar',
        'Modified': 'Mod.',
        'Concentrate': 'Conc.',
        'Extract': 'Ext.',
        'Powder': 'Pwd.',
        'Vitamin': 'Vit.',
        'Mineral': 'Min.',
        'Protein': 'Prot.',
        'Calcium': 'Ca',
        'Sodium': 'Na',
        'Potassium': 'K',
        'Phosphorus': 'P'
      };

      Object.entries(aggressiveReplacements).forEach(([full, abbrev]) => {
        optimized = optimized.replace(new RegExp(`\\b${full}\\b`, 'gi'), abbrev);
      });
    }

    // Level 3: Emergency mode optimizations (density 85+)
    if (qualityMode === 'emergency') {
      optimized = optimized
        .replace(/\band\b/gi, '&')
        .replace(/\bcontains\b/gi, 'cont.')
        .replace(/\bincluding\b/gi, 'incl.')
        .replace(/\bderived from\b/gi, 'from')
        .replace(/\bmay contain\b/gi, 'may cont.')
        .replace(/\bproduced in\b/gi, 'prod. in');
    }

    return optimized;
  }

  static calculateDynamicSizes(analysis: ContentAnalysis) {
    const baseSizes = {
      logo: 6.5,
      mealName: 3.5,
      nutrition: 2.2,
      instructions: 1.8,
      ingredients: 1.6,
      footer: 1.5
    };

    const { scalingFactors } = analysis;

    return {
      logo: baseSizes.logo, // Logo remains constant for brand recognition
      mealName: baseSizes.mealName * scalingFactors.mealNameScale,
      nutrition: baseSizes.nutrition * scalingFactors.nutritionScale,
      instructions: baseSizes.instructions * scalingFactors.instructionsScale,
      ingredients: baseSizes.ingredients * scalingFactors.ingredientsScale,
      footer: baseSizes.footer * scalingFactors.footerScale
    };
  }

  static shouldShowOptionalContent(analysis: ContentAnalysis): {
    showAllergens: boolean;
    showDetailedInstructions: boolean;
    showNutritionDetails: boolean;
  } {
    const { qualityMode, density } = analysis;

    return {
      showAllergens: density < 95, // Hide allergens only in extreme emergency
      showDetailedInstructions: qualityMode !== 'emergency',
      showNutritionDetails: density < 90
    };
  }
}