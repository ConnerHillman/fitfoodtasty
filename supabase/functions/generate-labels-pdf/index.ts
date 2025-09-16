import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

// Base64 encoded Fit Food Tasty logo
const LOGO_BASE64 = `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAlgAAAD5CAYAAADaBKCQAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAABXYSURBVHgB7d3/jd1WFgfwj5f5A1CgFKAUoBSgFKAUoBSgFLAUsBSwFLAUsBSwFLAUsH5A5/vs3Nf43mfLtuTf8vuRjvJmXtqxfO85P3zti+vr6ysAAADe+JcXAAAA8BeCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAALwgWAAC8IFgAAPCCYAEAwAuCBQAAL/w/pCPQ1Q1iVwAAAABJRU5ErkJggg==`;

// Generate PDF using jsPDF-like functionality
function generatePDF(mealProduction: MealProduction[], useByDate: string): Uint8Array {
  // Create all labels array
  const allLabels: Array<{ meal: MealProduction; labelIndex: number }> = [];
  mealProduction.forEach(meal => {
    for (let i = 0; i < meal.quantity; i++) {
      allLabels.push({ meal, labelIndex: i + 1 });
    }
  });

  console.log(`Total labels to generate: ${allLabels.length}`);

  // Calculate pages (10 labels per page - 2 across × 5 down)
  const labelsPerPage = 10;
  const totalPages = Math.ceil(allLabels.length / labelsPerPage);
  
  console.log(`Generated PDF for ${totalPages} pages`);

  // For now, we'll return the HTML as a PDF-like file
  // This is a simplified implementation - in production you'd use a proper PDF library
  const htmlContent = generateLabelsHTML(mealProduction, useByDate);
  const encoder = new TextEncoder();
  return encoder.encode(htmlContent);
}

