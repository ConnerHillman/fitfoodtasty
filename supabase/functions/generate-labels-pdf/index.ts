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

// Function to generate HTML for puppeteer PDF conversion
function generatePrintableHTML(mealProduction: MealProduction[], useByDate: string): string {
  // Convert meal production to individual labels
  const allLabels: LabelData[] = [];
  
  for (const meal of mealProduction) {
    for (let i = 0; i < meal.quantity; i++) {
      allLabels.push({
        mealName: meal.mealName,
        calories: meal.totalCalories,
        protein: meal.totalProtein,
        fat: meal.totalFat,
        carbs: meal.totalCarbs,
        ingredients: meal.ingredients,
        allergens: meal.allergens,
        useByDate: useByDate,
        storageInstructions: 'Store in a refrigerator below 5°c. Heat in a microwave for 3-4 minutes or until piping hot.',
        heatingInstructions: 'Pierce film and heat for 3-4 minutes or until piping hot.',
        quantity: 1
      });
    }
  }

  const labelsPerPage = 10;
  const totalPages = Math.ceil(allLabels.length / labelsPerPage);
  
  // Generate single label HTML
  function generateLabelHTML(data: LabelData): string {
    const formatDate = (dateStr: string) => {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-GB', {
        weekday: 'short',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    };

    return `
      <div class="label">
        <!-- Header Section -->
        <div class="header">
          <div class="logo">FIT FOOD TASTY</div>
          <h1 class="meal-name">${data.mealName}</h1>
          <div class="separator"></div>
        </div>

        <!-- Nutrition Section -->
        <div class="nutrition">
          ${data.calories} Calories • ${data.protein}g Protein • ${data.fat}g Fat • ${data.carbs}g Carbs
        </div>

        <!-- Content Section -->
        <div class="content">
          <div class="use-by">USE BY: ${formatDate(data.useByDate)}</div>
          <div class="storage">${data.storageInstructions}</div>
          <div class="ingredients">
            <span class="label-text">Ingredients:</span> ${data.ingredients || 'Not specified'}
          </div>
          ${data.allergens ? `<div class="allergens"><span class="label-text">Allergens:</span> ${data.allergens}</div>` : ''}
        </div>

        <!-- Footer -->
        <div class="footer">www.fitfoodtasty.co.uk</div>
      </div>
    `;
  }

  // Generate pages
  let pagesHTML = '';
  for (let pageNum = 0; pageNum < totalPages; pageNum++) {
    const startIndex = pageNum * labelsPerPage;
    const pageLabels = allLabels.slice(startIndex, startIndex + labelsPerPage);
    
    let pageHTML = '<div class="page">';
    
    // Add labels to page
    for (let i = 0; i < labelsPerPage; i++) {
      if (i < pageLabels.length) {
        pageHTML += generateLabelHTML(pageLabels[i]);
      } else {
        pageHTML += '<div class="label empty"></div>';
      }
    }
    
    pageHTML += '</div>';
    pagesHTML += pageHTML;
  }

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Meal Labels - ${new Date().toISOString().split('T')[0]}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          @page {
            size: A4;
            margin: 0;
          }
          
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
            margin: 0;
            padding: 0;
            background: white;
          }
          
          .page {
            width: 210mm;
            height: 297mm;
            padding: 8.5mm;
            display: grid;
            grid-template-columns: repeat(2, 99.1mm);
            grid-template-rows: repeat(5, 57.3mm);
            gap: 0;
            page-break-after: always;
            background: white;
          }
          
          .page:last-child {
            page-break-after: auto;
          }
          
          .label {
            width: 99.1mm;
            height: 57.3mm;
            padding: 2mm;
            border: 0.5pt solid #e0e0e0;
            display: flex;
            flex-direction: column;
            background: white;
            font-size: 8pt;
            line-height: 1.2;
            color: #000;
            overflow: hidden;
          }
          
          .label.empty {
            border: none;
          }
          
          .header {
            text-align: center;
            margin-bottom: 2mm;
          }
          
          .logo {
            font-size: 10pt;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 1mm;
          }
          
          .meal-name {
            font-size: 12pt;
            font-weight: bold;
            color: #000;
            margin-bottom: 1mm;
            line-height: 1.1;
            max-height: 8mm;
            overflow: hidden;
          }
          
          .separator {
            width: 8mm;
            height: 0.5pt;
            background: rgba(37, 99, 235, 0.3);
            margin: 0 auto 2mm auto;
          }
          
          .nutrition {
            background: linear-gradient(to right, rgba(37, 99, 235, 0.08), rgba(37, 99, 235, 0.12));
            border: 0.5pt solid rgba(37, 99, 235, 0.2);
            border-radius: 1mm;
            padding: 1.5mm 2mm;
            margin-bottom: 2mm;
            text-align: center;
            font-weight: bold;
            color: #2563eb;
            font-size: 7pt;
            line-height: 1.1;
          }
          
          .content {
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 1.5mm;
          }
          
          .use-by {
            background: rgba(0, 0, 0, 0.05);
            border-radius: 1mm;
            padding: 1.5mm 2mm;
            font-weight: bold;
            color: #000;
            font-size: 7pt;
          }
          
          .storage {
            color: #666;
            font-size: 6pt;
            line-height: 1.1;
          }
          
          .ingredients, .allergens {
            font-size: 6pt;
            line-height: 1.1;
          }
          
          .label-text {
            font-weight: 600;
            color: #000;
          }
          
          .allergens .label-text + * {
            font-weight: bold;
            color: #000;
          }
          
          .footer {
            border-top: 0.5pt solid rgba(0, 0, 0, 0.1);
            padding-top: 1mm;
            margin-top: 2mm;
            text-align: center;
            font-weight: 500;
            color: #2563eb;
            font-size: 6pt;
          }
          
          @media print {
            .page {
              page-break-after: always;
              margin: 0;
              padding: 8.5mm;
            }
            
            .page:last-child {
              page-break-after: auto;
            }
          }
        </style>
      </head>
      <body>
        ${pagesHTML}
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

    console.log(`Generating labels for ${mealProduction.length} meals`);
    
    const totalLabels = mealProduction.reduce((sum: number, meal: MealProduction) => sum + meal.quantity, 0);
    console.log(`Total labels to generate: ${totalLabels}`);

    // Generate print-ready HTML
    const defaultUseByDate = useByDate || new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const htmlContent = generatePrintableHTML(mealProduction, defaultUseByDate);

    console.log(`Generated HTML for ${Math.ceil(totalLabels / 10)} pages`);

    return new Response(htmlContent, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/html',
        'Content-Disposition': `attachment; filename="labels-${new Date().toISOString().split('T')[0]}.html"`,
      },
    });

  } catch (error) {
    console.error('Error generating labels:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to generate labels',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});