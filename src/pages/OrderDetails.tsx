import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '@/components/Layout';
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
  RotateCw
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { AdjustOrderModal } from '@/components/admin/orders/AdjustOrderModal';
import { VoidOrderDialog } from '@/components/admin/orders/VoidOrderDialog';
import { RefundOrderDialog } from '@/components/admin/orders/RefundOrderDialog';
import { PrintMealLabelsDialog } from '@/components/admin/orders/PrintMealLabelsDialog';

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
  stripe_session_id?: string;
  referral_code_used?: string;
  requested_delivery_date?: string;
  production_date?: string;
  created_at: string;
  updated_at: string;
  order_items?: OrderItem[];
  package_id?: string;
  package_meal_selections?: PackageMealSelection[];
  packages?: {
    name: string;
    description: string;
    meal_count: number;
  };
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
    toast({
      title: "Re-Order",
      description: "Re-order functionality will be implemented soon.",
    });
  };

  const handleOrderUpdated = () => {
    fetchOrderDetails(); // Refresh order data
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!order) {
    return (
      <Layout>
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
      </Layout>
    );
  }

  return (
    <Layout>
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

              {/* Delivery Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Delivery Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {order.delivery_address ? (
                      <div className="flex items-start gap-2">
                        <Truck className="h-4 w-4 text-muted-foreground mt-1" />
                        <div>
                          <p className="font-medium">Delivery Address:</p>
                          <p className="text-sm text-muted-foreground whitespace-pre-line">{order.delivery_address}</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No delivery address provided</p>
                    )}
                    
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Delivery Date:</p>
                        <p className="text-sm text-muted-foreground">
                          {order.requested_delivery_date 
                            ? format(new Date(order.requested_delivery_date), 'PPP')
                            : 'Not scheduled'
                          }
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Production Date:</p>
                        <p className="text-sm text-muted-foreground">
                          {order.production_date 
                            ? format(new Date(order.production_date), 'PPP')
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
                      {order.package_meal_selections?.map((selection, index) => (
                        <div key={selection.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex-1">
                            <h4 className="font-medium">{selection.meals?.name || 'Unknown Meal'}</h4>
                            <p className="text-sm text-muted-foreground">Quantity: {selection.quantity}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">
                              {selection.meals?.price ? formatCurrency(selection.meals.price * selection.quantity) : 'N/A'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </>
                  ) : (
                    order.order_items?.map((item, index) => (
                      <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium">{item.meal_name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {formatCurrency(item.unit_price)} × {item.quantity}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatCurrency(item.total_price)}</p>
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
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatCurrency((order.total_amount || 0) + (order.discount_amount || 0))}</span>
                </div>
                {order.discount_amount && order.discount_amount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount:</span>
                    <span>-{formatCurrency(order.discount_amount)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-medium text-lg">
                  <span>Total:</span>
                  <span>{formatCurrency(order.total_amount)}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  Currency: {order.currency?.toUpperCase() || 'GBP'}
                </div>
              </CardContent>
            </Card>

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
            {order.stripe_session_id && (
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
                      {order.stripe_session_id}
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
          </>
        )}
      </div>
    </Layout>
  );
};

export default OrderDetails;