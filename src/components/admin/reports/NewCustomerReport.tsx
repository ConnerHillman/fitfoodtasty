import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { Download, Loader2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getDisplayName } from '@/lib/displayName';

interface NewCustomerReportProps {
  isOpen: boolean;
  onClose: () => void;
  dateRange: { from: Date; to: Date };
}

interface NewCustomer {
  user_id: string;
  display_name: string;
  created_at: string;
  first_order_date: string | null;
  first_order_amount: number | null;
  postal_code: string;
}

export function NewCustomerReport({ isOpen, onClose, dateRange }: NewCustomerReportProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [newCustomers, setNewCustomers] = useState<NewCustomer[]>([]);

  useEffect(() => {
    if (isOpen) {
      fetchNewCustomers();
    }
  }, [isOpen, dateRange]);

  const fetchNewCustomers = async () => {
    setLoading(true);
    try {
      // Fetch new profiles created in date range
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name, full_name, created_at, postal_code')
        .gte('created_at', format(dateRange.from, 'yyyy-MM-dd'))
        .lte('created_at', format(dateRange.to, 'yyyy-MM-dd'))
        .order('created_at', { ascending: false });

      if (profileError) throw profileError;

      if (!profiles || profiles.length === 0) {
        setNewCustomers([]);
        return;
      }

      const userIds = profiles.map(p => p.user_id);

      // Fetch their first orders
      const { data: orders, error: orderError } = await supabase
        .from('orders')
        .select('user_id, created_at, total_amount')
        .in('user_id', userIds)
        .in('status', ['confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'completed'])
        .order('created_at', { ascending: true });

      if (orderError) throw orderError;

      // Find first order for each customer
      const firstOrderMap = new Map<string, { date: string; amount: number }>();
      orders?.forEach(order => {
        if (!firstOrderMap.has(order.user_id)) {
          firstOrderMap.set(order.user_id, {
            date: order.created_at,
            amount: Number(order.total_amount),
          });
        }
      });

      // Format customer data
      const customers: NewCustomer[] = profiles.map(profile => {
        const firstOrder = firstOrderMap.get(profile.user_id);
        return {
          user_id: profile.user_id,
          display_name: getDisplayName(profile, 'Unknown'),
          created_at: profile.created_at,
          first_order_date: firstOrder?.date || null,
          first_order_amount: firstOrder?.amount || null,
          postal_code: profile.postal_code || '',
        };
      });

      setNewCustomers(customers);
    } catch (error: any) {
      console.error('New customer report fetch error:', error);
      toast({
        title: 'Error',
        description: error?.message || 'Failed to fetch new customer data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = () => {
    const headers = ['Customer Name', 'Signup Date', 'Postal Code', 'First Order Date', 'First Order Amount'];
    const rows = newCustomers.map(customer => [
      customer.display_name,
      format(new Date(customer.created_at), 'PPP'),
      customer.postal_code,
      customer.first_order_date ? format(new Date(customer.first_order_date), 'PPP') : 'No order yet',
      customer.first_order_amount ? `£${customer.first_order_amount.toFixed(2)}` : 'N/A',
    ]);
    
    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `new-customers-${format(dateRange.from, 'yyyy-MM-dd')}-to-${format(dateRange.to, 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const customersWithOrders = newCustomers.filter(c => c.first_order_date).length;
  const conversionRate = newCustomers.length > 0 
    ? ((customersWithOrders / newCustomers.length) * 100).toFixed(1)
    : 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            New Customer Report
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
              <div className="flex gap-4 text-sm text-muted-foreground">
                <span>Total signups: {newCustomers.length}</span>
                <span>•</span>
                <span>With orders: {customersWithOrders}</span>
                <span>•</span>
                <span>Conversion: {conversionRate}%</span>
              </div>
              <Button onClick={downloadCSV} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Download CSV
              </Button>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer Name</TableHead>
                  <TableHead>Signup Date</TableHead>
                  <TableHead>Postal Code</TableHead>
                  <TableHead>First Order</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {newCustomers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No new customers found for this date range
                    </TableCell>
                  </TableRow>
                ) : (
                  newCustomers.map((customer) => (
                    <TableRow key={customer.user_id}>
                      <TableCell className="font-medium">{customer.display_name}</TableCell>
                      <TableCell>{format(new Date(customer.created_at), 'PPP')}</TableCell>
                      <TableCell>{customer.postal_code}</TableCell>
                      <TableCell>
                        {customer.first_order_date ? (
                          format(new Date(customer.first_order_date), 'PPP')
                        ) : (
                          <span className="text-muted-foreground">No order yet</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {customer.first_order_amount !== null ? (
                          `£${customer.first_order_amount.toFixed(2)}`
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
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
