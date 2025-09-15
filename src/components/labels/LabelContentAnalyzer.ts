// Phase 3: Production-grade content analysis engine
import { LabelData, DEFAULT_INSTRUCTIONS } from '@/types/label';

export type QualityMode = 'emergency' | 'compressed' | 'optimized' | 'optimal' | 'enhanced' | 'premium';

export interface ContentAnalysis {
  density: number;
  complexity: number;
  qualityMode: QualityMode;
  scalingFactors: ScalingFactors;
  spacing: SpacingConfig;
}

export interface ScalingFactors {
  mealNameScale: number;
  nutritionScale: number;
  instructionsScale: number;
  ingredientsScale: number;
  footerScale: number;
  spacingScale: number;
  qualityMode: QualityMode;
}

export interface SpacingConfig {
  headerMargin: number;
  logoMargin: number;
  mealNameMargin: number;
  separatorMargin: number;
  nutritionMargin: number;
  sectionMargin: number;
  useByMargin: number;
  storageMargin: number;
  ingredientsMargin: number;
  footerMargin: number;
}

export class LabelContentAnalyzer {
  private static analyzeContentDensity(data: LabelData): number {
    const storageInstructions = data.storageInstructions || DEFAULT_INSTRUCTIONS.storage;
    
    const mealNameLength = data.mealName.length;
    const ingredientsLength = data.ingredients ? data.ingredients.length : 0;
    const allergensLength = data.allergens ? data.allergens.length : 0;
    const storageLength = storageInstructions.length;
    
    const totalCharacters = mealNameLength + ingredientsLength + allergensLength + storageLength;
    
    let densityScore = 0;
    
    // Meal name impact (considers word count and length)
    const mealNameWords = data.mealName.split(' ').length;
    const mealNameComplexity = mealNameLength + (mealNameWords * 3);
    densityScore += Math.min(mealNameComplexity * 1.2, 25);
    
    // Ingredients impact (major factor with ingredient count analysis)
    const ingredientCount = data.ingredients ? data.ingredients.split(',').length : 0;
    const ingredientComplexity = ingredientsLength + (ingredientCount * 8);
    densityScore += Math.min(ingredientComplexity * 0.12, 40);
    
    // Allergens impact (safety critical)
    const allergenCount = data.allergens ? data.allergens.split(',').length : 0;
    densityScore += Math.min(allergensLength * 0.8 + (allergenCount * 4), 15);
    
    // Storage instructions impact
    densityScore += Math.min(storageLength * 0.1, 10);
    
    // Advanced complexity factors
    if (ingredientsLength > 300) densityScore += 15;
    if (ingredientCount > 12) densityScore += 10;
    if (mealNameLength > 25) densityScore += 8;
    if (allergenCount > 6) densityScore += 8;
    if (totalCharacters > 500) densityScore += 12;
    
    return Math.min(Math.round(densityScore), 100);
  }

  private static getQualityMode(density: number): QualityMode {
    if (density >= 85) return 'emergency';
    if (density >= 70) return 'compressed';
    if (density >= 55) return 'optimized';
    if (density >= 35) return 'optimal';
    if (density >= 20) return 'enhanced';
    return 'premium';
  }

  private static calculateScalingFactors(density: number, qualityMode: QualityMode): ScalingFactors {
    const baseSizes = {
      mealName: 3.5,
      nutrition: 2.2,
      instructions: 1.8,
      ingredients: 1.6,
      footer: 1.5
    };

    const qualitySettings = {
      emergency: { range: [-30, -20], spacingScale: 0.7 },
      compressed: { range: [-25, -15], spacingScale: 0.8 },
      optimized: { range: [-15, -5], spacingScale: 0.9 },
      optimal: { range: [-5, 5], spacingScale: 1.0 },
      enhanced: { range: [5, 15], spacingScale: 1.1 },
      premium: { range: [15, 25], spacingScale: 1.2 }
    };

    const settings = qualitySettings[qualityMode];
    const normalizedDensity = Math.max(0, Math.min(1, density / 100));
    const scaleFactor = 1 + (settings.range[0] + (settings.range[1] - settings.range[0]) * (1 - normalizedDensity)) / 100;

    return {
      mealNameScale: scaleFactor,
      nutritionScale: scaleFactor * 0.95,
      instructionsScale: scaleFactor * 0.9,
      ingredientsScale: scaleFactor * 0.85,
      footerScale: scaleFactor * 0.8,
      spacingScale: settings.spacingScale,
      qualityMode
    };
  }

  private static enforceQualityThresholds(factors: ScalingFactors): ScalingFactors {
    const minimums = {
      mealName: 3.0,
      nutrition: 2.0,
      instructions: 1.6,
      ingredients: 1.4,
      footer: 1.3
    };

    return {
      ...factors,
      mealNameScale: Math.max(factors.mealNameScale, minimums.mealName / 3.5),
      nutritionScale: Math.max(factors.nutritionScale, minimums.nutrition / 2.2),
      instructionsScale: Math.max(factors.instructionsScale, minimums.instructions / 1.8),
      ingredientsScale: Math.max(factors.ingredientsScale, minimums.ingredients / 1.6),
      footerScale: Math.max(factors.footerScale, minimums.footer / 1.5)
    };
  }

  private static calculateSpacing(factors: ScalingFactors): SpacingConfig {
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

    const qualityAdjustments = {
      emergency: 0.8,
      compressed: 0.9,
      optimized: 1.0,
      optimal: 1.0,
      enhanced: 1.1,
      premium: 1.2
    };

    const adjustment = qualityAdjustments[factors.qualityMode] || 1.0;
    const finalMultiplier = factors.spacingScale * adjustment;

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
  }

  static analyze(data: LabelData): ContentAnalysis {
    const density = this.analyzeContentDensity(data);
    const qualityMode = this.getQualityMode(density);
    const rawFactors = this.calculateScalingFactors(density, qualityMode);
    const scalingFactors = this.enforceQualityThresholds(rawFactors);
    const spacing = this.calculateSpacing(scalingFactors);

    return {
      density,
      complexity: density, // For backward compatibility
      qualityMode,
      scalingFactors,
      spacing
    };
  }
}