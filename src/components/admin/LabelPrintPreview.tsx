import React from 'react';
import { format as formatDate } from 'date-fns';

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

interface LabelPrintPreviewProps {
  mealProduction: MealProduction[];
  useByDate?: string;
}

export const LabelPrintPreview: React.FC<LabelPrintPreviewProps> = ({ 
  mealProduction, 
  useByDate = formatDate(new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd')
}) => {
  // Create all labels array
  const allLabels: Array<{meal: MealProduction, labelIndex: number}> = [];
  mealProduction.forEach(meal => {
    for (let i = 0; i < meal.quantity; i++) {
      allLabels.push({ meal, labelIndex: i + 1 });
    }
  });

  // Calculate pages (10 labels per page)
  const labelsPerPage = 10;
  const totalPages = Math.ceil(allLabels.length / labelsPerPage);
  
  const pages = [];
  for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
    const startIndex = pageIndex * labelsPerPage;
    const endIndex = Math.min(startIndex + labelsPerPage, allLabels.length);
    pages.push(allLabels.slice(startIndex, endIndex));
  }

  return (
    <div className="print-preview bg-gray-100 p-4">
      <style dangerouslySetInnerHTML={{
        __html: `
          @media print {
            .print-preview {
              margin: 0 !important;
              padding: 0 !important;
              background: white !important;
            }
            .page-break {
              page-break-after: always;
            }
            .no-print {
              display: none !important;
            }
          }
          
          .print-page {
            width: 210mm;
            height: 297mm;
            margin: 0 auto 20px auto;
            background: white;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
            position: relative;
            display: grid;
            grid-template-columns: repeat(2, 96mm);
            grid-template-rows: repeat(5, 50.8mm);
            gap: 5mm;
            padding: 11.5mm 6.5mm;
            box-sizing: border-box;
          }
          
          .label {
            width: 96mm;
            height: 50.8mm;
            border: 1px solid #ddd;
            box-sizing: border-box;
            padding: 2mm;
            display: flex;
            flex-direction: column;
            background: white;
            font-family: 'Arial', sans-serif;
            position: relative;
          }
          
          .label-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 1mm;
          }
          
          .logo {
            width: 12mm;
            height: 12mm;
            background: #4CAF50;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 3mm;
          }
          
          .use-by {
            background: #ff4444;
            color: white;
            padding: 0.5mm 1mm;
            border-radius: 1mm;
            font-size: 2.5mm;
            font-weight: bold;
          }
          
          .meal-name {
            font-size: 4mm;
            font-weight: bold;
            color: #333;
            margin: 0.5mm 0;
            line-height: 1.1;
            overflow: hidden;
            text-overflow: ellipsis;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
          }
          
          .nutrition-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 0.5mm;
            margin: 1mm 0;
          }
          
          .nutrition-item {
            text-align: center;
            font-size: 2mm;
          }
          
          .nutrition-value {
            font-weight: bold;
            color: #4CAF50;
            display: block;
          }
          
          .nutrition-label {
            color: #666;
            font-size: 1.8mm;
          }
          
          .storage-heating {
            font-size: 2mm;
            color: #666;
            margin: 1mm 0;
            line-height: 1.2;
            flex-grow: 1;
          }
          
          .ingredients-allergens {
            font-size: 1.8mm;
            color: #333;
            border-top: 0.5px solid #ddd;
            padding-top: 0.5mm;
            margin-top: auto;
          }
          
          .ingredients {
            margin-bottom: 0.5mm;
          }
          
          .allergens {
            font-weight: bold;
          }
        `
      }} />
      
      <div className="no-print mb-4 p-4 bg-white rounded border">
        <h3 className="text-lg font-semibold mb-2">Print Preview</h3>
        <p className="text-sm text-gray-600 mb-2">
          This preview shows exactly how your labels will appear when printed on A4 paper.
        </p>
        <div className="text-sm text-gray-500">
          <span className="font-medium">Total Labels:</span> {allLabels.length} • 
          <span className="font-medium ml-2">Pages:</span> {totalPages} • 
          <span className="font-medium ml-2">Layout:</span> 2 across × 5 down per page
        </div>
      </div>

      {pages.map((pageLabels, pageIndex) => (
        <div key={pageIndex} className={`print-page ${pageIndex < pages.length - 1 ? 'page-break' : ''}`}>
          {pageLabels.map(({ meal }, labelIndex) => (
            <div key={`${meal.mealId}-${labelIndex}`} className="label">
              <div className="label-header">
                <div className="logo">FF</div>
                <div className="use-by">USE BY {useByDate}</div>
              </div>
              
              <div className="meal-name">{meal.mealName}</div>
              
              <div className="nutrition-grid">
                <div className="nutrition-item">
                  <span className="nutrition-value">{meal.totalCalories}</span>
                  <div className="nutrition-label">KCAL</div>
                </div>
                <div className="nutrition-item">
                  <span className="nutrition-value">{meal.totalProtein}g</span>
                  <div className="nutrition-label">PROTEIN</div>
                </div>
                <div className="nutrition-item">
                  <span className="nutrition-value">{meal.totalFat}g</span>
                  <div className="nutrition-label">FAT</div>
                </div>
                <div className="nutrition-item">
                  <span className="nutrition-value">{meal.totalCarbs}g</span>
                  <div className="nutrition-label">CARBS</div>
                </div>
              </div>
              
              <div className="storage-heating">
                <div>Store in a refrigerator below 5°C</div>
                <div>Pierce film and heat for 3-4 minutes until piping hot</div>
              </div>
              
              <div className="ingredients-allergens">
                <div className="ingredients">
                  <strong>Ingredients:</strong> {meal.ingredients}
                </div>
                {meal.allergens && (
                  <div className="allergens">
                    <strong>Allergens:</strong> {meal.allergens}
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {/* Fill empty slots if needed */}
          {Array.from({ length: labelsPerPage - pageLabels.length }).map((_, emptyIndex) => (
            <div key={`empty-${emptyIndex}`} className="label" style={{ border: '1px dashed #ccc', opacity: 0.3 }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                height: '100%', 
                color: '#999',
                fontSize: '3mm'
              }}>
                Empty
              </div>
            </div>
          ))}
        </div>
      ))}
      
      <div className="no-print mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
        <h4 className="font-semibold text-yellow-800 mb-2">Printing Instructions:</h4>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• Use A4 paper (210mm × 297mm)</li>
          <li>• Set printer to 100% scale (no fit to page)</li>
          <li>• Disable margins or set to minimum</li>
          <li>• Use portrait orientation</li>
          <li>• For best results, use adhesive label sheets (96mm × 50.8mm, 2×5 layout)</li>
        </ul>
      </div>
    </div>
  );
};