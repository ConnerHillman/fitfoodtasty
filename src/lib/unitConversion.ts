// Unit conversion utilities for kitchen production calculations

export type WeightUnit = 'g' | 'kg' | 'lb' | 'oz';
export type VolumeUnit = 'ml' | 'l' | 'fl oz' | 'cup' | 'pint' | 'quart' | 'gallon';
export type CountUnit = 'piece' | 'pcs' | 'item' | 'each' | 'whole';
export type SupportedUnit = WeightUnit | VolumeUnit | CountUnit | string;

export interface UnitConversion {
  value: number;
  unit: string;
  baseValue: number;
  baseUnit: string;
  category: 'weight' | 'volume' | 'count' | 'other';
}

// Weight conversions to grams (base unit)
const WEIGHT_TO_GRAMS: Record<WeightUnit, number> = {
  'g': 1,
  'kg': 1000,
  'lb': 453.592,
  'oz': 28.3495
};

// Volume conversions to milliliters (base unit)
const VOLUME_TO_ML: Record<VolumeUnit, number> = {
  'ml': 1,
  'l': 1000,
  'fl oz': 29.5735,
  'cup': 236.588,
  'pint': 473.176,
  'quart': 946.353,
  'gallon': 3785.41
};

// Count units (no conversion needed, but tracked for consistency)
const COUNT_UNITS: Set<CountUnit> = new Set(['piece', 'pcs', 'item', 'each', 'whole']);

/**
 * Determines the category of a unit
 */
export function getUnitCategory(unit: string): 'weight' | 'volume' | 'count' | 'other' {
  const normalizedUnit = unit.toLowerCase().trim();
  
  if (normalizedUnit in WEIGHT_TO_GRAMS) {
    return 'weight';
  }
  if (normalizedUnit in VOLUME_TO_ML) {
    return 'volume';
  }
  if (COUNT_UNITS.has(normalizedUnit as CountUnit)) {
    return 'count';
  }
  return 'other';
}

/**
 * Converts a quantity to its base unit within the same category
 */
export function convertToBaseUnit(quantity: number, unit: string): UnitConversion {
  const normalizedUnit = unit.toLowerCase().trim();
  const category = getUnitCategory(normalizedUnit);
  
  switch (category) {
    case 'weight': {
      const conversionFactor = WEIGHT_TO_GRAMS[normalizedUnit as WeightUnit];
      const baseValue = quantity * conversionFactor;
      const baseUnit = baseValue >= 1000 ? 'kg' : 'g';
      const displayValue = baseValue >= 1000 ? baseValue / 1000 : baseValue;
      
      return {
        value: quantity,
        unit: normalizedUnit,
        baseValue: displayValue,
        baseUnit,
        category
      };
    }
    
    case 'volume': {
      const conversionFactor = VOLUME_TO_ML[normalizedUnit as VolumeUnit];
      const baseValue = quantity * conversionFactor;
      const baseUnit = baseValue >= 1000 ? 'l' : 'ml';
      const displayValue = baseValue >= 1000 ? baseValue / 1000 : baseValue;
      
      return {
        value: quantity,
        unit: normalizedUnit,
        baseValue: displayValue,
        baseUnit,
        category
      };
    }
    
    case 'count':
    case 'other':
    default: {
      return {
        value: quantity,
        unit: normalizedUnit,
        baseValue: quantity,
        baseUnit: normalizedUnit,
        category
      };
    }
  }
}

/**
 * Aggregates quantities of the same ingredient across different units
 * Returns the total in the most appropriate base unit
 */
export function aggregateQuantities(quantities: Array<{ quantity: number; unit: string }>): UnitConversion {
  if (quantities.length === 0) {
    return {
      value: 0,
      unit: 'g',
      baseValue: 0,
      baseUnit: 'g',
      category: 'weight'
    };
  }
  
  // Convert all quantities to their base units
  const conversions = quantities.map(q => convertToBaseUnit(q.quantity, q.unit));
  
  // Group by category
  const byCategory = conversions.reduce((acc, conv) => {
    if (!acc[conv.category]) {
      acc[conv.category] = [];
    }
    acc[conv.category].push(conv);
    return acc;
  }, {} as Record<string, UnitConversion[]>);
  
  // Find the dominant category (most conversions)
  const dominantCategory = Object.keys(byCategory).reduce((a, b) => 
    byCategory[a].length > byCategory[b].length ? a : b
  );
  
  const dominantConversions = byCategory[dominantCategory];
  
  if (dominantCategory === 'weight') {
    // Sum all weights in grams, then convert to appropriate display unit
    const totalGrams = dominantConversions.reduce((sum, conv) => {
      const gramsValue = conv.value * (WEIGHT_TO_GRAMS[conv.unit as WeightUnit] || 1);
      return sum + gramsValue;
    }, 0);
    
    const baseUnit = totalGrams >= 1000 ? 'kg' : 'g';
    const baseValue = totalGrams >= 1000 ? totalGrams / 1000 : totalGrams;
    
    return {
      value: totalGrams,
      unit: 'g',
      baseValue,
      baseUnit,
      category: 'weight'
    };
  }
  
  if (dominantCategory === 'volume') {
    // Sum all volumes in ml, then convert to appropriate display unit
    const totalMl = dominantConversions.reduce((sum, conv) => {
      const mlValue = conv.value * (VOLUME_TO_ML[conv.unit as VolumeUnit] || 1);
      return sum + mlValue;
    }, 0);
    
    const baseUnit = totalMl >= 1000 ? 'l' : 'ml';
    const baseValue = totalMl >= 1000 ? totalMl / 1000 : totalMl;
    
    return {
      value: totalMl,
      unit: 'ml',
      baseValue,
      baseUnit,
      category: 'volume'
    };
  }
  
  // For count or other units, just sum the values
  const total = dominantConversions.reduce((sum, conv) => sum + conv.baseValue, 0);
  const firstUnit = dominantConversions[0];
  
  return {
    value: total,
    unit: firstUnit.unit,
    baseValue: total,
    baseUnit: firstUnit.baseUnit,
    category: dominantCategory as 'count' | 'other'
  };
}

/**
 * Formats a quantity with its unit for display
 */
export function formatQuantity(conversion: UnitConversion, precision: number = 1): string {
  const value = Number(conversion.baseValue.toFixed(precision));
  return `${value}${conversion.baseUnit}`;
}

/**
 * Validates if units can be safely aggregated together
 */
export function canAggregateUnits(units: string[]): { canAggregate: boolean; reason?: string } {
  if (units.length <= 1) {
    return { canAggregate: true };
  }
  
  const categories = units.map(getUnitCategory);
  const uniqueCategories = [...new Set(categories)];
  
  if (uniqueCategories.length === 1) {
    return { canAggregate: true };
  }
  
  return {
    canAggregate: false,
    reason: `Cannot mix units from different categories: ${uniqueCategories.join(', ')}`
  };
}