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
        
        /* Print only the kitchen production content (no blank top space) */
        @page {
          size: A4;
          margin: 10mm;
        }

        /* Hide everything, then reveal the target container */
        body * {
          visibility: hidden;
        }
        .kitchen-production-container,
        .kitchen-production-container * {
          visibility: visible;
        }

        /* Pull the container to the very top-left for print */
        .kitchen-production-container {
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          margin: 0 !important;
          padding: 0 !important;
          max-width: none !important;
          background: white !important;
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

        /* Clean heading: hide decorative icons near title */
        .kitchen-production-container h1 svg,
        .kitchen-production-container h1 [role="img"],
        .kitchen-production-container h1 .icon {
          display: none !important;
        }

        /* Print-only title styles */
        .print-title { display: block !important; }
        .print-title-text {
          font-size: 24pt !important;
          font-weight: 800 !important;
          line-height: 1.2 !important;
          margin: 0 0 6mm 0 !important;
          color: #000 !important;
          text-align: center !important;
        }
      }
    `}</style>
  );
};