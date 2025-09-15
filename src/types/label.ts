// Unified label data structure for all label generation
export interface LabelData {
  mealName: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  ingredients: string;
  allergens: string;
  useByDate: string;
  storageInstructions?: string;
  heatingInstructions?: string;
  quantity?: number;
}

// Extended interface for components that need all fields
export interface FullLabelData extends LabelData {
  storageInstructions: string;
  heatingInstructions: string;
  quantity: number;
}

// Standard label dimensions (96 × 50.8mm for production compatibility)
export const LABEL_DIMENSIONS = {
  width: '96mm',
  height: '50.8mm',
  // A4 layout configuration
  labelsPerRow: 2,
  labelsPerColumn: 5,
  labelsPerPage: 10,
  pageWidth: '210mm',
  pageHeight: '297mm',
  pagePadding: '11.5mm 6.5mm',
  labelGap: '5mm'
} as const;

// Default instructions
export const DEFAULT_INSTRUCTIONS = {
  storage: 'Store in a refrigerator below 5°c. Heat in a microwave for 3–4 minutes or until piping hot.',
  heating: 'Pierce film and heat for 3-4 minutes or until piping hot.'
} as const;