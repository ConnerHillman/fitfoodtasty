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
    height: '38.1mm',
    border: '1px solid hsl(var(--border))',
    boxSizing: 'border-box',
    padding: '6px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between'
  }}>
    {/* Header Section */}
    <div className="flex flex-col items-center">
      {/* Logo */}
      <div className="mb-1">
        <img 
          src={logoImage} 
          alt="Fit Food Tasty" 
          className="h-4 w-auto object-contain"
        />
      </div>
      
      {/* Meal Name */}
      <h1 className="text-center font-bold text-[11px] text-foreground leading-tight mb-1.5">
        {data.mealName}
      </h1>
      
      {/* Separator */}
      <div className="w-8 h-px bg-primary/30 mb-1.5"></div>
    </div>

    {/* Nutrition Section */}
    <div className="bg-gradient-to-r from-primary/8 to-primary/12 rounded border border-primary/20 px-2 py-1.5 mb-1.5">
      <div className="text-center text-[8px] font-bold text-primary leading-tight">
        {data.calories} Calories • {data.protein}g Protein • {data.fat}g Fat • {data.carbs}g Carbs
      </div>
    </div>

    {/* Main Content */}
    <div className="flex-1 space-y-1">
      {/* Use By Date - Most Important */}
      <div className="bg-muted/50 rounded-sm px-1.5 py-0.5">
        <div className="text-[7px] font-bold text-foreground">
          USE BY: {data.useByDate ? new Date(data.useByDate).toLocaleDateString('en-GB', {
            weekday: 'short',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          }) : 'Fri, 19/09/2025'}
        </div>
      </div>

      {/* Storage Instructions */}
      <div className="text-[6px] text-muted-foreground leading-tight">
        {data.storageInstructions}
      </div>

      {/* Ingredients */}
      <div className="text-[6px] leading-tight">
        <span className="font-semibold text-foreground">Ingredients:</span>{' '}
        <span className="text-muted-foreground">{data.ingredients || 'Not specified'}</span>
      </div>

      {/* Allergens */}
      {data.allergens && (
        <div className="text-[6px] leading-tight">
          <span className="font-semibold text-foreground">Allergens:</span>{' '}
          <span className="font-bold text-foreground">{data.allergens}</span>
        </div>
      )}
    </div>

    {/* Footer */}
    <div className="border-t border-border/30 pt-1 mt-1">
      <div className="text-center text-[6px] font-medium text-primary">
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