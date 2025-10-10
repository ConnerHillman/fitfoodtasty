import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { Download, Loader2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface MealProductionReportProps {
  isOpen: boolean;
  onClose: () => void;
  dateRange: { from: Date; to: Date };
}

interface MealQuantity {
  meal_name: string;
  total_quantity: number;
  meal_id: string;
}

export function MealProductionReport({ isOpen, onClose, dateRange }: MealProductionReportProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [mealQuantities, setMealQuantities] = useState<MealQuantity[]>([]);

  useEffect(() => {
    if (isOpen) {
      fetchMealProduction();
    }
  }, [isOpen, dateRange]);

  const fetchMealProduction = async () => {
    setLoading(true);
    try {
      // Fetch from individual orders
      const { data: orderItems, error: orderError } = await supabase
        .from('order_items')
        .select(`
          meal_id,
          meal_name,
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

      // Fetch from package orders
      const { data: packageSelections, error: packageError } = await supabase
        .from('package_meal_selections')
        .select(`
          meal_id,
          quantity,
          package_order:package_orders!inner(
            requested_delivery_date,
            status
          ),
          meal:meals(name)
        `)
        .gte('package_order.requested_delivery_date', format(dateRange.from, 'yyyy-MM-dd'))
        .lte('package_order.requested_delivery_date', format(dateRange.to, 'yyyy-MM-dd'))
        .in('package_order.status', ['confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'completed']);

      if (packageError) throw packageError;

      // Aggregate quantities
      const quantityMap = new Map<string, { meal_name: string; total_quantity: number }>();

      orderItems?.forEach((item: any) => {
        const existing = quantityMap.get(item.meal_id) || { meal_name: item.meal_name, total_quantity: 0 };
        existing.total_quantity += item.quantity;
        quantityMap.set(item.meal_id, existing);
      });

      packageSelections?.forEach((item: any) => {
        const mealName = item.meal?.name || 'Unknown Meal';
        const existing = quantityMap.get(item.meal_id) || { meal_name: mealName, total_quantity: 0 };
        existing.total_quantity += item.quantity;
        quantityMap.set(item.meal_id, existing);
      });

      const quantities = Array.from(quantityMap.entries()).map(([meal_id, data]) => ({
        meal_id,
        meal_name: data.meal_name,
        total_quantity: data.total_quantity,
      })).sort((a, b) => b.total_quantity - a.total_quantity);

      setMealQuantities(quantities);
    } catch (error: any) {
      console.error('Meal production fetch error:', error);
      toast({
        title: 'Error',
        description: error?.message || 'Failed to fetch meal production data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = () => {
    const headers = ['Meal Name', 'Quantity Needed'];
    const rows = mealQuantities.map(m => [m.meal_name, m.total_quantity]);
    
    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `meal-production-${format(dateRange.from, 'yyyy-MM-dd')}-to-${format(dateRange.to, 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Meal Production Report
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
                Total meals: {mealQuantities.reduce((sum, m) => sum + m.total_quantity, 0)}
              </p>
              <Button onClick={downloadCSV} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Download CSV
              </Button>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Meal Name</TableHead>
                  <TableHead className="text-right">Quantity Needed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mealQuantities.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center text-muted-foreground">
                      No meals found for this date range
                    </TableCell>
                  </TableRow>
                ) : (
                  mealQuantities.map((meal) => (
                    <TableRow key={meal.meal_id}>
                      <TableCell className="font-medium">{meal.meal_name}</TableCell>
                      <TableCell className="text-right">{meal.total_quantity}</TableCell>
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
