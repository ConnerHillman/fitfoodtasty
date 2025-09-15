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
}> = ({ mealName, calories, protein, fat, carbs, ingredients, allergens, useByDate }) => {
  // Format ingredients with bullet points and highlight allergens
  const formatIngredients = (ingredientsList: string, allergensList: string) => {
    if (!ingredientsList) return 'Not specified';
    
    const ingredients = ingredientsList.split(', ').map(ing => ing.trim());
    const allergens = allergensList.split(', ').map(all => all.trim().toLowerCase());
    
    return ingredients.map(ingredient => {
      const isAllergen = allergens.some(allergen => 
        ingredient.toLowerCase().includes(allergen) || 
        allergen.includes(ingredient.toLowerCase())
      );
      return isAllergen ? `**${ingredient}**` : ingredient;
    }).map(ing => `• ${ing}`).join('\n');
  };

  return (
    <div 
      className="w-full h-full font-inter relative overflow-hidden"
      style={{
        width: '96mm',
        height: '50.8mm',
        boxSizing: 'border-box',
        background: 'linear-gradient(135deg, #e6ffe6 0%, #ffffff 50%, #f0fff0 100%)',
        border: '1px solid #d4d4d8',
        borderRadius: '2px',
        display: 'flex',
        flexDirection: 'column',
        fontSize: '6px',
        lineHeight: '1.3',
        position: 'relative'
      }}
    >
      {/* Premium Header with larger logo */}
      <div className="text-center px-3 py-2" style={{ backgroundColor: 'rgba(34, 197, 94, 0.05)' }}>
        <div className="flex justify-center mb-1">
          <img 
            src={logoImage} 
            alt="Fit Food Tasty"
            style={{ height: '12mm', width: 'auto', objectFit: 'contain' }}
          />
        </div>
        <h1 className="font-bold text-gray-800 leading-tight mb-1" style={{ fontSize: '11px', fontFamily: 'serif' }}>
          {mealName}
        </h1>
        <div className="text-center text-green-600 font-medium italic" style={{ fontSize: '5px', fontFamily: 'serif' }}>
          Fresh, Fit, Flavorful
        </div>
      </div>

      {/* Premium Nutrition Box */}
      <div className="mx-2 mb-2 bg-green-50 border border-green-200 rounded px-2 py-1.5">
        <div className="grid grid-cols-2 gap-1 text-center">
          <div>
            <div className="font-bold text-gray-800" style={{ fontSize: '7px' }}>**{calories}**</div>
            <div className="text-gray-600" style={{ fontSize: '5px' }}>CALORIES</div>
          </div>
          <div>
            <div className="font-bold text-gray-800" style={{ fontSize: '7px' }}>**{protein}g**</div>
            <div className="text-gray-600" style={{ fontSize: '5px' }}>PROTEIN</div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-1 text-center mt-1">
          <div>
            <div className="font-bold text-gray-800" style={{ fontSize: '7px' }}>**{fat}g**</div>
            <div className="text-gray-600" style={{ fontSize: '5px' }}>FAT</div>
          </div>
          <div>
            <div className="font-bold text-gray-800" style={{ fontSize: '7px' }}>**{carbs}g**</div>
            <div className="text-gray-600" style={{ fontSize: '5px' }}>CARBS</div>
          </div>
        </div>
      </div>

      {/* Use By Date with Icon */}
      <div className="mx-2 mb-1 bg-yellow-50 border border-yellow-200 rounded px-2 py-1 flex items-center gap-1">
        <div style={{ fontSize: '6px' }}>📅</div>
        <div className="font-bold text-gray-800 leading-tight" style={{ fontSize: '6px' }}>
          USE BY: {useByDate ? new Date(useByDate).toLocaleDateString('en-GB', {
            weekday: 'short',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          }) : 'Fri, 19/09/2025'}
        </div>
      </div>

      {/* Storage & Heating Instructions with Icon */}
      <div className="mx-2 mb-1 bg-blue-50 border border-blue-200 rounded px-2 py-1">
        <div className="flex items-center gap-1 mb-1">
          <div style={{ fontSize: '6px' }}>🔥</div>
          <div className="text-gray-700 font-medium" style={{ fontSize: '5px' }}>HEATING</div>
        </div>
        <div className="text-gray-600 leading-tight" style={{ fontSize: '5px' }}>
          Microwave 3-4 mins until piping hot
        </div>
        <div className="text-gray-600 leading-tight" style={{ fontSize: '5px' }}>
          Store refrigerated below 5°C
        </div>
      </div>

      {/* Ingredients Section */}
      <div className="mx-2 mb-1 bg-green-50 border border-green-200 rounded px-2 py-1 flex-1">
        <div className="font-semibold text-gray-800 mb-1" style={{ fontSize: '5px' }}>INGREDIENTS:</div>
        <div className="text-gray-700 leading-tight whitespace-pre-line" style={{ fontSize: '5px', lineHeight: '1.2' }}>
          {formatIngredients(ingredients, allergens || '')}
        </div>
      </div>

      {/* Allergens Section - Prominent */}
      {allergens && (
        <div className="mx-2 mb-1 bg-red-50 border border-red-300 rounded px-2 py-1">
          <div className="font-bold text-red-800 mb-1" style={{ fontSize: '5px' }}>⚠️ ALLERGENS:</div>
          <div className="font-bold text-red-700 leading-tight" style={{ fontSize: '6px' }}>
            {allergens.split(', ').map(allergen => allergen.trim().toUpperCase()).join(' • ')}
          </div>
        </div>
      )}

      {/* Premium Footer */}
      <div className="mt-auto bg-gray-50 border-t border-gray-200 px-2 py-1">
        <div className="text-center font-medium text-green-700 leading-tight" style={{ fontSize: '5px' }}>
          www.fitfoodtasty.co.uk
        </div>
      </div>
    </div>
  );
};

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
              justify-content: start !important;
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
          .print-page > div > div > div:last-child {
            margin-top: auto;
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
          ))}
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