function generateLabelsHTML(mealProduction: MealProduction[], useByDate: string): string {
  // Create all labels array - exactly like LabelPreview component
  const allLabels: Array<{ meal: MealProduction; labelIndex: number }> = [];
  mealProduction.forEach(meal => {
    for (let i = 0; i < meal.quantity; i++) {
      allLabels.push({ meal, labelIndex: i + 1 });
    }
  });

  // Calculate pages (10 labels per page - 2 across × 5 down)
  const labelsPerPage = 10;
  const totalPages = Math.ceil(allLabels.length / labelsPerPage);

  const formatUseByDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Meal Labels - ${new Date().toLocaleDateString()}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          margin: 0;
          padding: 0;
          font-family: Inter, Arial, sans-serif;
        }
        
        .page {
          width: 210mm;
          height: 297mm;
          background: white;
          display: grid;
          grid-template-columns: repeat(2, 96mm);
          grid-template-rows: repeat(5, 50.8mm);
          gap: 5mm;
          padding: 11.5mm 6.5mm;
          box-sizing: border-box;
          page-break-after: always;
        }
        
        .page:last-child {
          page-break-after: auto;
        }
        
        .label {
          width: 96mm;
          height: 50.8mm;
          box-sizing: border-box;
          padding: 6px;
          display: flex;
          flex-direction: column;
          font-family: Inter, Arial, sans-serif;
          font-size: 6px;
          line-height: 1.2;
          background: white;
          color: #0f172a;
          border: 1px solid #e2e8f0;
        }
        
        .header {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        
        .logo-container {
          margin-bottom: 8px;
        }
        
        .logo {
          height: 32px;
          width: auto;
          max-width: 120px;
        }
        
        .meal-name {
          text-align: center;
          font-weight: bold;
          color: #0f172a;
          line-height: 1.1;
          margin: 0 0 8px 0;
          font-size: 14px;
          max-height: 28px;
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }
        
        .separator {
          width: 32px;
          height: 1px;
          background: rgba(34, 197, 94, 0.3);
          margin-bottom: 8px;
        }
        
        .nutrition {
          background: linear-gradient(to right, rgba(34, 197, 94, 0.08), rgba(34, 197, 94, 0.12));
          border-radius: 4px;
          border: 1px solid rgba(34, 197, 94, 0.2);
          padding: 6px 8px;
          margin-bottom: 8px;
          text-align: center;
          font-weight: bold;
          color: #22c55e;
          line-height: 1.1;
          font-size: 8px;
        }
        
        .content {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        
        .use-by {
          background: rgba(148, 163, 184, 0.1);
          border-radius: 4px;
          padding: 4px 8px;
          font-weight: bold;
          color: #0f172a;
          line-height: 1.1;
          font-size: 7px;
        }
        
        .storage {
          color: #64748b;
          line-height: 1.1;
          font-size: 6px;
        }
        
        .ingredients, .allergens {
          line-height: 1.1;
          font-size: 6px;
        }
        
        .label-text {
          font-weight: 600;
          color: #0f172a;
        }
        
        .allergens {
          font-weight: bold;
          color: #0f172a;
        }
        
        .footer {
          border-top: 1px solid rgba(226, 232, 240, 0.3);
          padding-top: 4px;
          margin-top: 8px;
          text-align: center;
          font-weight: 500;
          color: #22c55e;
          line-height: 1.1;
          font-size: 6px;
        }
        
        .empty-label {
          width: 96mm;
          height: 50.8mm;
          border: 1px dashed #ccc;
          opacity: 0.3;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #999;
          font-size: 10px;
        }
        
        @media print {
          body {
            margin: 0 !important;
            padding: 0 !important;
          }
          
          .page {
            margin: 0 !important;
            padding: 11.5mm 6.5mm !important;
            width: 210mm !important;
            height: 297mm !important;
          }
        }
      </style>
    </head>
    <body>
  `;

  for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
    const startIndex = pageIndex * labelsPerPage;
    const endIndex = Math.min(startIndex + labelsPerPage, allLabels.length);
    const pageLabels = allLabels.slice(startIndex, endIndex);
    
    html += '<div class="page">';
    
    // Add labels for this page
    pageLabels.forEach(({ meal }) => {
      html += `
        <div class="label">
          <div class="header">
            <div class="logo-container">
              <img src="${LOGO_BASE64}" alt="Fit Food Tasty" class="logo" />
            </div>
            <h1 class="meal-name">${meal.mealName}</h1>
            <div class="separator"></div>
          </div>

          <div class="nutrition">
            ${meal.totalCalories} Calories • ${meal.totalProtein}g Protein • ${meal.totalFat}g Fat • ${meal.totalCarbs}g Carbs
          </div>

          <div class="content">
            <div class="use-by">USE BY: ${formatUseByDate(useByDate)}</div>
            <div class="storage">Store in a refrigerator below 5°c. Heat in a microwave for 3-4 minutes or until piping hot.</div>
            <div class="ingredients">
              <span class="label-text">Ingredients:</span> ${meal.ingredients || 'Not specified'}
            </div>
            ${meal.allergens ? `<div class="allergens"><span class="label-text">Allergens:</span> ${meal.allergens}</div>` : ''}
          </div>

          <div class="footer">www.fitfoodtasty.co.uk</div>
        </div>
      `;
    });
    
    // Fill remaining slots with empty divs to maintain grid structure
    const emptySlots = labelsPerPage - pageLabels.length;
    for (let i = 0; i < emptySlots; i++) {
      html += '<div class="empty-label">Empty</div>';
    }
    
    html += '</div>';
  }

  html += `
    </body>
    </html>
  `;

  return html;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { mealProduction, useByDate } = await req.json();

    console.log(`Generating labels for ${mealProduction.length} meals`);

    // Generate HTML content with proper PDF styling
    const htmlContent = generateLabelsHTML(mealProduction, useByDate);

    // Create filename with timestamp and meal count for better organization
    const timestamp = new Date().toISOString().split('T')[0];
    const totalLabels = mealProduction.reduce((sum: number, meal: any) => sum + meal.quantity, 0);
    const filename = `meal-labels-${timestamp}-${totalLabels}labels.html`;

    return new Response(htmlContent, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});