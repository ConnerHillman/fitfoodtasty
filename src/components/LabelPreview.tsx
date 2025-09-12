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
  <div className="w-full h-full bg-card text-card-foreground font-inter" style={{
    width: '99.1mm',
    height: '57.3mm', // EU30009BM specification
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
        {data.mealName}
      </h1>
      
      {/* Separator */}
      <div className="w-8 h-px bg-primary/30 mb-2"></div>
    </div>

    {/* Nutrition Section */}
    <div className="bg-gradient-to-r from-primary/8 to-primary/12 rounded border border-primary/20 px-2 py-1.5 mb-2">
      <div className="text-center font-bold text-primary leading-tight" style={{ fontSize: '8px' }}>
        {data.calories} Calories • {data.protein}g Protein • {data.fat}g Fat • {data.carbs}g Carbs
      </div>
    </div>

    {/* Main Content */}
    <div className="flex-1 space-y-1.5">
      {/* Use By Date - Most Important */}
      <div className="bg-muted/50 rounded px-2 py-1">
        <div className="font-bold text-foreground leading-tight" style={{ fontSize: '7px' }}>
          USE BY: {data.useByDate ? new Date(data.useByDate).toLocaleDateString('en-GB', {
            weekday: 'short',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          }) : 'Fri, 19/09/2025'}
        </div>
      </div>

      {/* Storage Instructions */}
      <div className="text-muted-foreground leading-tight" style={{ fontSize: '6px' }}>
        {data.storageInstructions}
      </div>

      {/* Ingredients */}
      <div className="leading-tight" style={{ fontSize: '6px' }}>
        <span className="font-semibold text-foreground">Ingredients:</span>{' '}
        <span className="text-muted-foreground">{data.ingredients || 'Not specified'}</span>
      </div>

      {/* Allergens */}
      {data.allergens && (
        <div className="leading-tight" style={{ fontSize: '6px' }}>
          <span className="font-semibold text-foreground">Allergens:</span>{' '}
          <span className="font-bold text-foreground">{data.allergens}</span>
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
          height: '57.3mm'
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
          padding: '8.5mm', // EU30009BM margins - equal on all sides for 10-label layout
          backgroundColor: 'white',
          boxSizing: 'border-box',
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 99.1mm)', // 2 columns
          gridTemplateRows: 'repeat(5, 57.3mm)',    // 5 rows (EU30009BM spec)
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
            
            /* Hide everything except the print container */
            body > *:not(.print-container) {
              display: none !important;
            }
            
            /* Ensure only labels are visible */
            .container, .card, .button, .input, .form, nav, header, footer {
              display: none !important;
            }
          }
        `
      }} />
    </div>
  );
};