import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Package, ArrowLeft, RefreshCw, ShoppingBag, CreditCard, Clock, Edit3, X, RotateCcw, Printer, RotateCw, Truck, MapPin } from 'lucide-react';
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
import { OrderTypeIndicators } from "@/components/admin/orders/OrderTypeIndicators";
import { AdjustOrderModal } from "@/components/admin/orders/AdjustOrderModal";
import { VoidOrderDialog } from "@/components/admin/orders/VoidOrderDialog";
import { RefundOrderDialog } from "@/components/admin/orders/RefundOrderDialog";
import { PrintMealLabelsDialog } from "@/components/admin/orders/PrintMealLabelsDialog";
import ReorderConfirmationModal from "@/components/orders/ReorderConfirmationModal";
import { useAdminReorder } from "@/hooks/useAdminReorder";
import { cn } from "@/lib/utils";

interface Order {
  id: string;
  user_id: string;
  customer_name: string;
  customer_email: string;
  total_amount: number;
  status: string;
  created_at: string;
  requested_delivery_date?: string | null;
  order_notes?: string;
  order_items?: any[];
  package_meal_selections?: any[];
  type: 'individual' | 'package';
  packages?: {
    name: string;
  };
  // Special order indicators
  stripe_payment_intent_id?: string | null;
  voided_at?: string | null;
  last_modified_by?: string | null;
  isManual?: boolean;
  isAdjusted?: boolean;
  // Customer postcode
  postcode?: string | null;
  // Explicit fulfillment fields from database
  fulfillment_method?: string | null;
  collection_point_id?: string | null;
  delivery_zone_id?: string | null;
  delivery_address?: string | null;
  // Computed fulfillment method for display
  fulfillmentMethod: 'delivery' | 'collection';
}

interface OrderFilters {
  searchTerm: string;
  sortBy: string;
  sortOrder: "asc" | "desc";
  viewMode: "list" | "card";
  dateRange: DateRange;
  fulfillmentFilter: 'all' | 'delivery' | 'collection';
}

// Helper function to determine fulfillment method
// Primary source: explicit fulfillment_method field from database
// Legacy fallback only for orders without explicit field set
const getFulfillmentMethod = (
  order: { fulfillment_method?: string | null; delivery_address?: string | null; collection_point_id?: string | null },
  collectionPointAddresses: string[]
): 'delivery' | 'collection' => {
  // PRIMARY: Use explicit field from database if set
  const explicitMethod = order.fulfillment_method?.toLowerCase().trim();
  if (explicitMethod === 'collection') return 'collection';
  if (explicitMethod === 'delivery') return 'delivery';
  
  // SECONDARY: Check collection_point_id (if set, it's definitely collection)
  if (order.collection_point_id) return 'collection';
  
  // LEGACY FALLBACK: Only for old orders without explicit fulfillment_method
  // These should be rare after backfill migration
  if (!order.delivery_address) return 'delivery';
  
  const normalizedAddress = order.delivery_address.toLowerCase().trim();
  
  // Check against known collection point addresses/names
  for (const cpIdentifier of collectionPointAddresses) {
    if (!cpIdentifier) continue;
    const normalizedCp = cpIdentifier.toLowerCase().trim();
    // Only match if the address STARTS with the collection point name
    // This prevents false positives
    if (normalizedAddress.startsWith(normalizedCp) || normalizedAddress === normalizedCp) {
      return 'collection';
    }
  }
  
  return 'delivery';
};

