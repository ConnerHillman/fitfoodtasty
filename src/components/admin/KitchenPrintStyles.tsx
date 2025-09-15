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
        
        /* Hide everything except kitchen production content */
        * {
          visibility: hidden;
        }
        
        .kitchen-production-container,
        .kitchen-production-container * {
          visibility: visible;
        }
        
        body {
          margin: 0;
          padding: 0;
        }
        
        .kitchen-production-container {
          max-width: none;
          margin: 0;
          padding: 5mm;
        }
        
        .kitchen-meal-list {
          border-collapse: collapse;
          width: 100%;
          margin-bottom: 3mm;
        }
        
        .kitchen-meal-row {
          border-bottom: 1px solid #ddd;
          page-break-inside: avoid;
        }
        
        .kitchen-meal-quantity {
          font-size: 12pt;
          font-weight: bold;
          padding: 1mm;
          text-align: center;
          border-right: 1px solid #ddd;
          width: 12mm;
        }
        
        .kitchen-meal-name {
          font-size: 11pt;
          padding: 1mm 2mm;
          font-weight: 500;
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