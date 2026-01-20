import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  Clock, 
  User, 
  MapPin, 
  CreditCard, 
  Package,
  ChefHat,
  Calendar,
  Phone,
  Mail,
  Hash,
  Truck,
  Edit3,
  X,
  RotateCcw,
  Printer,
  RotateCw,
  Tag,
  AlertTriangle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { AdjustOrderModal } from '@/components/admin/orders/AdjustOrderModal';
import { VoidOrderDialog } from '@/components/admin/orders/VoidOrderDialog';
import { RefundOrderDialog } from '@/components/admin/orders/RefundOrderDialog';
import { PrintMealLabelsDialog } from '@/components/admin/orders/PrintMealLabelsDialog';
import ReorderConfirmationModal from '@/components/orders/ReorderConfirmationModal';
import OrderNotesSection from '@/components/admin/orders/OrderNotesSection';
import { useAdminReorder } from '@/hooks/useAdminReorder';

interface OrderItem {
  id: string;
  meal_id: string;
  meal_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface PackageMealSelection {
  id: string;
  meal_id: string;
  quantity: number;
  meals?: {
    name: string;
    price: number;
  };
}

interface OrderDetails {
  id: string;
  user_id: string;
  customer_name: string;
  customer_email: string;
  delivery_address: string;
  total_amount: number;
  discount_amount?: number;
  status: string;
  currency: string;
  stripe_payment_intent_id?: string;
  referral_code_used?: string;
  requested_delivery_date?: string;
  created_at: string;
  updated_at: string;
  order_notes?: string;
  private_note?: string;
  order_items?: OrderItem[];
  package_id?: string;
  package_meal_selections?: PackageMealSelection[];
  packages?: {
    name: string;
    description: string;
    meal_count: number;
  };
  // Coupon fields
  coupon_type?: string;
  coupon_discount_percentage?: number;
  coupon_discount_amount?: number;
  coupon_free_delivery?: boolean;
  // Refund/void fields
  refund_amount?: number;
  refund_reason?: string;
  voided_at?: string;
  voided_by?: string;
}

const OrderDetails: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPackageOrder, setIsPackageOrder] = useState(false);
  const { toast } = useToast();

  // Modal states
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [voidDialogOpen, setVoidDialogOpen] = useState(false);
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  const [printLabelsDialogOpen, setPrintLabelsDialogOpen] = useState(false);
  
  const adminReorder = useAdminReorder();

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId]);

  const fetchOrderDetails = async () => {
    if (!orderId) return;

    try {
      setLoading(true);

      // First try to fetch as a regular order
      const { data: regularOrder, error: regularError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            meal_id,
            meal_name,
            quantity,
            unit_price,
            total_price
          )
        `)
        .eq('id', orderId)
        .single();

      if (regularOrder && !regularError) {
        // Add default discount_amount for regular orders if not present
        const orderWithDefaults = {
          ...regularOrder,
          discount_amount: regularOrder.discount_amount || 0
        };
        setOrder(orderWithDefaults);
        setIsPackageOrder(false);
        return;
      }

      // If not found, try as package order
      const { data: packageOrder, error: packageError } = await supabase
        .from('package_orders')
        .select(`
          *,
          packages (
            name,
            description,
            meal_count
          ),
          package_meal_selections (
            id,
            meal_id,
            quantity,
            meals (
              name,
              price
            )
          )
        `)
        .eq('id', orderId)
        .single();

      if (packageOrder && !packageError) {
        // Add default discount_amount for package orders if not present
        const orderWithDefaults = {
          ...packageOrder,
          discount_amount: (packageOrder as any).discount_amount || 0
        };
        setOrder(orderWithDefaults);
        setIsPackageOrder(true);
        return;
      }

      // If neither found, show error
      toast({
        title: "Order Not Found",
        description: "The requested order could not be found.",
        variant: "destructive",
      });
    } catch (error) {
      console.error('Error fetching order details:', error);
      toast({
        title: "Error",
        description: "Failed to load order details.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'delivered':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: order?.currency?.toUpperCase() || 'GBP'
    }).format(amount);
  };

  const getTotalMealsCount = () => {
    if (isPackageOrder) {
      return order.package_meal_selections?.reduce((total, selection) => total + selection.quantity, 0) || 0;
    } else {
      return order.order_items?.reduce((total, item) => total + item.quantity, 0) || 0;
    }
  };

  // Calculate subtotal from actual item prices (matching customer page logic)
  const calculateSubtotal = (): number => {
    if (isPackageOrder) {
      return order.package_meal_selections?.reduce((sum, s) => 
        sum + (s.meals?.price || 0) * s.quantity, 0) || 0;
    }
    return order.order_items?.reduce((sum, item) => sum + item.total_price, 0) || 0;
  };

  // Check if this is a collection order using explicit field
  const isCollectionOrder = (): boolean => {
    // Use explicit fulfillment_method field if available
    if ((order as any).fulfillment_method === 'collection') return true;
    if ((order as any).fulfillment_method === 'delivery') return false;
    
    // Legacy fallback for old orders
    if (!order.delivery_address) return false;
    const address = order.delivery_address.toLowerCase();
    return address.includes('collection point') ||
           address.includes('pickup') ||
           address.includes('collect from');
  };

  // Action handlers
  const handleAdjustOrder = () => {
    setAdjustModalOpen(true);
  };

  const handleVoidOrder = () => {
    setVoidDialogOpen(true);
  };

  const handleRefundOrder = () => {
    setRefundDialogOpen(true);
  };

  const handlePrintLabels = () => {
    setPrintLabelsDialogOpen(true);
  };

  const handleReOrder = () => {
    if (!order) return;
    
    const orderType = isPackageOrder ? 'package' : 'regular';
    adminReorder.initiateReorder(order, orderType);
  };

  const handleOrderUpdated = () => {
    fetchOrderDetails(); // Refresh order data
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!order) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Order Not Found</h1>
            <p className="text-muted-foreground mb-4">The requested order could not be found.</p>
            <Link to="/admin?tab=orders">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Orders
              </Button>
            </Link>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/admin?tab=orders">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Orders
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Order Details</h1>
              <p className="text-muted-foreground">
                {isPackageOrder ? 'Package Order' : 'Individual Order'} #{order.id.slice(-8)}
              </p>
            </div>
          </div>
          <Badge className={getStatusColor(order.status)}>
            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer and Delivery Information at Top */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Customer Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Customer Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Name:</span>
                      <span>{order.customer_name || 'Not provided'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Email:</span>
                      <span>{order.customer_email || 'Not provided'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Hash className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">User ID:</span>
                      <span className="text-xs text-muted-foreground">{order.user_id}</span>
                    </div>
                    {order.referral_code_used && (
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          Referral: {order.referral_code_used}
                        </Badge>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Delivery/Collection Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {isCollectionOrder() ? (
                      <MapPin className="h-5 w-5" />
                    ) : (
                      <Truck className="h-5 w-5" />
                    )}
                    {isCollectionOrder() ? 'Collection Point' : 'Delivery Information'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {order.delivery_address ? (
                      <div className="flex items-start gap-2">
                        {isCollectionOrder() ? (
                          <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                        ) : (
                          <Truck className="h-4 w-4 text-muted-foreground mt-1" />
                        )}
                        <div>
                          <p className="font-medium">
                            {isCollectionOrder() ? 'Collection Address:' : 'Delivery Address:'}
                          </p>
                          <p className="text-sm text-muted-foreground whitespace-pre-line">{order.delivery_address}</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No address provided</p>
                    )}
                    
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">
                          {isCollectionOrder() ? 'Collection Date:' : 'Delivery Date:'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {order.requested_delivery_date 
                            ? format(new Date(order.requested_delivery_date), 'PPP')
                            : 'Not scheduled'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2 p-4 bg-muted/30 rounded-lg border">
              <div className="flex flex-wrap gap-2">
                {/* Primary Actions */}
                <Button 
                  onClick={handleAdjustOrder}
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Edit3 className="h-4 w-4" />
                  Adjust Order
                </Button>
                <Button 
                  onClick={handleVoidOrder}
                  variant="destructive"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <X className="h-4 w-4" />
                  Void Order
                </Button>
                <Button 
                  onClick={handleRefundOrder}
                  variant="secondary"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  Process Refund
                </Button>
              </div>
              
              <div className="hidden sm:block w-px bg-border mx-2 self-stretch"></div>
              
              <div className="flex flex-wrap gap-2">
                {/* Secondary Actions */}
                <Button 
                  onClick={handlePrintLabels}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Printer className="h-4 w-4" />
                  Print Labels
                </Button>
                <Button 
                  onClick={handleReOrder}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <RotateCw className="h-4 w-4" />
                  Re-Order
                </Button>
              </div>
            </div>

            {/* Items Ordered */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {isPackageOrder ? <Package className="h-5 w-5" /> : <ChefHat className="h-5 w-5" />}
                  {isPackageOrder ? 'Package Contents' : 'Items Ordered'}
                </CardTitle>
                <CardDescription>
                  {isPackageOrder 
                    ? `${order.packages?.name} - ${getTotalMealsCount()} meals`
                    : `${getTotalMealsCount()} meals`
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {isPackageOrder ? (
                    <>
                      {order.packages && (
                        <div className="p-4 bg-muted/50 rounded-lg mb-4">
                          <h4 className="font-medium">{order.packages.name}</h4>
                          <p className="text-sm text-muted-foreground">{order.packages.description}</p>
                          <p className="text-sm text-muted-foreground">
                            Includes {order.packages.meal_count} meals
                          </p>
                        </div>
                      )}
                      {order.package_meal_selections?.map((selection) => (
                        <div key={selection.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                          <div className="flex-1">
                            <span className="font-medium">{selection.meals?.name || 'Unknown Meal'}</span>
                            <span className="text-muted-foreground ml-2">
                              × {selection.quantity} @ {selection.meals?.price ? formatCurrency(selection.meals.price) : 'N/A'} each
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="font-medium">
                              {selection.meals?.price ? formatCurrency(selection.meals.price * selection.quantity) : 'N/A'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </>
                  ) : (
                    order.order_items?.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <div className="flex-1">
                          <span className="font-medium">{item.meal_name}</span>
                          <span className="text-muted-foreground ml-2">
                            × {item.quantity} @ {formatCurrency(item.unit_price)} each
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-medium">{formatCurrency(item.total_price)}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

          </div>

          {/* Order Details Sidebar */}
          <div className="space-y-6">
            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {(() => {
                  const subtotal = calculateSubtotal();
                  const discountAmount = subtotal - order.total_amount;
                  const hasDiscount = discountAmount > 0;
                  
                  return (
                    <>
                      {/* Subtotal with item count */}
                      <div className="flex justify-between text-sm">
                        <span>Subtotal ({getTotalMealsCount()} items)</span>
                        <span>{formatCurrency(subtotal)}</span>
                      </div>
                      
                      {/* Discount line with coupon details */}
                      {hasDiscount && (
                        <div className="flex justify-between text-sm text-green-600">
                          <span className="flex items-center gap-2">
                            <Tag className="h-3 w-3" />
                            Discount
                            {order.coupon_type && (
                              <span className="text-xs">
                                ({order.coupon_type}
                                {order.coupon_discount_percentage && ` - ${order.coupon_discount_percentage}% off`})
                              </span>
                            )}
                          </span>
                          <span>-{formatCurrency(discountAmount)}</span>
                        </div>
                      )}
                      
                      {/* Free delivery indicator */}
                      {order.coupon_free_delivery && (
                        <div className="flex justify-between text-sm text-green-600">
                          <span className="flex items-center gap-2">
                            <Truck className="h-3 w-3" />
                            Free Delivery
                          </span>
                          <span>FREE</span>
                        </div>
                      )}
                      
                      <Separator />
                      
                      {/* Total Paid */}
                      <div className="flex justify-between font-semibold text-lg">
                        <span>Total Paid</span>
                        <span>{formatCurrency(order.total_amount)}</span>
                      </div>
                      
                      {/* Savings Banner */}
                      {hasDiscount && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                          <span className="text-green-700 font-medium text-sm">
                            ✨ Customer saved {formatCurrency(discountAmount)} on this order!
                          </span>
                        </div>
                      )}
                      
                      <div className="text-xs text-muted-foreground">
                        Currency: {order.currency?.toUpperCase() || 'GBP'}
                      </div>
                    </>
                  );
                })()}
              </CardContent>
            </Card>

            {/* Refund/Void Information */}
            {(order.refund_amount || order.voided_at) && (
              <Card className="border-amber-200 bg-amber-50/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-amber-800">
                    <AlertTriangle className="h-5 w-5" />
                    {order.voided_at ? 'Order Voided' : 'Refund Issued'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {order.refund_amount && order.refund_amount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-amber-800">Refund Amount:</span>
                      <span className="font-medium text-amber-800">{formatCurrency(order.refund_amount)}</span>
                    </div>
                  )}
                  {order.refund_reason && (
                    <div>
                      <p className="text-sm font-medium text-amber-800">Reason:</p>
                      <p className="text-sm text-amber-700">{order.refund_reason}</p>
                    </div>
                  )}
                  {order.voided_at && (
                    <div className="text-xs text-amber-600">
                      Voided on {format(new Date(order.voided_at), 'PPP')}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Order Notes Section - Admin Editable */}
            <OrderNotesSection
              orderId={order.id}
              orderType={isPackageOrder ? 'package_orders' : 'orders'}
              customerNote={order.order_notes}
              privateNote={order.private_note}
              onNotesUpdated={fetchOrderDetails}
            />

            {/* Order Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Order Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Ordered:</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(order.created_at), 'PPP')} at{' '}
                      {format(new Date(order.created_at), 'p')}
                    </p>
                  </div>
                </div>
                {order.updated_at !== order.created_at && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Last Updated:</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(order.updated_at), 'PPP')} at{' '}
                        {format(new Date(order.updated_at), 'p')}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payment Information */}
            {order.stripe_payment_intent_id && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Payment Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Payment ID:</span>
                    </div>
                    <p className="text-xs text-muted-foreground font-mono">
                      {order.stripe_payment_intent_id}
                    </p>
                    <Badge variant="outline" className="w-fit">
                      Stripe Payment
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Modals */}
        {order && (
          <>
            <AdjustOrderModal 
              isOpen={adjustModalOpen}
              onClose={() => setAdjustModalOpen(false)}
              order={{
                ...order,
                type: isPackageOrder ? 'package' : 'individual'
              }}
              onOrderUpdated={handleOrderUpdated}
            />
            
            <VoidOrderDialog 
              isOpen={voidDialogOpen}
              onClose={() => setVoidDialogOpen(false)}
              order={{
                ...order,
                type: isPackageOrder ? 'package' : 'individual'
              }}
              onOrderVoided={handleOrderUpdated}
            />
            
            <RefundOrderDialog 
              isOpen={refundDialogOpen}
              onClose={() => setRefundDialogOpen(false)}
              order={{
                ...order,
                type: isPackageOrder ? 'package' : 'individual'
              }}
              onOrderRefunded={handleOrderUpdated}
            />
            
            <PrintMealLabelsDialog 
              isOpen={printLabelsDialogOpen}
              onClose={() => setPrintLabelsDialogOpen(false)}
              order={{
                ...order,
                order_type: isPackageOrder ? 'package' : 'individual'
              }}
            />

            <ReorderConfirmationModal
              open={adminReorder.showReorderModal}
              onOpenChange={adminReorder.closeModal}
              order={adminReorder.selectedOrder}
              orderType={adminReorder.selectedOrderType}
              onReorderAsIs={adminReorder.handleReorderAsIs}
              onEditInCart={adminReorder.handleEditInCart}
            />
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default OrderDetails;