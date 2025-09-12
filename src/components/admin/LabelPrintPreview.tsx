import React from 'react';
import { format as formatDate } from 'date-fns';
import logoImage from '@/assets/fit-food-tasty-logo.png';

interface MealProduction {
  mealId: string;
  mealName: string;
  quantity: number;
  totalCalories: number;
  totalProtein: number;
  totalFat: number;
  totalCarbs: number;
  ingredients: string;
  allergens: string;
  orderCount: number;
}

interface LabelPrintPreviewProps {
  mealProduction: MealProduction[];
  useByDate?: string;
}

// Reuse the exact same SingleLabel component from LabelPreview
const SingleLabel: React.FC<{ 
  mealName: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  ingredients: string;
  allergens: string;
  useByDate: string;
}> = ({ mealName, calories, protein, fat, carbs, ingredients, allergens, useByDate }) => (
  <div className="w-full h-full bg-card text-card-foreground font-inter" style={{
    width: '96mm',    // Updated to match the correct specifications
    height: '50.8mm', // Updated to match the correct specifications
    boxSizing: 'border-box',
    padding: '6px',
    display: 'flex',
    flexDirection: 'column',
    fontSize: '6px',
    lineHeight: '1.2'
  }}>
    {/* Header Section */}
    <div className="flex flex-col items-center">
      {/* Logo */}
      <div className="mb-2">
        <img 
          src={logoImage} 
          alt="Fit Food Tasty" 
          className="h-8 w-auto object-contain"
        />
      </div>
      
      {/* Meal Name */}
      <h1 className="text-center font-bold text-foreground leading-tight mb-2" style={{ fontSize: '14px' }}>
        {mealName}
      </h1>
      
      {/* Separator */}
      <div className="w-8 h-px bg-primary/30 mb-2"></div>
    </div>

    {/* Nutrition Section */}
    <div className="bg-gradient-to-r from-primary/8 to-primary/12 rounded border border-primary/20 px-2 py-1.5 mb-2">
      <div className="text-center font-bold text-primary leading-tight" style={{ fontSize: '8px' }}>
        {calories} Calories • {protein}g Protein • {fat}g Fat • {carbs}g Carbs
      </div>
    </div>

    {/* Main Content */}
    <div className="flex-1 space-y-1.5">
      {/* Use By Date - Most Important */}
      <div className="bg-muted/50 rounded px-2 py-1">
        <div className="font-bold text-foreground leading-tight" style={{ fontSize: '7px' }}>
          USE BY: {useByDate ? new Date(useByDate).toLocaleDateString('en-GB', {
            weekday: 'short',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          }) : 'Fri, 19/09/2025'}
        </div>
      </div>

      {/* Storage Instructions */}
      <div className="text-muted-foreground leading-tight" style={{ fontSize: '6px' }}>
        Store in a refrigerator below 5°c. Heat in a microwave for 3-4 minutes or until piping hot.
      </div>

      {/* Ingredients */}
      <div className="leading-tight" style={{ fontSize: '6px' }}>
        <span className="font-semibold text-foreground">Ingredients:</span>{' '}
        <span className="text-muted-foreground">{ingredients || 'Not specified'}</span>
      </div>

      {/* Allergens */}
      {allergens && (
        <div className="leading-tight" style={{ fontSize: '6px' }}>
          <span className="font-semibold text-foreground">Allergens:</span>{' '}
          <span className="font-bold text-foreground">{allergens}</span>
        </div>
      )}
    </div>

    {/* Footer */}
    <div className="border-t border-border/30 pt-1 mt-2">
      <div className="text-center font-medium text-primary leading-tight" style={{ fontSize: '6px' }}>
        www.fitfoodtasty.co.uk
      </div>
    </div>
  </div>
);

