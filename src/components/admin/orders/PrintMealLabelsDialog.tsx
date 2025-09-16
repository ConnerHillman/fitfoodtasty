import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Printer, Package, AlertTriangle, Calendar, Download, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { LabelPrintPreview } from '@/components/admin/LabelPrintPreview';
import { format as formatDate, addDays } from 'date-fns';

// Type definitions for order data
interface OrderItem {
  meal_id: string;
  meal_name: string;
  quantity: number;
}

interface PackageMealSelection {
  meal_id: string;
  quantity: number;
}

interface Order {
  id: string;
  order_type?: 'individual' | 'package';
  customer_name?: string;
  production_date?: string;
  order_items?: OrderItem[];
  package_meal_selections?: PackageMealSelection[];
  package?: {
    name: string;
  };
}

interface MealLabelData {
  mealId: string;
  mealName: string;
  quantity: number;
  selected: boolean;
  totalCalories: number;
  totalProtein: number;
  totalFat: number;
  totalCarbs: number;
  ingredients: string;
  allergens: string;
}

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

interface PrintMealLabelsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order;
}

export const PrintMealLabelsDialog: React.FC<PrintMealLabelsDialogProps> = ({
  isOpen,
  onClose,
  order,
}) => {
  const [mealLabels, setMealLabels] = useState<MealLabelData[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [loading, setLoading] = useState(false);
  const [useByDate, setUseByDate] = useState('');

  // Calculate use by date from production date or fallback to 5 days from now
  useEffect(() => {
    if (order?.production_date) {
      const productionDate = new Date(order.production_date);
      const calculatedUseByDate = addDays(productionDate, 5);
      setUseByDate(formatDate(calculatedUseByDate, 'yyyy-MM-dd'));
    } else {
      const fallbackDate = addDays(new Date(), 5);
      setUseByDate(formatDate(fallbackDate, 'yyyy-MM-dd'));
    }
  }, [order?.production_date]);

  // Initialize meal labels based on order data with full meal information
  useEffect(() => {
    if (!order || !isOpen) return;

    const fetchMealData = async () => {
      setLoading(true);
      try {
        const labels: MealLabelData[] = [];
        const mealIds: string[] = [];

        // Collect meal IDs from order
        if (order.order_items) {
          order.order_items.forEach((item) => {
            mealIds.push(item.meal_id);
          });
        } else if (order.package_meal_selections) {
          order.package_meal_selections.forEach((selection) => {
            mealIds.push(selection.meal_id);
          });
        }

        if (mealIds.length === 0) {
          setMealLabels([]);
          return;
        }

        // Fetch complete meal data from database
        const { data: mealsData, error } = await supabase
          .from('meals')
          .select(`
            id,
            name,
            total_calories,
            total_protein,
            total_fat,
            total_carbs,
            meal_ingredients (
              ingredient_id,
              quantity,
              unit,
              ingredients (
                name
              )
            ),
            meal_allergens (
              allergen_id,
              allergens (
                name
              )
            )
          `)
          .in('id', mealIds)
          .eq('is_active', true);

        if (error) throw error;

        const mealsMap = new Map(mealsData?.map(meal => [meal.id, meal]) || []);

        // Build meal labels with complete data
        if (order.order_items) {
          order.order_items.forEach((item) => {
            const mealData = mealsMap.get(item.meal_id);
            if (mealData) {
              labels.push({
                mealId: item.meal_id,
                mealName: item.meal_name,
                quantity: item.quantity,
                selected: true,
                totalCalories: Math.round(mealData.total_calories || 0),
                totalProtein: Math.round(mealData.total_protein || 0),
                totalFat: Math.round(mealData.total_fat || 0),
                totalCarbs: Math.round(mealData.total_carbs || 0),
                ingredients: mealData.meal_ingredients?.map(mi => mi.ingredients.name).join(', ') || '',
                allergens: mealData.meal_allergens?.map(ma => ma.allergens.name).join(', ') || '',
              });
            }
          });
        } else if (order.package_meal_selections) {
          order.package_meal_selections.forEach((selection) => {
            const mealData = mealsMap.get(selection.meal_id);
            if (mealData) {
              labels.push({
                mealId: selection.meal_id,
                mealName: mealData.name,
                quantity: selection.quantity,
                selected: true,
                totalCalories: Math.round(mealData.total_calories || 0),
                totalProtein: Math.round(mealData.total_protein || 0),
                totalFat: Math.round(mealData.total_fat || 0),
                totalCarbs: Math.round(mealData.total_carbs || 0),
                ingredients: mealData.meal_ingredients?.map(mi => mi.ingredients.name).join(', ') || '',
                allergens: mealData.meal_allergens?.map(ma => ma.allergens.name).join(', ') || '',
              });
            }
          });
        }

        setMealLabels(labels);
      } catch (error) {
        console.error('Error fetching meal data:', error);
        toast.error('Failed to load meal information');
      } finally {
        setLoading(false);
      }
    };

    fetchMealData();
  }, [order, isOpen]);

  const handleToggleMeal = (mealId: string) => {
    setMealLabels((prev) =>
      prev.map((meal) =>
        meal.mealId === mealId ? { ...meal, selected: !meal.selected } : meal
      )
    );
  };

  const handleSelectAll = () => {
    setMealLabels((prev) => prev.map((meal) => ({ ...meal, selected: true })));
  };

  const handleDeselectAll = () => {
    setMealLabels((prev) => prev.map((meal) => ({ ...meal, selected: false })));
  };

  const generatePDFForLabels = async () => {
    const selectedLabels = mealLabels.filter((label) => label.selected);
    
    if (selectedLabels.length === 0) {
      toast.error('Please select at least one meal to generate labels');
      return;
    }

    setIsGenerating(true);
    try {
      // Convert to MealProduction format for the edge function
      const mealProduction: MealProduction[] = selectedLabels.map(label => ({
        mealId: label.mealId,
        mealName: label.mealName,
        quantity: label.quantity,
        totalCalories: label.totalCalories,
        totalProtein: label.totalProtein,
        totalFat: label.totalFat,
        totalCarbs: label.totalCarbs,
        ingredients: label.ingredients,
        allergens: label.allergens,
        orderCount: 1
      }));

      // Use the edge function to generate PDF
      const { error } = await supabase.functions.invoke('generate-labels-pdf', {
        body: {
          mealProduction,
          useByDate
        }
      });

      if (error) throw error;

      const totalLabels = selectedLabels.reduce((sum, label) => sum + label.quantity, 0);
      toast.success(`Generated ${totalLabels} labels for ${selectedLabels.length} meals`);
      onClose();
    } catch (error) {
      console.error('Error generating labels:', error);
      toast.error('Failed to generate labels. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClose = () => {
    if (isGenerating) return; // Prevent closing while generating
    setShowPreview(false);
    onClose();
  };

  const selectedLabels = mealLabels.filter((label) => label.selected);
  const selectedCount = selectedLabels.length;
  const totalLabels = selectedLabels.reduce((sum, label) => sum + label.quantity, 0);

  // Convert selected labels to MealProduction format for preview
  const mealProductionForPreview: MealProduction[] = selectedLabels.map(label => ({
    mealId: label.mealId,
    mealName: label.mealName,
    quantity: label.quantity,
    totalCalories: label.totalCalories,
    totalProtein: label.totalProtein,
    totalFat: label.totalFat,
    totalCarbs: label.totalCarbs,
    ingredients: label.ingredients,
    allergens: label.allergens,
    orderCount: 1
  }));

  if (!order) return null;

  if (showPreview) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Label Preview - {order.customer_name || 'Order'} #{order.id.slice(-8)}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Use by date: <strong>{formatDate(new Date(useByDate), 'EEEE, MMMM d, yyyy')}</strong>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowPreview(false)}>
                  Back to Selection
                </Button>
                <Button onClick={generatePDFForLabels} disabled={isGenerating}>
                  <Download className="h-4 w-4 mr-2" />
                  {isGenerating ? 'Generating...' : 'Generate PDF'}
                </Button>
              </div>
            </div>

            <LabelPrintPreview 
              mealProduction={mealProductionForPreview} 
              useByDate={useByDate}
            />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Printer className="h-5 w-5" />
            Print Meal Labels - Order #{order.id.slice(-8)}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Order Information */}
          <div className="bg-muted p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Order Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Customer:</span>{' '}
                {order.customer_name || 'Unknown'}
              </div>
              <div>
                <span className="text-muted-foreground">Order Type:</span>{' '}
                <Badge variant="outline" className="ml-1">
                  {order.order_type || 'individual'}
                </Badge>
              </div>
              {order.package?.name && (
                <div className="col-span-2">
                  <span className="text-muted-foreground">Package:</span>{' '}
                  {order.package.name}
                </div>
              )}
              <div className="col-span-2">
                <span className="text-muted-foreground">Use by date:</span>{' '}
                <Badge variant="secondary" className="ml-1">
                  <Calendar className="h-3 w-3 mr-1" />
                  {formatDate(new Date(useByDate), 'MMM d, yyyy')}
                </Badge>
              </div>
            </div>
          </div>

          {/* Loading or Meal Selection */}
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-sm text-muted-foreground">Loading meal information...</p>
            </div>
          ) : mealLabels.length === 0 ? (
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-muted-foreground">
                No meals found
              </h3>
              <p className="text-sm text-muted-foreground">
                This order doesn't contain any meals to generate labels for.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Select Meals for Labels</h3>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAll}
                  >
                    Select All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDeselectAll}
                  >
                    Clear All
                  </Button>
                </div>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto">
                {mealLabels.map((meal) => (
                  <div
                    key={meal.mealId}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={meal.selected}
                        onCheckedChange={() => handleToggleMeal(meal.mealId)}
                      />
                      <div>
                        <div className="font-medium">{meal.mealName}</div>
                        <div className="text-sm text-muted-foreground">
                          {meal.totalCalories} cal • {meal.totalProtein}g protein
                        </div>
                      </div>
                    </div>
                    <Badge variant="secondary">{meal.quantity} labels</Badge>
                  </div>
                ))}
              </div>

              {/* Summary */}
              <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
                <h4 className="font-semibold mb-2">Label Summary</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Selected Meals:</span>{' '}
                    {selectedCount}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Total Labels:</span>{' '}
                    {totalLabels}
                  </div>
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Pages:</span>{' '}
                    {Math.ceil(totalLabels / 10)}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          {selectedCount > 0 && (
            <Button
              variant="outline"
              onClick={() => setShowPreview(true)}
              disabled={loading}
            >
              <FileText className="h-4 w-4 mr-2" />
              Preview Labels
            </Button>
          )}
          <Button
            onClick={generatePDFForLabels}
            disabled={selectedCount === 0 || isGenerating || loading}
          >
            <Printer className="h-4 w-4 mr-2" />
            {isGenerating ? 'Generating...' : 'Generate Labels'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};