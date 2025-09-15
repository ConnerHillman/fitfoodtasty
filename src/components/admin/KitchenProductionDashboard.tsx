import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  CalendarIcon, 
  ChefHat, 
  Clock, 
  Package, 
  Printer,
  Hash,
  ArrowDownAZ,
  Download
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { KitchenPrintStyles } from './KitchenPrintStyles';
import { format as formatDate, startOfDay, endOfDay } from 'date-fns';
import { cn } from '@/lib/utils';
import * as XLSX from 'xlsx';

interface MealLineItem {
  mealName: string;
  totalQuantity: number;
  orders: Array<{
    orderId: string;
    quantity: number;
    customerName?: string;
  }>;
}

interface ProductionSummary {
  productionDate: Date;
  totalMeals: number;
  uniqueMealTypes: number;
  mealLineItems: MealLineItem[];
}

export const KitchenProductionDashboard: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [productionData, setProductionData] = useState<ProductionSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [sortBy, setSortBy] = useState<'alphabetical' | 'quantity'>('alphabetical');
  const { toast } = useToast();

  // Memoized function to process meals as individual line items
  const processMealLineItems = useCallback((orders: any[]) => {
    const mealLineItems: { [key: string]: MealLineItem } = {};

    orders.forEach(order => {
      order.order_items?.forEach((item: any) => {
        const mealName = item.meal_name?.trim();
        if (!mealName) return; // Skip items without meal names
        
        if (!mealLineItems[mealName]) {
          mealLineItems[mealName] = {
            mealName,
            totalQuantity: 0,
            orders: []
          };
        }

        mealLineItems[mealName].totalQuantity += item.quantity || 0;
        mealLineItems[mealName].orders.push({
          orderId: order.id,
          quantity: item.quantity || 0,
          customerName: order.customer_name
        });
      });
    });

    return Object.values(mealLineItems);
  }, []);

  // Memoized sorting logic
  const sortedMealLineItems = useMemo(() => {
    if (!productionData?.mealLineItems) return [];
    
    const items = [...productionData.mealLineItems];
    if (sortBy === 'quantity') {
      return items.sort((a, b) => b.totalQuantity - a.totalQuantity);
    }
    return items.sort((a, b) => a.mealName.localeCompare(b.mealName));
  }, [productionData?.mealLineItems, sortBy]);

  const loadProductionData = async () => {
    if (!selectedDate) return;
    
    setLoading(true);
    try {
      const startDate = startOfDay(selectedDate);
      const endDate = endOfDay(selectedDate);

      // Fetch orders for the selected production date
      // Note: We'll look for orders where production_date matches, or if null, 
      // we calculate it based on delivery date (2 days before)
      const [ordersRes, packageOrdersRes] = await Promise.all([
        supabase.from("orders").select(`
          id,
          status,
          customer_name,
          production_date,
          requested_delivery_date,
          created_at,
          order_items (
            meal_id,
            meal_name,
            quantity
          )
        `).in('status', ['confirmed', 'preparing', 'ready', 'out_for_delivery']),
        
        supabase.from("package_orders").select(`
          id,
          status,
          customer_name,
          production_date,
          requested_delivery_date,
          created_at,
          package_meal_selections (
            meal_id,
            quantity
          ),
          packages (
            name
          )
        `).in('status', ['confirmed', 'preparing', 'ready', 'out_for_delivery'])
      ]);

      if (ordersRes.error) throw ordersRes.error;
      if (packageOrdersRes.error) throw packageOrdersRes.error;

      const orders = ordersRes.data || [];
      const packageOrders = packageOrdersRes.data || [];

      // Filter orders for the selected production date
      const filteredOrders = orders.filter(order => {
        if (order.production_date) {
          const orderProductionDate = new Date(order.production_date);
          return orderProductionDate.toDateString() === selectedDate.toDateString();
        }
        
        // For orders without explicit production_date, use creation date as production date
        // (assuming same-day production for testing purposes)
        try {
          const createdDate = new Date(order.created_at);
          return createdDate.toDateString() === selectedDate.toDateString();
        } catch (error) {
          console.error('Error parsing date for order:', order.id, error);
          return false;
        }
      });

      const filteredPackageOrders = packageOrders.filter(order => {
        if (order.production_date) {
          const orderProductionDate = new Date(order.production_date);
          return orderProductionDate.toDateString() === selectedDate.toDateString();
        }
        
        // For orders without explicit production_date, use creation date as production date
        try {
          const createdDate = new Date(order.created_at);
          return createdDate.toDateString() === selectedDate.toDateString();
        } catch (error) {
          console.error('Error parsing package order date:', order.id, error);
          return false;
        }
      });

      // Fetch actual meal names for package orders
      const packageMealIds = filteredPackageOrders.flatMap(pkg => 
        pkg.package_meal_selections?.map(selection => selection.meal_id) || []
      );
      
      let packageMeals: any[] = [];
      if (packageMealIds.length > 0) {
        const { data: mealsData } = await supabase
          .from('meals')
          .select('id, name')
          .in('id', packageMealIds);
        packageMeals = mealsData || [];
      }

      // Convert package orders to same format as regular orders with proper meal names
      const normalizedPackageOrders = filteredPackageOrders.map(pkg => ({
        ...pkg,
        order_items: pkg.package_meal_selections?.map(selection => {
          const meal = packageMeals.find(m => m.id === selection.meal_id);
          return {
            meal_id: selection.meal_id,
            meal_name: meal?.name || 'Unknown Meal',
            quantity: selection.quantity
          };
        }) || []
      }));

      const allOrders = [...filteredOrders, ...normalizedPackageOrders];
      const mealLineItems = processMealLineItems(allOrders);
      
      const totalMeals = mealLineItems.reduce((sum, meal) => sum + meal.totalQuantity, 0);

      setProductionData({
        productionDate: selectedDate,
        totalMeals,
        uniqueMealTypes: mealLineItems.length,
        mealLineItems
      });

    } catch (error) {
      console.error('Error loading production data:', error);
      toast({
        title: "Error Loading Data",
        description: "Failed to load production data for the selected date.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProductionData();
  }, [selectedDate]); // Removed sortBy dependency since sorting is now memoized

  const handlePrint = () => {
    window.print();
  };

  // Excel export functionality
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
    if (loading) {
      toast({
        title: "Please Wait",
        description: "Data is still loading. Please wait before exporting.",
        variant: "default",
      });
      return;
    }

    try {
      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      
      // Prepare data for export - kitchen-friendly format
      const exportData: (string | number)[][] = [
        // Header row with date
        [`Kitchen Production List - ${formatDate(productionData.productionDate, 'EEEE, MMMM d, yyyy')}`],
        [], // Empty row for spacing
        ['Qty', 'Meal Description'], // Column headers
        ...sortedMealLineItems.map(meal => [
          meal.totalQuantity,
          meal.mealName
        ]),
        [], // Empty row before total
        ['TOTAL MEALS:', productionData.totalMeals]
      ];

      // Create worksheet
      const ws = XLSX.utils.aoa_to_sheet(exportData);

      // Set column widths for better formatting
      ws['!cols'] = [
        { wch: 8 },  // Qty column - sufficient for quantities up to 9999
        { wch: 50 }  // Meal Description column - accommodates long meal names
      ];

      // Style the header row (merge cells for title)
      ws['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 1 } } // Merge title row across both columns
      ];

      // Add worksheet to workbook with descriptive name
      XLSX.utils.book_append_sheet(wb, ws, 'Kitchen Production');

      // Generate safe filename with date
      const dateStr = formatDate(productionData.productionDate, 'yyyy-MM-dd');
      const filename = `Kitchen_Production_${dateStr}.xlsx`;

      // Save file
      XLSX.writeFile(wb, filename);

      toast({
        title: "Export Successful",
        description: `Kitchen production list exported as ${filename}`,
      });

    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: error instanceof Error ? error.message : "Failed to export production data. Please try again.",
        variant: "destructive",
      });
    }
  }, [productionData, sortedMealLineItems, toast, loading]);

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
            <Button onClick={loadProductionData} disabled={loading} size="lg">
              <Clock className="h-4 w-4 mr-2" />
              {loading ? 'Loading...' : 'Refresh'}
            </Button>
            <Button 
              onClick={handleExcelExport} 
              disabled={loading || !productionData} 
              variant="outline" 
              size="lg"
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
            {/* Print Header - Only visible when printing */}
            <div className="kitchen-header hidden print:block">
              <h1 className="kitchen-title">Kitchen Production List</h1>
              <div className="kitchen-date">
                {formatDate(productionData.productionDate, 'EEEE, MMMM d, yyyy')}
              </div>
            </div>


            {/* Main Production List */}
            <div className="print:block hidden">
              <h2 className="text-lg font-bold mb-2">
                {formatDate(productionData.productionDate, 'EEEE do MMMM')} Production List
              </h2>
            </div>

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