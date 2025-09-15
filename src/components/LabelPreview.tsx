import React from 'react';
import { SingleLabel } from '@/components/shared/SingleLabel';

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