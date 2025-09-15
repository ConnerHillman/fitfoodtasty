import React from 'react';

export const KitchenPrintStyles: React.FC = () => {
  return (
    <style>{`
      @media print {
        body {
          font-family: Arial, sans-serif;
          font-size: 12pt;
          line-height: 1.4;
          color: black;
          background: white;
        }
        
        .print-hide {
          display: none !important;
        }
        
        .kitchen-production-container {
          max-width: none;
          margin: 0;
          padding: 10mm;
        }
        
        .kitchen-header {
          border-bottom: 3px solid #000;
          padding-bottom: 5mm;
          margin-bottom: 5mm;
        }
        
        .kitchen-title {
          font-size: 18pt;
          font-weight: bold;
          text-align: center;
          margin: 0;
        }
        
        .kitchen-date {
          font-size: 14pt;
          text-align: center;
          margin: 2mm 0 0 0;
        }
        
        .kitchen-summary {
          display: flex;
          justify-content: space-between;
          border: 2px solid #000;
          padding: 3mm;
          margin-bottom: 5mm;
          background: #f5f5f5;
        }
        
        .kitchen-summary-item {
          text-align: center;
        }
        
        .kitchen-summary-label {
          font-size: 10pt;
          font-weight: bold;
        }
        
        .kitchen-summary-value {
          font-size: 16pt;
          font-weight: bold;
        }
        
        .kitchen-meal-list {
          border-collapse: collapse;
          width: 100%;
          margin-bottom: 5mm;
        }
        
        .kitchen-meal-row {
          border-bottom: 1px solid #ccc;
          page-break-inside: avoid;
        }
        
        .kitchen-meal-quantity {
          font-size: 14pt;
          font-weight: bold;
          padding: 2mm;
          text-align: center;
          border-right: 1px solid #ccc;
          width: 15mm;
        }
        
        .kitchen-meal-name {
          font-size: 12pt;
          padding: 2mm;
          font-weight: 500;
        }
        
        .kitchen-meal-variations {
          font-size: 10pt;
          color: #666;
          padding: 1mm 2mm;
        }
        
        .kitchen-total {
          border: 3px solid #000;
          padding: 3mm;
          text-align: center;
          font-size: 16pt;
          font-weight: bold;
          background: #000;
          color: white;
        }
        
        .kitchen-special-instructions {
          border: 2px solid #ff6b35;
          padding: 3mm;
          margin-top: 5mm;
          background: #fff5f5;
        }
        
        .kitchen-special-title {
          font-size: 12pt;
          font-weight: bold;
          color: #ff6b35;
          margin-bottom: 2mm;
        }
        
        .kitchen-instruction-item {
          font-size: 10pt;
          margin: 1mm 0;
          padding: 1mm;
          background: white;
          border-left: 3px solid #ff6b35;
          padding-left: 3mm;
        }
        
        /* Force page breaks */
        .page-break {
          page-break-after: always;
        }
        
        /* Hide all interactive elements */
        button, .button, [role="button"] {
          display: none !important;
        }
        
        /* Hide navigation and other UI elements */
        nav, .nav, .tabs, .sidebar {
          display: none !important;
        }
      }
    `}</style>
  );
};