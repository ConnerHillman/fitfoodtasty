import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CalendarIcon, 
  ChefHat, 
  Clock, 
  Printer,
  Hash,
  ArrowDownAZ,
  Download,
  AlertTriangle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useDebounce } from '@/hooks/useDebounce';
import { useProductionData } from '@/hooks/useProductionData';
import { KitchenPrintStyles } from './KitchenPrintStyles';
import { IngredientsProductionView } from './IngredientsProductionView';
import { format as formatDate, startOfDay, endOfDay } from 'date-fns';
import { cn } from '@/lib/utils';
import * as XLSX from 'xlsx';
import type { ProductionSummary, SortBy } from '@/types/kitchen';



export const KitchenProductionDashboard: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [sortBy, setSortBy] = useState<SortBy>('alphabetical');
  const [activeTab, setActiveTab] = useState<'meals' | 'ingredients'>('meals');
  const { toast } = useToast();
  
  const {
    productionData,
    loading,
    ingredientsLoading,
    ingredientsError,
    dataValidationWarnings,
    selectedIngredients,
    setSelectedIngredients,
    loadProductionData,
    retryIngredientProcessing
  } = useProductionData();

  // Debounce the data loading to prevent excessive API calls - use ref to stabilize
  const loadDataRef = useRef(loadProductionData);
  loadDataRef.current = loadProductionData;
  
  const debouncedLoadData = useDebounce(useCallback((date: Date) => {
    loadDataRef.current(date);
  }, []), 300);

  // Memoized sorting logic for meals
  const sortedMealLineItems = useMemo(() => {
    if (!productionData?.mealLineItems) return [];
    
    const items = [...productionData.mealLineItems];
    if (sortBy === 'quantity') {
      return items.sort((a, b) => b.totalQuantity - a.totalQuantity);
    }
    return items.sort((a, b) => a.mealName.localeCompare(b.mealName));
  }, [productionData?.mealLineItems, sortBy]);

  // Memoized sorting logic for ingredients
  const sortedIngredientLineItems = useMemo(() => {
    if (!productionData?.ingredientLineItems) return [];
    
    const items = [...productionData.ingredientLineItems];
    if (sortBy === 'quantity') {
      return items.sort((a, b) => b.totalQuantity - a.totalQuantity);
    }
    return items.sort((a, b) => a.ingredientName.localeCompare(b.ingredientName));
  }, [productionData?.ingredientLineItems, sortBy]);

  useEffect(() => {
    debouncedLoadData(selectedDate);
  }, [selectedDate, debouncedLoadData]);

  // Enhanced Excel export functionality for both meals and ingredients
  const handleExcelExport = useCallback(() => {
    if (!productionData) {
      toast({
        title: "No Data to Export",
        description: "Please load production data first.",
        variant: "destructive",
      });
      return;
    }

    // Prevent multiple exports during processing
    if (loading || ingredientsLoading) {
      toast({
        title: "Please Wait",
        description: "Data is still loading. Please wait before exporting.",
        variant: "default",
      });
      return;
    }

    try {
      // Create workbook
      const wb = XLSX.utils.book_new();
      const dateStr = formatDate(productionData.productionDate, 'EEEE, MMMM d, yyyy');
      
      // === MEALS SHEET ===
      const mealsExportData: (string | number)[][] = [
        [`Kitchen Production List - ${dateStr}`],
        [], // Empty row for spacing
        ['Qty', 'Meal Description'], // Column headers
        ...sortedMealLineItems.map(meal => [
          meal.totalQuantity,
          meal.mealName
        ]),
        [], // Empty row before total
        ['TOTAL MEALS:', productionData.totalMeals]
      ];

      const mealsWs = XLSX.utils.aoa_to_sheet(mealsExportData);
      
      // Set column widths for meals sheet
      mealsWs['!cols'] = [
        { wch: 8 },  // Qty column
        { wch: 50 }  // Meal Description column
      ];

      // Style the header row (merge cells for title)
      mealsWs['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 1 } } // Merge title row across both columns
      ];

      XLSX.utils.book_append_sheet(wb, mealsWs, 'Meals Production');

      // === INGREDIENTS SHEET ===
      if (productionData.ingredientLineItems.length > 0) {
        const ingredientsExportData: (string | number)[][] = [
          [`Ingredient Requirements - ${dateStr}`],
          [], // Empty row for spacing
          ['Qty', 'Unit', 'Ingredient', 'Used In Meals'], // Column headers
        ];

        // Add ingredient data
        sortedIngredientLineItems.forEach(ingredient => {
          const usedInMeals = ingredient.mealBreakdown
            .map(breakdown => `${breakdown.mealName} (${breakdown.quantity}${breakdown.unit})`)
            .join(', ');
          
          ingredientsExportData.push([
            ingredient.totalQuantity.toString(),
            ingredient.unit,
            ingredient.ingredientName,
            usedInMeals
          ]);
        });

        // Add totals
        ingredientsExportData.push(
          [], // Empty row before total
          [
            'TOTAL INGREDIENT TYPES:',
            '', 
            productionData.uniqueIngredientTypes.toString(),
            ''
          ]
        );

        const ingredientsWs = XLSX.utils.aoa_to_sheet(ingredientsExportData);
        
        // Set column widths for ingredients sheet
        ingredientsWs['!cols'] = [
          { wch: 8 },   // Qty column
          { wch: 8 },   // Unit column
          { wch: 30 },  // Ingredient column
          { wch: 60 }   // Used In Meals column
        ];

        // Style the header row (merge cells for title)
        ingredientsWs['!merges'] = [
          { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } } // Merge title row across all columns
        ];

        XLSX.utils.book_append_sheet(wb, ingredientsWs, 'Ingredients Required');
      }

      // === SUMMARY SHEET ===
      const summaryData: (string | number)[][] = [
        [`Production Summary - ${dateStr}`],
        [], // Empty row
        ['PRODUCTION OVERVIEW'],
        ['Total Meals to Prepare:', productionData.totalMeals],
        ['Unique Meal Types:', productionData.uniqueMealTypes],
        ['Total Ingredient Types:', productionData.uniqueIngredientTypes],
        [], // Empty row
        ['MEAL BREAKDOWN'],
        ['Meal Name', 'Quantity'],
        ...sortedMealLineItems.map(meal => [meal.mealName, meal.totalQuantity])
      ];

      if (productionData.ingredientLineItems.length > 0) {
        summaryData.push(
          [], // Empty row
          ['INGREDIENT SUMMARY'],
          ['Ingredient', 'Total Qty', 'Unit'],
          ...sortedIngredientLineItems.map(ingredient => [
            ingredient.ingredientName,
            ingredient.totalQuantity,
            ingredient.unit
          ])
        );
      }

      const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
      
      // Set column widths for summary sheet
      summaryWs['!cols'] = [
        { wch: 40 },  // Description column
        { wch: 15 },  // Value column
        { wch: 10 }   // Unit column
      ];

      XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');

      // Generate filename with date
      const filenameDateStr = formatDate(productionData.productionDate, 'yyyy-MM-dd');
      const filename = `Kitchen_Production_Complete_${filenameDateStr}.xlsx`;

      // Save file
      XLSX.writeFile(wb, filename);

      const sheetsCreated = productionData.ingredientLineItems.length > 0 ? 
        "meals, ingredients, and summary" : "meals and summary";

      toast({
        title: "Export Successful",
        description: `Complete kitchen production data exported with ${sheetsCreated} sheets as ${filename}`,
      });

    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: error instanceof Error ? error.message : "Failed to export production data. Please try again.",
        variant: "destructive",
      });
    }
  }, [productionData, sortedMealLineItems, sortedIngredientLineItems, toast, loading, ingredientsLoading]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <KitchenPrintStyles />
      <div className="kitchen-production-container space-y-6 p-6">
        {/* Header with Date Selection */}
        <div className="kitchen-header flex items-center justify-between print-hide">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <ChefHat className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold text-foreground">Kitchen Production</h1>
            </div>
            
            <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal text-lg px-4 py-6",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-5 w-5" />
                  {selectedDate ? formatDate(selectedDate, 'EEEE, MMMM d, yyyy') : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    if (date) {
                      setSelectedDate(date);
                      setShowDatePicker(false);
                    }
                  }}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex gap-2">
            <Button onClick={() => debouncedLoadData(selectedDate)} disabled={loading} size="lg">
              <Clock className="h-4 w-4 mr-2" />
              {loading ? 'Loading...' : 'Refresh'}
            </Button>
            <Button 
              onClick={handleExcelExport} 
              disabled={loading || ingredientsLoading || !productionData} 
              variant="outline" 
              size="lg"
              title={productionData?.ingredientLineItems.length ? "Export meals and ingredients" : "Export meals (ingredients loading...)"}
            >
              <Download className="h-4 w-4 mr-2" />
              Export Excel
            </Button>
            <Button onClick={handlePrint} variant="outline" size="lg">
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
          </div>
        </div>

        {productionData ? (
          <div className="space-y-6">
            {/* Print-only Production Date Header */}
            <div className="hidden print:block text-center mb-8">
              <h1 className="text-4xl font-bold text-center text-black">
                {formatDate(productionData.productionDate, 'EEEE do MMMM yyyy')} {activeTab === 'meals' ? 'Production List' : 'Ingredient Requirements'}
              </h1>
            </div>

            {/* Production Tabs */}
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'meals' | 'ingredients')} className="w-full">
              <TabsList className="grid w-full grid-cols-2 max-w-md print:hidden">
                <TabsTrigger value="meals">Meals</TabsTrigger>
                <TabsTrigger value="ingredients">Ingredients</TabsTrigger>
              </TabsList>

              {/* Data Validation Warnings */}
              {dataValidationWarnings && dataValidationWarnings.length > 0 && (
                <div className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg print:hidden">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-medium text-destructive mb-2">Data Validation Issues</h4>
                      <ul className="text-sm text-destructive/80 space-y-1">
                        {dataValidationWarnings.slice(0, 5).map((warning, index) => (
                          <li key={index} className="flex items-start gap-1">
                            <span className="w-1 h-1 bg-destructive/60 rounded-full mt-2 flex-shrink-0" />
                            {warning}
                          </li>
                        ))}
                        {dataValidationWarnings.length > 5 && (
                          <li className="text-xs italic">
                            ... and {dataValidationWarnings.length - 5} more issues (check console for full list)
                          </li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              <TabsContent value="meals" className="mt-6">
                <Card className="print:shadow-none print:border-none">
                  <CardHeader className="pb-4 print:hidden">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl font-bold flex items-center gap-2">
                        <ChefHat className="h-5 w-5" />
                        {formatDate(productionData.productionDate, 'EEEE do MMMM')} Production List
                      </CardTitle>
                      
                      {/* Sorting Controls */}
                      <div className="flex gap-2 print:hidden">
                        <Button
                          variant={sortBy === 'alphabetical' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setSortBy('alphabetical')}
                          disabled={loading}
                          className="text-xs"
                        >
                          <ArrowDownAZ className="h-3 w-3 mr-1" />
                          A-Z
                        </Button>
                        <Button
                          variant={sortBy === 'quantity' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setSortBy('quantity')}
                          disabled={loading}
                          className="text-xs"
                        >
                          <Hash className="h-3 w-3 mr-1" />
                          Qty
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 print:p-0">
                    {/* Compact Table Layout */}
                    <div className="kitchen-table-container overflow-x-auto" role="region" aria-label="Kitchen production list">
                      <table className="w-full border-collapse min-w-full kitchen-meal-list">
                        <thead className="print:break-before-avoid">
                          <tr className="border-b-2 border-border">
                            <th className="text-left py-2 px-3 text-sm font-bold text-muted-foreground w-20 kitchen-meal-quantity">Qty</th>
                            <th className="text-left py-2 px-3 text-sm font-bold text-muted-foreground kitchen-meal-name">Meal Description</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sortedMealLineItems.length > 0 ? (
                            sortedMealLineItems.map((meal, index) => (
                              <tr key={`${meal.mealName}-${index}`} className="border-b border-border/50 hover:bg-muted/30 print:hover:bg-transparent print:break-inside-avoid kitchen-meal-row">
                                <td className="py-2 px-3 text-center align-middle kitchen-meal-quantity">
                                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold print:bg-transparent print:text-black print:w-auto print:h-auto print:rounded-none">
                                    {meal.totalQuantity}
                                  </span>
                                </td>
                                <td className="py-2 px-3 text-sm font-medium text-foreground align-middle kitchen-meal-name">
                                  {meal.mealName}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={2} className="py-8 text-center text-muted-foreground">
                                No meals scheduled for this date
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                    
                    <Separator className="my-4" />
                    
                    <div className="kitchen-total flex items-center justify-between bg-muted/30 p-3 rounded border print:text-center print:text-white print:bg-black print:border-black">
                      <span className="text-lg font-bold">TOTAL MEALS:</span>
                      <span className="text-2xl font-bold text-primary print:text-white">
                        {productionData.totalMeals}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="ingredients" className="mt-6">
                <IngredientsProductionView 
                  productionData={productionData}
                  sortedIngredientLineItems={sortedIngredientLineItems}
                  loading={loading || ingredientsLoading}
                  sortBy={sortBy}
                  setSortBy={setSortBy}
                  selectedIngredients={selectedIngredients}
                  setSelectedIngredients={setSelectedIngredients}
                  ingredientsError={ingredientsError}
                  onRetryIngredients={retryIngredientProcessing}
                />
              </TabsContent>
            </Tabs>

          </div>
        ) : (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <ChefHat className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No production data</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Select a date to view production requirements.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
};