import React from 'react';
import { format as formatDate } from 'date-fns';
import { SingleLabel } from '@/components/shared/SingleLabel';

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
  storageInstructions?: string;
  heatingInstructions?: string;
  orderCount: number;
}

interface LabelPrintPreviewProps {
  mealProduction: MealProduction[];
  useByDate?: string;
}

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
          @page {
            size: A4 portrait;
            margin: 0;
          }
          @media print {
            html, body {
              width: 210mm;
              height: 297mm;
              margin: 0 !important;
              padding: 0 !important;
              background: white !important;
            }
            * {
              box-shadow: none !important;
            }
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
            /* Hide toast notifications and overlays during print */
            [data-sonner-toaster], 
            [data-testid="toast"], 
            .toast, 
            .toast-container,
            [role="alert"],
            [data-state="open"][role="alertdialog"] {
              display: none !important;
            }
            .print-page {
              margin: 0 !important;
              padding: 11.5mm 6.5mm !important;
              background: white !important;
              display: grid !important;
              grid-template-columns: repeat(2, 96mm) !important;
              grid-template-rows: repeat(5, 50.8mm) !important;
              column-gap: 5mm !important;
              row-gap: 5mm !important;
              width: 210mm !important;
              height: 297mm !important;
              box-sizing: border-box !important;
              align-content: start !important;
              justify-content: center !important;
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
            column-gap: 5mm;
            row-gap: 5mm;
            padding: 11.5mm 6.5mm;
            box-sizing: border-box;
            align-content: start;
            justify-content: center;
          }

          /* Force exact label dimensions and positioning */
          .print-page > div > div {
            width: 96mm !important;
            height: 50.8mm !important;
            box-sizing: border-box !important;
            display: flex !important;
            flex-direction: column !important;
            overflow: hidden !important;
          }
        `
      }} />
      
      <div className="no-print mb-4 p-4 bg-white rounded border">
        <h3 className="text-lg font-semibold mb-2">Label Layout Preview</h3>
        <p className="text-sm text-gray-600 mb-2">
          Preview shows exactly how labels will print on A4 paper (96mm × 50.8mm, 2×5 layout).
        </p>
        <div className="text-sm text-gray-500">
          <span className="font-medium">Total Labels:</span> {allLabels.length} • 
          <span className="font-medium ml-2">Pages:</span> {totalPages}
        </div>
      </div>

      {pages.map(({ pageLabels, pageIndex }) => (
        <div key={pageIndex} className={`print-page ${pageIndex < pages.length - 1 ? 'page-break' : ''}`} role="region" aria-label={`Label page ${pageIndex + 1}`}>

          {pageLabels.map(({ meal }, labelIndex) => {
            // Debug log for ingredients data flow
            if (meal) {
              console.log(`Label ${labelIndex + 1} - Meal: ${meal.mealName}`, {
                ingredients: meal.ingredients,
                allergens: meal.allergens,
                hasIngredients: !!meal.ingredients,
                ingredientsLength: meal.ingredients?.length || 0
              });
            }
            
            return (
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
                    storageInstructions={meal.storageInstructions}
                    heatingInstructions={meal.heatingInstructions}
                    useByDate={useByDate}
                  />
                ) : (
                  <div style={{ 
                    width: '96mm', 
                    height: '50.8mm',
                    border: '1px dashed #ccc', 
                    opacity: 0.25,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#999',
                    fontSize: '10px',
                    position: 'relative'
                  }}>
                    <div style={{position:'absolute', left:'6px', right:'6px', bottom:'6px', borderTop:'1px dashed #ccc', paddingTop: '4px', textAlign:'center'}}>Empty</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
      
      <div className="no-print mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
        <h4 className="font-semibold text-yellow-800 mb-2">Printing Instructions:</h4>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• Use A4 paper (210mm × 297mm)</li>
          <li>• Set printer to 100% scale (no fit to page)</li>
          <li>• Disable margins or set to minimum</li>
          <li>• Disable browser headers and footers in the print dialog</li>
          <li>• Use portrait orientation</li>
          <li>• For best results, use adhesive label sheets (96mm × 50.8mm, 2×5 layout)</li>
        </ul>
      </div>
    </div>
  );
};