const AllOrders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [collectionPointAddresses, setCollectionPointAddresses] = useState<string[]>([]);
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
    },
    fulfillmentFilter: 'all'
  });

  // Modal states
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [voidDialogOpen, setVoidDialogOpen] = useState(false);
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  const [printLabelsDialogOpen, setPrintLabelsDialogOpen] = useState(false);
  
  const adminReorder = useAdminReorder();

  useEffect(() => {
    fetchAllOrders();
  }, []);

  const fetchAllOrders = async () => {
    try {
      setLoading(true);

      // Fetch collection points first to determine fulfillment method
      // Try full table first (admin access), fall back to public view
      let collectionPoints: { address: string; point_name: string }[] = [];
      const { data: cpData, error: cpError } = await supabase
        .from('collection_points')
        .select('address, point_name')
        .eq('is_active', true);
      
      if (cpError || !cpData || cpData.length === 0) {
        // Fallback to public view if admin access fails
        const { data: publicCpData } = await supabase
          .from('collection_points_public')
          .select('address, point_name')
          .eq('is_active', true);
        collectionPoints = (publicCpData || []) as { address: string; point_name: string }[];
      } else {
        collectionPoints = cpData;
      }

      console.log('Collection points loaded:', collectionPoints);

      const cpAddresses = collectionPoints.map(cp => cp.address).filter(Boolean);
      const cpNames = collectionPoints.map(cp => cp.point_name).filter(Boolean);
      const allCpIdentifiers = [...cpAddresses, ...cpNames];
      console.log('Collection point identifiers:', allCpIdentifiers);
      setCollectionPointAddresses(allCpIdentifiers);

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

      // Fetch audit log to identify manual and adjusted orders
      const allOrderIds = [
        ...(regularOrders || []).map(o => o.id),
        ...(packageOrders || []).map(o => o.id)
      ];

      // Fetch profiles for postcodes
      const allUserIds = [
        ...(regularOrders || []).map(o => o.user_id),
        ...(packageOrders || []).map(o => o.user_id)
      ].filter(Boolean);

      const [auditResult, profilesResult] = await Promise.all([
        supabase
          .from('order_audit_log')
          .select('order_id, action_type')
          .in('order_id', allOrderIds),
        supabase
          .from('profiles')
          .select('user_id, postal_code')
          .in('user_id', allUserIds)
      ]);

      if (auditResult.error) {
        console.warn('Could not fetch audit logs:', auditResult.error);
      }

      // Create lookup maps
      const postcodeByUserId = new Map(
        (profilesResult.data || []).map(p => [p.user_id, p.postal_code])
      );
      const manualOrderIds = new Set(
        (auditResult.data || [])
          .filter(log => log.action_type === 'admin_create')
          .map(log => log.order_id)
      );
      const adjustedOrderIds = new Set(
        (auditResult.data || [])
          .filter(log => log.action_type === 'adjust')
          .map(log => log.order_id)
      );

      // Combine and format orders with special indicators
      const formattedRegularOrders: Order[] = (regularOrders || []).map(order => ({
        ...order,
        type: 'individual' as const,
        isManual: manualOrderIds.has(order.id),
        isAdjusted: adjustedOrderIds.has(order.id),
        postcode: postcodeByUserId.get(order.user_id) || null,
        // Use explicit fulfillment_method from DB, with legacy fallback
        fulfillmentMethod: getFulfillmentMethod(order, allCpIdentifiers)
      }));

      const formattedPackageOrders: Order[] = (packageOrders || []).map(order => ({
        ...order,
        type: 'package' as const,
        isManual: manualOrderIds.has(order.id),
        isAdjusted: adjustedOrderIds.has(order.id),
        postcode: postcodeByUserId.get(order.user_id) || null,
        // Use explicit fulfillment_method from DB, with legacy fallback
        fulfillmentMethod: getFulfillmentMethod(order, allCpIdentifiers)
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

  // Filter orders based on search, date range, and fulfillment method
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
      
      // Fulfillment method filter
      const matchesFulfillment = filters.fulfillmentFilter === 'all' || 
        order.fulfillmentMethod === filters.fulfillmentFilter;
      
      return matchesSearch && matchesDateRange && matchesFulfillment;
    });
  }, [orders, filters.searchTerm, filters.dateRange, filters.fulfillmentFilter]);

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
      key: 'postcode',
      header: 'Postcode',
      accessor: (order) => (
        <span className="text-sm">{order.postcode || '—'}</span>
      )
    },
    {
      key: 'fulfillmentMethod',
      header: 'Method',
      accessor: (order) => (
        <div className="flex items-center gap-1.5">
          {order.fulfillmentMethod === 'delivery' ? (
            <>
              <Truck className="h-4 w-4 text-blue-500" />
              <span className="text-sm">Delivery</span>
            </>
          ) : (
            <>
              <MapPin className="h-4 w-4 text-green-500" />
              <span className="text-sm">Collection</span>
            </>
          )}
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
        <div className="flex items-center gap-2">
          <Badge variant={
            order.status === 'delivered' ? 'default' :
            order.status === 'pending' ? 'secondary' :
            order.status === 'cancelled' ? 'destructive' : 'outline'
          }>
            {order.status}
          </Badge>
          <OrderTypeIndicators
            isManual={order.isManual}
            isCash={!order.stripe_payment_intent_id && !order.isManual}
            isAdjusted={order.isAdjusted}
            isVoided={!!order.voided_at}
          />
        </div>
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
      header: 'Order Placed',
      sortable: true,
      cell: (value: string) => formatDate(value, { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric'
      })
    },
    {
      key: 'requested_delivery_date',
      header: 'Delivery Date',
      sortable: true,
      accessor: (order) => order.requested_delivery_date 
        ? formatDate(order.requested_delivery_date, { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric'
          })
        : <span className="text-muted-foreground">—</span>
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
    // Check if this is a package order based on the type field  
    const orderType: 'package' | 'regular' = order.type === 'package' ? 'package' : 'regular';
    adminReorder.initiateReorder(order, orderType);
  };

  // Table actions
  const actions: ActionItem<Order>[] = [
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

      {/* Fulfillment Filter */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Filter:</span>
        <div className="flex gap-1">
          <Button
            variant={filters.fulfillmentFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilters(prev => ({ ...prev, fulfillmentFilter: 'all' }))}
          >
            All
          </Button>
          <Button
            variant={filters.fulfillmentFilter === 'delivery' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilters(prev => ({ ...prev, fulfillmentFilter: 'delivery' }))}
          >
            <Truck className="h-4 w-4 mr-1" />
            Delivery
          </Button>
          <Button
            variant={filters.fulfillmentFilter === 'collection' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilters(prev => ({ ...prev, fulfillmentFilter: 'collection' }))}
          >
            <MapPin className="h-4 w-4 mr-1" />
            Collection
          </Button>
        </div>
      </div>

      {/* Orders Table */}
      <GenericDataTable
        data={filteredOrders}
        columns={columns}
        actions={actions}
        loading={loading}
        getRowId={(order) => order.id}
        onRowClick={(order) => navigate(`/orders/${order.id}`)}
        getRowClassName={(order) => order.voided_at ? "opacity-50" : ""}
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

      <ReorderConfirmationModal
        open={adminReorder.showReorderModal}
        onOpenChange={adminReorder.closeModal}
        order={adminReorder.selectedOrder}
        orderType={adminReorder.selectedOrderType}
        onReorderAsIs={adminReorder.handleReorderAsIs}
        onEditInCart={adminReorder.handleEditInCart}
      />

    </div>
  );
};

export default AllOrders;