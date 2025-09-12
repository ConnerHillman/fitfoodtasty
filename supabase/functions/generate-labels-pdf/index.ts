import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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

function generateLabelHTML(data: LabelData): string {
  // Generate HTML for a single label matching the React component design
  return `
    <div style="
      width: 99.1mm;
      height: 57.3mm;
      box-sizing: border-box;
      padding: 6px;
      display: flex;
      flex-direction: column;
      font-size: 6px;
      line-height: 1.2;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
      background: white;
      color: #000;
      border: 1px solid #e5e5e5;
    ">
      <!-- Header Section -->
      <div style="display: flex; flex-direction: column; align-items: center;">
        <!-- Logo placeholder -->
        <div style="margin-bottom: 8px; height: 32px; display: flex; align-items: center;">
          <div style="font-size: 12px; font-weight: bold; color: #2563eb;">FIT FOOD TASTY</div>
        </div>
        
        <!-- Meal Name -->
        <h1 style="
          text-align: center;
          font-weight: bold;
          color: #000;
          line-height: 1.1;
          margin: 0 0 8px 0;
          font-size: 14px;
          max-height: 28px;
          overflow: hidden;
        ">
          ${data.mealName}
        </h1>
        
        <!-- Separator -->
        <div style="width: 32px; height: 1px; background: rgba(37, 99, 235, 0.3); margin-bottom: 8px;"></div>
      </div>

      <!-- Nutrition Section -->
      <div style="
        background: linear-gradient(to right, rgba(37, 99, 235, 0.08), rgba(37, 99, 235, 0.12));
        border-radius: 4px;
        border: 1px solid rgba(37, 99, 235, 0.2);
        padding: 6px 8px;
        margin-bottom: 8px;
      ">
        <div style="
          text-align: center;
          font-weight: bold;
          color: #2563eb;
          line-height: 1.1;
          font-size: 8px;
        ">
          ${data.calories} Calories • ${data.protein}g Protein • ${data.fat}g Fat • ${data.carbs}g Carbs
        </div>
      </div>

      <!-- Main Content -->
      <div style="flex: 1; display: flex; flex-direction: column; gap: 6px;">
        <!-- Use By Date -->
        <div style="
          background: rgba(0, 0, 0, 0.05);
          border-radius: 4px;
          padding: 6px 8px;
        ">
          <div style="
            font-weight: bold;
            color: #000;
            line-height: 1.1;
            font-size: 7px;
          ">
            USE BY: ${new Date(data.useByDate).toLocaleDateString('en-GB', {
              weekday: 'short',
              day: '2-digit',
              month: '2-digit',
              year: 'numeric'
            })}
          </div>
        </div>

        <!-- Storage Instructions -->
        <div style="
          color: #666;
          line-height: 1.1;
          font-size: 6px;
        ">
          ${data.storageInstructions}
        </div>

        <!-- Ingredients -->
        <div style="line-height: 1.1; font-size: 6px;">
          <span style="font-weight: 600; color: #000;">Ingredients:</span>
          <span style="color: #666;"> ${data.ingredients || 'Not specified'}</span>
        </div>

        <!-- Allergens -->
        ${data.allergens ? `
          <div style="line-height: 1.1; font-size: 6px;">
            <span style="font-weight: 600; color: #000;">Allergens:</span>
            <span style="font-weight: bold; color: #000;"> ${data.allergens}</span>
          </div>
        ` : ''}
      </div>

      <!-- Footer -->
      <div style="
        border-top: 1px solid rgba(0, 0, 0, 0.1);
        padding-top: 4px;
        margin-top: 8px;
      ">
        <div style="
          text-align: center;
          font-weight: 500;
          color: #2563eb;
          line-height: 1.1;
          font-size: 6px;
        ">
          www.fitfoodtasty.co.uk
        </div>
      </div>
    </div>
  `;
}

