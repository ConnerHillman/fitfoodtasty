import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { Download, Loader2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface OrderItemSummaryReportProps {
  isOpen: boolean;
  onClose: () => void;
  dateRange: { from: Date; to: Date };
}

interface OrderItem {
  customer_name: string;
  delivery_date: string;
  meal_name: string;
  quantity: number;
  delivery_address: string;
}

export function OrderItemSummaryReport({ isOpen, onClose, dateRange }: OrderItemSummaryReportProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);

  useEffect(() => {
    if (isOpen) {
      fetchOrderItems();
    }
  }, [isOpen, dateRange]);

  const fetchOrderItems = async () => {
    setLoading(true);
    try {
      // Fetch individual order items
      const { data: items, error: itemsError } = await supabase
        .from('order_items')
        .select(`
          meal_name,
          quantity,
          order:orders!inner(
            customer_name,
            delivery_address,
            requested_delivery_date,
            status
          )
        `)
        .gte('order.requested_delivery_date', format(dateRange.from, 'yyyy-MM-dd'))
        .lte('order.requested_delivery_date', format(dateRange.to, 'yyyy-MM-dd'))
        .in('order.status', ['confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'completed']);

      if (itemsError) throw itemsError;

      // Fetch package order items
      const { data: packageItems, error: packageError } = await supabase
        .from('package_meal_selections')
        .select(`
          quantity,
          meal:meals(name),
          package_order:package_orders!inner(
            customer_name,
            delivery_address,
            requested_delivery_date,
            status
          )
        `)
        .gte('package_order.requested_delivery_date', format(dateRange.from, 'yyyy-MM-dd'))
        .lte('package_order.requested_delivery_date', format(dateRange.to, 'yyyy-MM-dd'))
        .in('package_order.status', ['confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'completed']);

      if (packageError) throw packageError;

      // Format data
      const formattedItems: OrderItem[] = [
        ...(items?.map((item: any) => ({
          customer_name: item.order.customer_name || 'Unknown',
          delivery_date: item.order.requested_delivery_date,
          meal_name: item.meal_name,
          quantity: item.quantity,
          delivery_address: item.order.delivery_address || '',
        })) || []),
        ...(packageItems?.map((item: any) => ({
          customer_name: item.package_order.customer_name || 'Unknown',
          delivery_date: item.package_order.requested_delivery_date,
          meal_name: item.meal?.name || 'Unknown Meal',
          quantity: item.quantity,
          delivery_address: item.package_order.delivery_address || '',
        })) || []),
      ].sort((a, b) => {
        // Sort by date, then customer name
        const dateCompare = a.delivery_date.localeCompare(b.delivery_date);
        if (dateCompare !== 0) return dateCompare;
        return a.customer_name.localeCompare(b.customer_name);
      });

      setOrderItems(formattedItems);
    } catch (error: any) {
      console.error('Order item summary fetch error:', error);
      toast({
        title: 'Error',
        description: error?.message || 'Failed to fetch order item summary',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = () => {
    const headers = ['Customer Name', 'Delivery Date', 'Meal Name', 'Quantity', 'Delivery Address'];
    const rows = orderItems.map(item => [
      item.customer_name,
      format(new Date(item.delivery_date), 'PPP'),
      item.meal_name,
      item.quantity,
      item.delivery_address,
    ]);
    
    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `order-item-summary-${format(dateRange.from, 'yyyy-MM-dd')}-to-${format(dateRange.to, 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Order Item Summary
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
                Total items: {orderItems.reduce((sum, item) => sum + item.quantity, 0)}
              </p>
              <Button onClick={downloadCSV} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Download CSV
              </Button>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Delivery Date</TableHead>
                  <TableHead>Meal</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead>Address</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orderItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No orders found for this date range
                    </TableCell>
                  </TableRow>
                ) : (
                  orderItems.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{item.customer_name}</TableCell>
                      <TableCell>{format(new Date(item.delivery_date), 'PPP')}</TableCell>
                      <TableCell>{item.meal_name}</TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-sm text-muted-foreground truncate max-w-xs">
                        {item.delivery_address}
                      </TableCell>
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
