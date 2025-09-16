import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Package, Eye, ArrowLeft, RefreshCw, ShoppingBag, CreditCard, Clock, Edit3, X, RotateCcw, Printer, RotateCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency, formatDate } from '@/lib/utils';
import { subDays } from 'date-fns';
import type { DateRange } from '@/types/common';

// Import new generic components
import { GenericFiltersBar, StatsCardsGrid, GenericDataTable } from '@/components/common';
import type { StatCardData, ColumnDef, ActionItem } from '@/components/common';

import CustomerLink from "@/components/admin/CustomerLink";
import OrderLink from "@/components/admin/OrderLink";
import { AdjustOrderModal } from "@/components/admin/orders/AdjustOrderModal";
import { VoidOrderDialog } from "@/components/admin/orders/VoidOrderDialog";
import { RefundOrderDialog } from "@/components/admin/orders/RefundOrderDialog";
import { PrintMealLabelsDialog } from "@/components/admin/orders/PrintMealLabelsDialog";

interface Order {
  id: string;
  user_id: string;
  customer_name: string;
  customer_email: string;
  total_amount: number;
  status: string;
  created_at: string;
  order_notes?: string;
  order_items?: any[];
  package_meal_selections?: any[];
  type: 'individual' | 'package';
  packages?: {
    name: string;
  };
}

interface OrderFilters {
  searchTerm: string;
  sortBy: string;
  sortOrder: "asc" | "desc";
  viewMode: "list" | "card";
  dateRange: DateRange;
}

