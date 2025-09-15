import React, { useState, useEffect } from 'react';
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
  CheckCircle,
  AlertCircle,
  Users
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { KitchenPrintStyles } from './KitchenPrintStyles';
import { format as formatDate, startOfDay, endOfDay } from 'date-fns';
import { cn } from '@/lib/utils';

interface MealVariation {
  baseName: string;
  variations: string[];
  totalQuantity: number;
  orders: Array<{
    orderId: string;
    quantity: number;
    fullMealName: string;
    customerName?: string;
  }>;
}

interface ProductionSummary {
  productionDate: Date;
  totalMeals: number;
  uniqueMealTypes: number;
  mealVariations: MealVariation[];
  specialInstructions: string[];
}

export const KitchenProductionDashboard: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [productionData, setProductionData] = useState<ProductionSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const { toast } = useToast();

  // Smart meal name parsing to extract base name and variations
  const parseMealName = (fullName: string) => {
    // Remove common prefixes and suffixes to find base name
    let baseName = fullName;
    const variations: string[] = [];

    // Extract LowCal prefix
    if (baseName.includes('LowCal ') || baseName.includes('(LowCal)')) {
      variations.push('LowCal');
      baseName = baseName.replace('LowCal ', '').replace('(LowCal)', '');
    }

    // Extract variations in parentheses
    const parenthesesRegex = /\s*\([^)]+\)/g;
    const parenthesesMatches = baseName.match(parenthesesRegex);
    if (parenthesesMatches) {
      parenthesesMatches.forEach(match => {
        const cleanMatch = match.replace(/[()]/g, '').trim();
        if (cleanMatch && !variations.includes(cleanMatch)) {
          variations.push(cleanMatch);
        }
        baseName = baseName.replace(match, '');
      });
    }

    // Extract BIG suffix
    if (baseName.includes(' BIG') || baseName.includes('BIG')) {
      if (!variations.includes('BIG')) variations.push('BIG');
      baseName = baseName.replace(' BIG', '').replace('BIG', '');
    }

    // Clean up base name
    baseName = baseName.trim().replace(/\s+/g, ' ');

    return { baseName, variations };
  };

  // Group meals by base name and aggregate variations
  const groupMealsByBaseName = (orders: any[]) => {
    const mealGroups: { [key: string]: MealVariation } = {};

    orders.forEach(order => {
      order.order_items?.forEach((item: any) => {
        const { baseName, variations } = parseMealName(item.meal_name);
        
        if (!mealGroups[baseName]) {
          mealGroups[baseName] = {
            baseName,
            variations: [],
            totalQuantity: 0,
            orders: []
          };
        }

        mealGroups[baseName].totalQuantity += item.quantity;
        mealGroups[baseName].orders.push({
          orderId: order.id,
          quantity: item.quantity,
          fullMealName: item.meal_name,
          customerName: order.customer_name
        });

        // Add unique variations
        variations.forEach(variation => {
          if (!mealGroups[baseName].variations.includes(variation)) {
            mealGroups[baseName].variations.push(variation);
          }
        });
      });
    });

    return Object.values(mealGroups).sort((a, b) => b.totalQuantity - a.totalQuantity);
  };

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

      // Convert package orders to same format as regular orders
      const normalizedPackageOrders = filteredPackageOrders.map(pkg => ({
        ...pkg,
        order_items: pkg.package_meal_selections?.map(selection => ({
          meal_id: selection.meal_id,
          meal_name: `${pkg.packages?.name || 'Package'} Meal`, // Better naming
          quantity: selection.quantity
        })) || []
      }));

      const allOrders = [...filteredOrders, ...normalizedPackageOrders];
      const mealVariations = groupMealsByBaseName(allOrders);
      
      const totalMeals = mealVariations.reduce((sum, meal) => sum + meal.totalQuantity, 0);
      
      // Extract special instructions from variations
      const specialInstructions: string[] = [];
      mealVariations.forEach(meal => {
        meal.variations.forEach(variation => {
          if (variation.includes('BIG') || variation.includes('NO ') || variation.includes('GLASS')) {
            specialInstructions.push(`${meal.baseName}: ${variation}`);
          }
        });
      });

      setProductionData({
        productionDate: selectedDate,
        totalMeals,
        uniqueMealTypes: mealVariations.length,
        mealVariations,
        specialInstructions
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
  }, [selectedDate]);

  const handlePrint = () => {
    window.print();
  };

  const formatVariations = (variations: string[]) => {
    if (variations.length === 0) return '';
    return ` (${variations.join(', ')})`;
  };

  const getVariationCount = (meal: MealVariation, variation: string) => {
    return meal.orders.filter(order => 
      order.fullMealName.toLowerCase().includes(variation.toLowerCase())
    ).reduce((sum, order) => sum + order.quantity, 0);
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
            <Button onClick={loadProductionData} disabled={loading} size="lg">
              <Clock className="h-4 w-4 mr-2" />
              {loading ? 'Loading...' : 'Refresh'}
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
              <h1 className="kitchen-title">Kitchen Production Report</h1>
              <div className="kitchen-date">
                {formatDate(productionData.productionDate, 'EEEE, MMMM d, yyyy')}
              </div>
            </div>

            {/* Production Summary Cards */}
            <div className="kitchen-summary grid grid-cols-1 md:grid-cols-3 gap-4 print:flex print:justify-between print:border-2 print:border-black print:p-3 print:bg-gray-100">
              <Card className="border-l-4 border-l-primary">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Meals</p>
                      <p className="text-3xl font-bold text-primary">{productionData.totalMeals}</p>
                    </div>
                    <Package className="h-8 w-8 text-primary" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-blue-500">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Meal Types</p>
                      <p className="text-3xl font-bold text-blue-600">{productionData.uniqueMealTypes}</p>
                    </div>
                    <ChefHat className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-green-500">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Special Instructions</p>
                      <p className="text-3xl font-bold text-green-600">{productionData.specialInstructions.length}</p>
                    </div>
                    <AlertCircle className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Production List */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl font-bold flex items-center gap-2">
                  <Calendar className="h-6 w-6" />
                  {formatDate(productionData.productionDate, 'EEEE do MMMM')} Production List
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="kitchen-meal-list space-y-1">
                  {productionData.mealVariations.map((meal, index) => (
                    <div key={index} className="kitchen-meal-row flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0 print:table-row">
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary" className="kitchen-meal-quantity text-lg font-bold px-3 py-1 print:bg-white print:border print:border-black">
                          {meal.totalQuantity}
                        </Badge>
                        <span className="kitchen-meal-name text-lg font-medium">
                          {meal.baseName}
                          {formatVariations(meal.variations)}
                        </span>
                      </div>
                      
                      {meal.variations.length > 0 && (
                        <div className="kitchen-meal-variations flex flex-wrap gap-2 print:text-xs print:text-gray-600">
                          {meal.variations.map((variation, vIndex) => {
                            const count = getVariationCount(meal, variation);
                            if (count > 0) {
                              return (
                                <Badge key={vIndex} variant="outline" className="text-sm">
                                  {variation} x{count}
                                </Badge>
                              );
                            }
                            return null;
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                
                <Separator className="my-4" />
                
                <div className="kitchen-total flex items-center justify-between print:text-center print:text-white print:bg-black print:p-3 print:border-2 print:border-black">
                  <span className="text-xl font-bold">TOTAL MEALS:</span>
                  <Badge variant="default" className="text-2xl font-bold px-4 py-2 print:bg-transparent print:text-white print:border-0">
                    {productionData.totalMeals}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Special Instructions Section */}
            {productionData.specialInstructions.length > 0 && (
              <Card className="kitchen-special-instructions print:border-2 print:border-orange-500 print:bg-orange-50">
                <CardHeader>
                  <CardTitle className="kitchen-special-title text-xl font-bold flex items-center gap-2 text-orange-600 print:text-orange-700">
                    <AlertCircle className="h-5 w-5" />
                    Special Instructions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {productionData.specialInstructions.map((instruction, index) => (
                      <div key={index} className="kitchen-instruction-item flex items-center gap-2 p-2 bg-orange-50 rounded print:bg-white print:border-l-2 print:border-orange-500">
                        <CheckCircle className="h-4 w-4 text-orange-600" />
                        <span className="text-sm font-medium">{instruction}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
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