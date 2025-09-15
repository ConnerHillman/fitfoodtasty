import React from 'react';
import logoImage from '@/assets/fit-food-tasty-logo.png';

interface LabelData {
  mealName: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  ingredients: string;
  allergens: string;
  useByDate: string;
  storageInstructions: string;
  heatingInstructions: string;
  quantity: number;
}

interface LabelPreviewProps {
  data: LabelData;
  showSingle?: boolean;
}

const SingleLabel: React.FC<{ data: LabelData }> = ({ data }) => {
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
          {data.mealName}
        </h1>
        <div className="text-center text-green-600 font-medium italic" style={{ fontSize: '5px', fontFamily: 'serif' }}>
          Fresh, Fit, Flavorful
        </div>
      </div>

      {/* Premium Nutrition Box */}
      <div className="mx-2 mb-2 bg-green-50 border border-green-200 rounded px-2 py-1.5">
        <div className="grid grid-cols-2 gap-1 text-center">
          <div>
            <div className="font-bold text-gray-800" style={{ fontSize: '7px' }}>**{data.calories}**</div>
            <div className="text-gray-600" style={{ fontSize: '5px' }}>CALORIES</div>
          </div>
          <div>
            <div className="font-bold text-gray-800" style={{ fontSize: '7px' }}>**{data.protein}g**</div>
            <div className="text-gray-600" style={{ fontSize: '5px' }}>PROTEIN</div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-1 text-center mt-1">
          <div>
            <div className="font-bold text-gray-800" style={{ fontSize: '7px' }}>**{data.fat}g**</div>
            <div className="text-gray-600" style={{ fontSize: '5px' }}>FAT</div>
          </div>
          <div>
            <div className="font-bold text-gray-800" style={{ fontSize: '7px' }}>**{data.carbs}g**</div>
            <div className="text-gray-600" style={{ fontSize: '5px' }}>CARBS</div>
          </div>
        </div>
      </div>

      {/* Use By Date with Icon */}
      <div className="mx-2 mb-1 bg-yellow-50 border border-yellow-200 rounded px-2 py-1 flex items-center gap-1">
        <div style={{ fontSize: '6px' }}>📅</div>
        <div className="font-bold text-gray-800 leading-tight" style={{ fontSize: '6px' }}>
          USE BY: {data.useByDate ? new Date(data.useByDate).toLocaleDateString('en-GB', {
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
          {data.heatingInstructions || 'Microwave 3-4 mins until piping hot'}
        </div>
        <div className="text-gray-600 leading-tight" style={{ fontSize: '5px' }}>
          {data.storageInstructions || 'Store refrigerated below 5°C'}
        </div>
      </div>

      {/* Ingredients Section */}
      <div className="mx-2 mb-1 bg-green-50 border border-green-200 rounded px-2 py-1 flex-1">
        <div className="font-semibold text-gray-800 mb-1" style={{ fontSize: '5px' }}>INGREDIENTS:</div>
        <div className="text-gray-700 leading-tight whitespace-pre-line" style={{ fontSize: '5px', lineHeight: '1.2' }}>
          {formatIngredients(data.ingredients, data.allergens || '')}
        </div>
      </div>

      {/* Allergens Section - Prominent */}
      {data.allergens && (
        <div className="mx-2 mb-1 bg-red-50 border border-red-300 rounded px-2 py-1">
          <div className="font-bold text-red-800 mb-1" style={{ fontSize: '5px' }}>⚠️ ALLERGENS:</div>
          <div className="font-bold text-red-700 leading-tight" style={{ fontSize: '6px' }}>
            {data.allergens.split(', ').map(allergen => allergen.trim().toUpperCase()).join(' • ')}
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

export const LabelPreview: React.FC<LabelPreviewProps> = ({ data, showSingle = false }) => {
  if (showSingle) {
    return <SingleLabel data={data} />;
  }

  // Generate labels for A4 sheet (2 columns × 5 rows = 10 labels per page)
  const labelsPerPage = 10;
  const totalPages = Math.ceil(data.quantity / labelsPerPage);
  const pages = [];

  for (let pageNum = 0; pageNum < totalPages; pageNum++) {
    const startLabel = pageNum * labelsPerPage;
    const endLabel = Math.min(startLabel + labelsPerPage, data.quantity);
    const labelsOnThisPage = endLabel - startLabel;
    
    const pageLabels = [];
    for (let i = 0; i < labelsOnThisPage; i++) {
      pageLabels.push(
        <SingleLabel key={`${pageNum}-${i}`} data={data} />
      );
    }
    
    // Fill remaining slots with empty divs to maintain grid structure
    while (pageLabels.length < labelsPerPage) {
      pageLabels.push(
        <div key={`empty-${pageLabels.length}`} className="w-full h-full" style={{
          width: '96mm',
          height: '50.8mm'
        }} />
      );
    }

    pages.push(
      <div
        key={pageNum}
        className="page-break"
        style={{
          width: '210mm',  // A4 width
          height: '297mm', // A4 height
          padding: '11.5mm 6.5mm', // Correct margins for 96x50.8mm labels
          backgroundColor: 'white',
          boxSizing: 'border-box',
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 96mm)', // 2 columns
          gridTemplateRows: 'repeat(5, 50.8mm)',    // 5 rows
          columnGap: '5mm',
          rowGap: '5mm',
          alignContent: 'start',
          justifyContent: 'center',
          pageBreakAfter: pageNum < totalPages - 1 ? 'always' : 'auto'
        }}
      >
        {pageLabels}
      </div>
    );
  }

  return (
    <div className="print-container">
      {pages}
      <style dangerouslySetInnerHTML={{
        __html: `
          @media print {
            * {
              margin: 0 !important;
              padding: 0 !important;
              box-shadow: none !important;
            }
            
            body {
              margin: 0 !important;
              padding: 0 !important;
            }
            
            .print-container {
              margin: 0 !important;
              padding: 0 !important;
              width: 210mm !important;
              height: 297mm !important;
            }
            
            .page-break {
              page-break-after: always;
              margin: 0 !important;
              padding: 8.5mm !important;
              width: 210mm !important;
              height: 297mm !important;
              box-sizing: border-box !important;
            }
            
            .page-break:last-child {
              page-break-after: auto;
            }
            
          }
        `
      }} />
    </div>
  );
};