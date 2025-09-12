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

const SingleLabel: React.FC<{ data: LabelData }> = ({ data }) => (
  <div className="w-full h-full p-2 text-xs leading-tight" style={{
    width: '99.1mm',
    height: '38.1mm',
    border: '1px solid #e5e7eb',
    boxSizing: 'border-box',
    fontFamily: 'Arial, sans-serif'
  }}>
    {/* Header with Logo */}
    <div className="flex items-start justify-between mb-1">
      <div className="flex items-center gap-1">
        <img 
          src={logoImage} 
          alt="Fit Food Tasty" 
          className="w-8 h-8 object-contain"
        />
        <div className="text-[6px] font-bold text-green-600">
          <div>FIT</div>
          <div>FOOD</div>
          <div>TASTY</div>
        </div>
      </div>
    </div>

    {/* Meal Name */}
    <div className="text-center font-bold text-[10px] mb-1">
      {data.mealName}
    </div>

    {/* Nutrition Info */}
    <div className="text-center text-[8px] mb-1">
      <strong>Calories {data.calories} Protein {data.protein} Fat {data.fat} Carbs {data.carbs}</strong>
    </div>

    {/* Storage Instructions */}
    <div className="text-[6px] mb-1">
      {data.storageInstructions}
    </div>

    {/* Use By Date */}
    <div className="text-[6px] font-bold mb-1">
      Use By: {data.useByDate ? new Date(data.useByDate).toLocaleDateString('en-GB', {
        weekday: 'short',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }) : 'Fri, 19/09/2025'}
    </div>

    {/* Ingredients */}
    <div className="text-[6px] mb-1">
      <strong>Ingredients:</strong> {data.ingredients || 'Not specified'}
    </div>

    {/* Allergens */}
    {data.allergens && (
      <div className="text-[6px] mb-1">
        <strong>Allergens:</strong> <u>{data.allergens}</u>
      </div>
    )}

    {/* Website */}
    <div className="text-center text-[6px] font-bold">
      www.fitfoodtasty.co.uk
    </div>
  </div>
);

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
          width: '99.1mm',
          height: '38.1mm'
        }} />
      );
    }

    pages.push(
      <div
        key={pageNum}
        className="page-break"
        style={{
          width: '210mm',
          height: '297mm',
          padding: '21.2mm 8.5mm',
          backgroundColor: 'white',
          boxSizing: 'border-box',
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 99.1mm)',
          gridTemplateRows: 'repeat(5, 38.1mm)',
          gap: '0',
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
            .print-container {
              margin: 0;
              padding: 0;
            }
            .page-break {
              page-break-after: always;
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