function generateA4PageHTML(labelData: LabelData[]): string {
  // Generate a full A4 page with up to 10 labels (2 columns × 5 rows)
  const labels = labelData.slice(0, 10); // Max 10 labels per page
  const labelHTMLs = labels.map(data => generateLabelHTML(data));
  
  // Fill remaining slots with empty divs to maintain grid structure
  while (labelHTMLs.length < 10) {
    labelHTMLs.push(`
      <div style="
        width: 99.1mm;
        height: 57.3mm;
      "></div>
    `);
  }

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Labels</title>
        <style>
          @page {
            size: A4;
            margin: 8.5mm;
          }
          body {
            margin: 0;
            padding: 0;
            width: 210mm;
            height: 297mm;
          }
          .page {
            width: 210mm;
            height: 297mm;
            padding: 8.5mm;
            box-sizing: border-box;
            display: grid;
            grid-template-columns: repeat(2, 99.1mm);
            grid-template-rows: repeat(5, 57.3mm);
            gap: 0;
          }
        </style>
      </head>
      <body>
        <div class="page">
          ${labelHTMLs.join('')}
        </div>
      </body>
    </html>
  `;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { 
      status: 405, 
      headers: corsHeaders 
    });
  }

  try {
    const { mealProduction, useByDate } = await req.json();

    if (!mealProduction || !Array.isArray(mealProduction)) {
      return new Response(JSON.stringify({ error: 'Invalid meal production data' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Generating PDF for ${mealProduction.length} meals`);

    // Convert meal production to label data
    const allLabels: LabelData[] = [];
    
    for (const meal of mealProduction as MealProduction[]) {
      // Create labels for each quantity of this meal
      for (let i = 0; i < meal.quantity; i++) {
        allLabels.push({
          mealName: meal.mealName,
          calories: meal.totalCalories,
          protein: meal.totalProtein,
          fat: meal.totalFat,
          carbs: meal.totalCarbs,
          ingredients: meal.ingredients,
          allergens: meal.allergens,
          useByDate: useByDate || new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          storageInstructions: 'Store in a refrigerator below 5°c. Heat in a microwave for 3-4 minutes or until piping hot.',
          heatingInstructions: 'Pierce film and heat for 3-4 minutes or until piping hot.',
          quantity: 1
        });
      }
    }

    console.log(`Total labels to generate: ${allLabels.length}`);

    // Generate HTML pages (10 labels per page)
    const labelsPerPage = 10;
    const totalPages = Math.ceil(allLabels.length / labelsPerPage);
    let htmlPages = '';

    for (let pageNum = 0; pageNum < totalPages; pageNum++) {
      const startIndex = pageNum * labelsPerPage;
      const pageLabels = allLabels.slice(startIndex, startIndex + labelsPerPage);
      const pageHTML = generateA4PageHTML(pageLabels);
      
      if (pageNum > 0) {
        htmlPages += '<div style="page-break-before: always;"></div>';
      }
      htmlPages += pageHTML;
    }

    // For now, return the HTML content
    // In a production environment, you would use Puppeteer or similar to convert HTML to PDF
    const completeHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Labels - ${new Date().toISOString().split('T')[0]}</title>
          <style>
            @page {
              size: A4;
              margin: 8.5mm;
            }
            body {
              margin: 0;
              padding: 0;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
            }
            .page {
              width: 210mm;
              height: 297mm;
              padding: 8.5mm;
              box-sizing: border-box;
              display: grid;
              grid-template-columns: repeat(2, 99.1mm);
              grid-template-rows: repeat(5, 57.3mm);
              gap: 0;
              page-break-after: always;
            }
            .page:last-child {
              page-break-after: auto;
            }
          </style>
        </head>
        <body>
          ${Array.from({ length: totalPages }, (_, pageNum) => {
            const startIndex = pageNum * labelsPerPage;
            const pageLabels = allLabels.slice(startIndex, startIndex + labelsPerPage);
            const labelHTMLs = pageLabels.map(data => generateLabelHTML(data));
            
            // Fill remaining slots
            while (labelHTMLs.length < labelsPerPage) {
              labelHTMLs.push(`<div style="width: 99.1mm; height: 57.3mm;"></div>`);
            }
            
            return `
              <div class="page">
                ${labelHTMLs.join('')}
              </div>
            `;
          }).join('')}
        </body>
      </html>
    `;

    console.log(`Generated HTML for ${totalPages} pages`);

    return new Response(completeHTML, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/html',
        'Content-Disposition': `attachment; filename="labels-${new Date().toISOString().split('T')[0]}.html"`,
      },
    });

  } catch (error) {
    console.error('Error generating labels PDF:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to generate labels PDF',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});