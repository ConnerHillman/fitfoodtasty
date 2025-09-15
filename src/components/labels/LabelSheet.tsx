import React from 'react';
import { BaseLabel } from './BaseLabel';
import { LabelData, LABEL_DIMENSIONS } from '@/types/label';

interface LabelSheetProps {
  data: LabelData;
  showSingle?: boolean;
  onlyContent?: boolean; // For when used in other preview components
}

export const LabelSheet: React.FC<LabelSheetProps> = ({ data, showSingle = false, onlyContent = false }) => {
  if (showSingle) {
    return <BaseLabel data={data} />;
  }

  // Generate labels for A4 sheet
  const quantity = data.quantity || 10;
  const totalPages = Math.ceil(quantity / LABEL_DIMENSIONS.labelsPerPage);
  const pages = [];

  for (let pageNum = 0; pageNum < totalPages; pageNum++) {
    const startLabel = pageNum * LABEL_DIMENSIONS.labelsPerPage;
    const endLabel = Math.min(startLabel + LABEL_DIMENSIONS.labelsPerPage, quantity);
    const labelsOnThisPage = endLabel - startLabel;
    
    const pageLabels = [];
    for (let i = 0; i < labelsOnThisPage; i++) {
      pageLabels.push(
        <BaseLabel key={`${pageNum}-${i}`} data={data} />
      );
    }
    
    // Fill remaining slots with empty divs to maintain grid structure
    while (pageLabels.length < LABEL_DIMENSIONS.labelsPerPage) {
      pageLabels.push(
        <div key={`empty-${pageLabels.length}`} className="w-full h-full" style={{
          width: LABEL_DIMENSIONS.width,
          height: LABEL_DIMENSIONS.height
        }} />
      );
    }

    pages.push(
      <div
        key={pageNum}
        className="page-break"
        style={{
          width: LABEL_DIMENSIONS.pageWidth,
          height: LABEL_DIMENSIONS.pageHeight,
          padding: LABEL_DIMENSIONS.pagePadding,
          backgroundColor: 'white',
          boxSizing: 'border-box',
          display: 'grid',
          gridTemplateColumns: `repeat(${LABEL_DIMENSIONS.labelsPerRow}, ${LABEL_DIMENSIONS.width})`,
          gridTemplateRows: `repeat(${LABEL_DIMENSIONS.labelsPerColumn}, ${LABEL_DIMENSIONS.height})`,
          gap: LABEL_DIMENSIONS.labelGap,
          pageBreakAfter: pageNum < totalPages - 1 ? 'always' : 'auto'
        }}
      >
        {pageLabels}
      </div>
    );
  }

  if (onlyContent) {
    return <>{pages}</>;
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
              width: ${LABEL_DIMENSIONS.pageWidth} !important;
              height: ${LABEL_DIMENSIONS.pageHeight} !important;
            }
            
            .page-break {
              page-break-after: always;
              margin: 0 !important;
              padding: ${LABEL_DIMENSIONS.pagePadding} !important;
              width: ${LABEL_DIMENSIONS.pageWidth} !important;
              height: ${LABEL_DIMENSIONS.pageHeight} !important;
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