export const LabelPrintPreview: React.FC<LabelPrintPreviewProps> = ({ 
  mealProduction, 
  useByDate = formatDate(new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd')
}) => {
  // Create all labels array
  const allLabels: Array<{meal: MealProduction, labelIndex: number}> = [];
  mealProduction.forEach(meal => {
    for (let i = 0; i < meal.quantity; i++) {
      allLabels.push({ meal, labelIndex: i + 1 });
    }
  });

  // Calculate pages (10 labels per page - 2 across × 5 down)
  const labelsPerPage = 10;
  const totalPages = Math.ceil(allLabels.length / labelsPerPage);
  
  const pages = [];
  for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
    const startIndex = pageIndex * labelsPerPage;
    const endIndex = Math.min(startIndex + labelsPerPage, allLabels.length);
    const pageLabels = allLabels.slice(startIndex, endIndex);
    
    // Fill remaining slots with empty divs to maintain grid structure
    while (pageLabels.length < labelsPerPage) {
      pageLabels.push({ meal: null, labelIndex: 0 } as any);
    }

    pages.push({ pageLabels, pageIndex });
  }

  return (
    <div className="print-preview bg-gray-100 p-4">
      <style dangerouslySetInnerHTML={{
        __html: `
          @media print {
            .print-preview {
              margin: 0 !important;
              padding: 0 !important;
              background: white !important;
            }
            .page-break {
              page-break-after: always;
            }
            .no-print {
              display: none !important;
            }
          }
          
          .print-page {
            width: 210mm;
            height: 297mm;
            margin: 0 auto 20px auto;
            background: white;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
            position: relative;
            display: grid;
            grid-template-columns: repeat(2, 96mm);
            grid-template-rows: repeat(5, 50.8mm);
            gap: 5mm;
            padding: 11.5mm 6.5mm;
            box-sizing: border-box;
          }
          
          @media print {
            .print-page {
              margin: 0 !important;
              padding: 11.5mm 6.5mm !important;
              box-shadow: none !important;
            }
          }
        `
      }} />
      
      <div className="no-print mb-4 p-4 bg-white rounded border">
        <h3 className="text-lg font-semibold mb-2">Print Preview</h3>
        <p className="text-sm text-gray-600 mb-2">
          This preview shows exactly how your labels will appear when printed on A4 paper using your label generator design.
        </p>
        <div className="text-sm text-gray-500">
          <span className="font-medium">Total Labels:</span> {allLabels.length} • 
          <span className="font-medium ml-2">Pages:</span> {totalPages} • 
          <span className="font-medium ml-2">Layout:</span> 2 across × 5 down per page
        </div>
      </div>

      {pages.map(({ pageLabels, pageIndex }) => (
        <div key={pageIndex} className={`print-page ${pageIndex < pages.length - 1 ? 'page-break' : ''}`}>
          {pageLabels.map(({ meal }, labelIndex) => (
            <div key={`${meal?.mealId || 'empty'}-${labelIndex}`}>
              {meal ? (
                <SingleLabel
                  mealName={meal.mealName}
                  calories={meal.totalCalories}
                  protein={meal.totalProtein}
                  fat={meal.totalFat}
                  carbs={meal.totalCarbs}
                  ingredients={meal.ingredients}
                  allergens={meal.allergens}
                  useByDate={useByDate}
                />
              ) : (
                <div style={{ 
                  width: '96mm', 
                  height: '50.8mm',
                  border: '1px dashed #ccc', 
                  opacity: 0.3,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#999',
                  fontSize: '10px'
                }}>
                  Empty
                </div>
              )}
            </div>
          ))}
        </div>
      ))}
      
      <div className="no-print mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
        <h4 className="font-semibold text-yellow-800 mb-2">Printing Instructions:</h4>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• Use A4 paper (210mm × 297mm)</li>
          <li>• Set printer to 100% scale (no fit to page)</li>
          <li>• Disable margins or set to minimum</li>
          <li>• Use portrait orientation</li>
          <li>• For best results, use adhesive label sheets (96mm × 50.8mm, 2×5 layout)</li>
        </ul>
      </div>
    </div>
  );
};