const AllOrders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Filter state
  const [filters, setFilters] = useState<OrderFilters>({
    searchTerm: '',
    sortBy: 'created_at',
    sortOrder: 'desc',
    viewMode: 'list',
    dateRange: {
      from: subDays(new Date(), 30), // Default to last 30 days
      to: new Date(),
    }
  });

  // Modal states
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [voidDialogOpen, setVoidDialogOpen] = useState(false);
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  const [printLabelsDialogOpen, setPrintLabelsDialogOpen] = useState(false);

  useEffect(() => {
    fetchAllOrders();
  }, []);

  const fetchAllOrders = async () => {
    try {
      setLoading(true);

      // Fetch regular orders
      const { data: regularOrders, error: regularError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            meal_name,
            quantity
          )
        `)
        .order('created_at', { ascending: false });

      if (regularError) throw regularError;

      // Fetch package orders
      const { data: packageOrders, error: packageError } = await supabase
        .from('package_orders')
        .select(`
          *,
          packages (
            name
          ),
          package_meal_selections (
            id,
            quantity
          )
        `)
        .order('created_at', { ascending: false });

      if (packageError) throw packageError;

      // Combine and format orders
      const formattedRegularOrders: Order[] = (regularOrders || []).map(order => ({
        ...order,
        type: 'individual' as const
      }));

      const formattedPackageOrders: Order[] = (packageOrders || []).map(order => ({
        ...order,
        type: 'package' as const
      }));

      const allOrders = [...formattedRegularOrders, ...formattedPackageOrders];
      allOrders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setOrders(allOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: "Error",
        description: "Failed to load orders",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter orders based on search and date range
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      // Search filter
      const matchesSearch = order.id.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        (order.customer_name || '').toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        (order.customer_email || '').toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        (order.order_notes || '').toLowerCase().includes(filters.searchTerm.toLowerCase());
      
      // Date range filter
      const orderDate = new Date(order.created_at);
      const matchesDateRange = orderDate >= filters.dateRange.from && orderDate <= filters.dateRange.to;
      
      return matchesSearch && matchesDateRange;
    });
  }, [orders, filters.searchTerm, filters.dateRange]);

  // Stats data
  const statsData: StatCardData[] = useMemo(() => {
    const totalRevenue = orders.reduce((sum, order) => sum + order.total_amount, 0);
    const pendingOrders = orders.filter(order => order.status === 'pending');
    const todayOrders = orders.filter(order => {
      const today = new Date().toDateString();
      return new Date(order.created_at).toDateString() === today;
    });

    return [
      {
        id: 'total',
        title: 'Total Orders',
        value: orders.length,
        icon: Package,
        iconColor: 'text-blue-500'
      },
      {
        id: 'revenue',
        title: 'Total Revenue',
        value: formatCurrency(totalRevenue),
        icon: CreditCard,
        iconColor: 'text-green-500'
      },
      {
        id: 'pending',
        title: 'Pending Orders',
        value: pendingOrders.length,
        icon: Clock,
        iconColor: 'text-orange-500'
      },
      {
        id: 'today',
        title: 'Today\'s Orders',
        value: todayOrders.length,
        icon: ShoppingBag,
        iconColor: 'text-purple-500'
      }
    ];
  }, [orders]);

  // Table columns
  const columns: ColumnDef<Order>[] = [
    {
      key: 'id',
      header: 'Order ID',
      width: '120px',
      accessor: (order) => (
        <OrderLink orderId={order.id}>
          {order.id.slice(0, 8)}...
        </OrderLink>
      )
    },
    {
      key: 'customer_name',
      header: 'Customer',
      accessor: (order) => (
        <div>
          <CustomerLink 
            customerId={order.user_id} 
            customerName={order.customer_name || 'Unknown'}
          />
          <div className="text-xs text-muted-foreground">{order.customer_email}</div>
        </div>
      )
    },
    {
      key: 'total_amount',
      header: 'Amount',
      cell: (value: number) => formatCurrency(value),
      className: 'text-right'
    },
    {
      key: 'status',
      header: 'Status',
      accessor: (order) => (
        <Badge variant={
          order.status === 'delivered' ? 'default' :
          order.status === 'pending' ? 'secondary' :
          order.status === 'cancelled' ? 'destructive' : 'outline'
        }>
          {order.status}
        </Badge>
      )
    },
    {
      key: 'order_notes',
      header: 'Notes',
      accessor: (order) => (
        <div className="max-w-[150px]">
          {order.order_notes ? (
            <div className="text-xs text-muted-foreground truncate" title={order.order_notes}>
              📝 {order.order_notes.slice(0, 50)}{order.order_notes.length > 50 ? '...' : ''}
            </div>
          ) : (
            <span className="text-xs text-muted-foreground/50">No notes</span>
          )}
        </div>
      )
    },
    {
      key: 'created_at',
      header: 'Date',
      cell: (value: string) => formatDate(value, { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  ];

  // Order action handlers
  const handleViewOrder = (order: Order) => {
    navigate(`/orders/${order.id}`);
  };

  const handleAdjustOrder = (order: Order) => {
    setSelectedOrder(order);
    setAdjustModalOpen(true);
  };

  const handleVoidOrder = (order: Order) => {
    setSelectedOrder(order);
    setVoidDialogOpen(true);
  };

  const handleRefundOrder = (order: Order) => {
    setSelectedOrder(order);
    setRefundDialogOpen(true);
  };

  const handlePrintLabels = (order: Order) => {
    setSelectedOrder(order);
    setPrintLabelsDialogOpen(true);
  };

  const handleReOrder = (order: Order) => {
    // TODO: Implement re-order functionality using existing ReorderConfirmationModal
    toast({
      title: "Re-Order",
      description: `Re-order functionality for order ${order.id.slice(-8)} will be implemented soon.`,
    });
  };

  // Table actions
  const actions: ActionItem<Order>[] = [
    {
      label: 'View',
      icon: Eye,
      onClick: handleViewOrder,
      variant: 'outline'
    },
    {
      label: 'Adjust',
      icon: Edit3,
      onClick: handleAdjustOrder,
      variant: 'ghost'
    },
    {
      label: 'Void',
      icon: X,
      onClick: handleVoidOrder,
      variant: 'ghost'
    },
    {
      label: 'Refund',
      icon: RotateCcw,
      onClick: handleRefundOrder,
      variant: 'ghost'
    },
    {
      label: 'Print Meal Labels',
      icon: Printer,
      onClick: handlePrintLabels,
      variant: 'ghost'
    },
    {
      label: 'Re-Order',
      icon: RotateCw,
      onClick: handleReOrder,
      variant: 'ghost'
    }
  ];

  const sortOptions = [
    { value: 'created_at', label: 'Date Created' },
    { value: 'total_amount', label: 'Amount' },
    { value: 'status', label: 'Status' },
    { value: 'customer_name', label: 'Customer Name' }
  ];

  // Clear date range function (like in customer management)
  const clearDateRange = () => {
    setFilters(prev => ({
      ...prev,
      dateRange: {
        from: new Date(2020, 0, 1), // Show all orders from 2020
        to: new Date(),
      }
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">All Orders</h1>
            <p className="text-muted-foreground">
              View and manage all customer orders
            </p>
          </div>
        </div>
        <Button 
          variant="outline" 
          onClick={fetchAllOrders}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <StatsCardsGrid 
        stats={statsData}
        columns={4}
        loading={loading}
      />

      {/* Filters */}
      <GenericFiltersBar
        filters={filters}
        onFiltersChange={(newFilters) => setFilters(prev => ({ ...prev, ...newFilters }))}
        totalCount={orders.length}
        filteredCount={filteredOrders.length}
        searchPlaceholder="Search orders by ID, customer name, email, or notes..."
        sortOptions={sortOptions}
        viewModes={['list']}
        entityName="order"
        entityNamePlural="orders"
        dateRange={filters.dateRange}
        onDateRangeChange={(range) => {
          if (range) {
            setFilters(prev => ({ ...prev, dateRange: range }));
          } else {
            clearDateRange();
          }
        }}
        clearDateRange={clearDateRange}
      />

      {/* Orders Table */}
      <GenericDataTable
        data={filteredOrders}
        columns={columns}
        actions={actions}
        loading={loading}
        getRowId={(order) => order.id}
        onRowClick={(order) => navigate(`/orders/${order.id}`)}
        emptyMessage="No orders found"
        emptyDescription="Orders will appear here once customers start placing them"
      />

      {/* Action Modals */}
      <AdjustOrderModal
        isOpen={adjustModalOpen}
        onClose={() => setAdjustModalOpen(false)}
        order={selectedOrder}
        onOrderUpdated={fetchAllOrders}
      />

      <VoidOrderDialog
        isOpen={voidDialogOpen}
        onClose={() => setVoidDialogOpen(false)}
        order={selectedOrder}
        onOrderVoided={fetchAllOrders}
      />

      <RefundOrderDialog
        isOpen={refundDialogOpen}
        onClose={() => setRefundDialogOpen(false)}
        order={selectedOrder}
        onOrderRefunded={fetchAllOrders}
      />

      <PrintMealLabelsDialog
        isOpen={printLabelsDialogOpen}
        onClose={() => setPrintLabelsDialogOpen(false)}
        order={selectedOrder}
      />

    </div>
  );
};

export default AllOrders;