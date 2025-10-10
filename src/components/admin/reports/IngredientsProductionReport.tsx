import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { Download, Loader2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface IngredientsProductionReportProps {
  isOpen: boolean;
  onClose: () => void;
  dateRange: { from: Date; to: Date };
}

interface IngredientQuantity {
  ingredient_name: string;
  total_quantity: number;
  unit: string;
}

export function IngredientsProductionReport({ isOpen, onClose, dateRange }: IngredientsProductionReportProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [ingredientQuantities, setIngredientQuantities] = useState<IngredientQuantity[]>([]);

  useEffect(() => {
    if (isOpen) {
      fetchIngredientProduction();
    }
  }, [isOpen, dateRange]);

  const fetchIngredientProduction = async () => {
    setLoading(true);
    try {
      // Get meal quantities needed
      const { data: orderItems, error: orderError } = await supabase
        .from('order_items')
        .select(`
          meal_id,
          quantity,
          order:orders!inner(
            requested_delivery_date,
            status
          )
        `)
        .gte('order.requested_delivery_date', format(dateRange.from, 'yyyy-MM-dd'))
        .lte('order.requested_delivery_date', format(dateRange.to, 'yyyy-MM-dd'))
        .in('order.status', ['confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'completed']);

      if (orderError) throw orderError;

      const { data: packageSelections, error: packageError } = await supabase
        .from('package_meal_selections')
        .select(`
          meal_id,
          quantity,
          package_order:package_orders!inner(
            requested_delivery_date,
            status
          )
        `)
        .gte('package_order.requested_delivery_date', format(dateRange.from, 'yyyy-MM-dd'))
        .lte('package_order.requested_delivery_date', format(dateRange.to, 'yyyy-MM-dd'))
        .in('package_order.status', ['confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'completed']);

      if (packageError) throw packageError;

      // Aggregate meal quantities
      const mealQuantityMap = new Map<string, number>();
      orderItems?.forEach((item: any) => {
        const current = mealQuantityMap.get(item.meal_id) || 0;
        mealQuantityMap.set(item.meal_id, current + item.quantity);
      });
      packageSelections?.forEach((item: any) => {
        const current = mealQuantityMap.get(item.meal_id) || 0;
        mealQuantityMap.set(item.meal_id, current + item.quantity);
      });

      // Fetch ingredients for these meals
      const mealIds = Array.from(mealQuantityMap.keys());
      const { data: mealIngredients, error: ingredientsError } = await supabase
        .from('meal_ingredients')
        .select(`
          meal_id,
          ingredient_id,
          quantity,
          unit,
          ingredient:ingredients(name)
        `)
        .in('meal_id', mealIds);

      if (ingredientsError) throw ingredientsError;

      // Calculate total ingredient quantities
      const ingredientMap = new Map<string, { name: string; quantity: number; unit: string }>();
      
      mealIngredients?.forEach((mi: any) => {
        const mealCount = mealQuantityMap.get(mi.meal_id) || 0;
        const totalNeeded = mi.quantity * mealCount;
        const ingredientName = mi.ingredient?.name || 'Unknown';
        
        const existing = ingredientMap.get(ingredientName);
        if (existing) {
          existing.quantity += totalNeeded;
        } else {
          ingredientMap.set(ingredientName, {
            name: ingredientName,
            quantity: totalNeeded,
            unit: mi.unit || 'g',
          });
        }
      });

      const ingredients = Array.from(ingredientMap.values())
        .map(i => ({
          ingredient_name: i.name,
          total_quantity: Math.round(i.quantity * 10) / 10,
          unit: i.unit,
        }))
        .sort((a, b) => a.ingredient_name.localeCompare(b.ingredient_name));

      setIngredientQuantities(ingredients);
    } catch (error: any) {
      console.error('Ingredient production fetch error:', error);
      toast({
        title: 'Error',
        description: error?.message || 'Failed to fetch ingredient production data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = () => {
    const headers = ['Ingredient Name', 'Quantity Needed', 'Unit'];
    const rows = ingredientQuantities.map(i => [i.ingredient_name, i.total_quantity, i.unit]);
    
    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ingredient-production-${format(dateRange.from, 'yyyy-MM-dd')}-to-${format(dateRange.to, 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Ingredients Production Report
            <div className="text-sm font-normal text-muted-foreground mt-1">
              {format(dateRange.from, 'PPP')} - {format(dateRange.to, 'PPP')}
            </div>
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm text-muted-foreground">
                Total ingredients: {ingredientQuantities.length}
              </p>
              <Button onClick={downloadCSV} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Download CSV
              </Button>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ingredient Name</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Unit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ingredientQuantities.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                      No ingredients found for this date range
                    </TableCell>
                  </TableRow>
                ) : (
                  ingredientQuantities.map((ingredient, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{ingredient.ingredient_name}</TableCell>
                      <TableCell className="text-right">{ingredient.total_quantity}</TableCell>
                      <TableCell className="text-right">{ingredient.unit}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
