import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Calendar, Package, Truck, RotateCcw, ChevronRight, MapPin, Tag, MessageSquare } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import MealReplacementDialog from "@/components/packages/MealReplacementDialog";
import ReorderConfirmationModal from "@/components/orders/ReorderConfirmationModal";

interface OrderItem {
  id: string;
  meal_id: string;
  meal_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  meals?: {
    id: string;
    name: string;
    is_active: boolean;
  };
}

interface Order {
  id: string;
  total_amount: number;
  currency: string;
  status: string;
  customer_email?: string;
  customer_name?: string;
  delivery_address?: string;
  created_at: string;
  requested_delivery_date?: string;
  order_notes?: string;
  coupon_type?: string;
  coupon_discount_percentage?: number;
  coupon_discount_amount?: number;
  coupon_free_delivery?: boolean;
  coupon_free_item_id?: string;
  order_items: OrderItem[];
}

interface PackageOrderItem {
  quantity: number;
  meals: {
    id: string;
    name: string;
    is_active: boolean;
  };
}

interface PackageOrder {
  id: string;
  total_amount: number;
  currency: string;
  status: string;
  customer_email?: string;
  customer_name?: string;
  delivery_address?: string;
  created_at: string;
  requested_delivery_date?: string;
  order_notes?: string;
  packages?: {
    id: string;
    name: string;
    meal_count: number;
    image_url?: string;
  };
  package_meal_selections: PackageOrderItem[];
}

// Helper function to determine if address is a collection point
const isCollectionPoint = (address?: string): boolean => {
  if (!address) return false;
  const collectionKeywords = ['fit food tasty', 'collection point', 'pickup', 'collect from'];
  return collectionKeywords.some(keyword => address.toLowerCase().includes(keyword));
};

// Helper function to calculate original subtotal from items
const calculateOriginalSubtotal = (order: Order): number => {
  return order.order_items.reduce((sum, item) => sum + item.total_price, 0);
};

const Orders = () => {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [packageOrders, setPackageOrders] = useState<PackageOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | PackageOrder | null>(null);
  const [selectedOrderType, setSelectedOrderType] = useState<'regular' | 'package'>('regular');
  const [showReorderModal, setShowReorderModal] = useState(false);

  const [showReplacementDialog, setShowReplacementDialog] = useState(false);
  const { startReorder } = useCart();

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    if (!user) return;

    try {
      // Fetch regular orders
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select(`
          id,
          total_amount,
          currency,
          status,
          customer_email,
          customer_name,
          delivery_address,
          created_at,
          requested_delivery_date,
          order_notes,
          coupon_type,
          coupon_discount_percentage,
          coupon_discount_amount,
          coupon_free_delivery,
          coupon_free_item_id,
          order_items (
            id,
            meal_id,
            meal_name,
            quantity,
            unit_price,
            total_price,
            meals (
              id,
              name,
              is_active
            )
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (ordersError) {
        console.error("Error fetching orders:", ordersError);
        toast({
          title: "Error",
          description: "Failed to load orders",
          variant: "destructive",
        });
      } else {
        setOrders(ordersData || []);
      }

      // Fetch package orders (without coupon fields since they don't exist)
      const { data: packageOrdersData, error: packageOrdersError } = await supabase
        .from("package_orders")
        .select(`
          id,
          total_amount,
          currency,
          status,
          customer_email,
          customer_name,
          delivery_address,
          created_at,
          requested_delivery_date,
          order_notes,
          packages (
            id,
            name,
            meal_count,
            image_url
          ),
          package_meal_selections (
            quantity,
            meals (
              id,
              name,
              is_active
            )
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (packageOrdersError) {
        console.error("Error fetching package orders:", packageOrdersError);
        toast({
          title: "Error",
          description: "Failed to load package orders",
          variant: "destructive",
        });
      } else {
        setPackageOrders(packageOrdersData || []);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast({
        title: "Error",
        description: "Failed to load orders",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number, currency: string = "gbp") => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatShortDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "processing":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "shipped":
        return "bg-purple-100 text-purple-800 border-purple-300";
      case "delivered":
        return "bg-green-100 text-green-800 border-green-300";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const handleReorder = async (packageOrderId: string) => {
    // Find the package order and show confirmation modal
    const packageOrder = packageOrders.find(order => order.id === packageOrderId);
    if (packageOrder) {
      setSelectedOrder(packageOrder);
      setSelectedOrderType('package');
      setShowReorderModal(true);
    }
  };

  const handlePackageReorderAsIs = async () => {
    const packageOrder = selectedOrder as PackageOrder;
    if (!packageOrder || !startReorder) {
      toast({
        title: "Error",
        description: "Unable to process reorder.",
        variant: "destructive",
      });
      return;
    }

    setShowReorderModal(false);
    
    const result = await startReorder(packageOrder.id, 'package');
    
    if (result.success) {
      if (result.needsReplacements) {
        // Show replacement dialog
        setShowReplacementDialog(true);
      } else {
        // All meals available, go to cart and scroll to checkout
        toast({
          title: "Added to Cart!",
          description: "Your package has been added to cart. Proceeding to checkout.",
          variant: "success" as any,
        });
        navigate("/cart");
      }
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to process reorder.",
        variant: "destructive",
      });
    }
  };

  const handlePackageEditInCart = async () => {
    const packageOrder = selectedOrder as PackageOrder;
    if (!packageOrder || !startReorder) {
      toast({
        title: "Error",
        description: "Unable to process reorder.",
        variant: "destructive",
      });
      return;
    }

    setShowReorderModal(false);
    
    const result = await startReorder(packageOrder.id, 'package');
    
    if (result.success) {
      if (result.needsReplacements) {
        // Show replacement dialog first
        setShowReplacementDialog(true);
      } else {
        // All meals available, go to menu for shopping
        toast({
          title: "Added to Cart!",
          description: "Package added to cart. Continue shopping or go to cart to checkout.",
          variant: "success" as any,
        });
        navigate("/menu");
      }
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to process reorder.",
        variant: "destructive",
      });
    }
  };

  const handleMealOrderReorder = async (orderId: string) => {
    // Find the order and show confirmation modal
    const order = orders.find(o => o.id === orderId);
    if (order) {
      setSelectedOrder(order);
      setSelectedOrderType('regular');
      setShowReorderModal(true);
    }
  };

  const handleMealReorderAsIs = async () => {
    const order = selectedOrder as Order;
    if (!order || !startReorder) {
      toast({
        title: "Error",
        description: "Unable to process reorder.",
        variant: "destructive",
      });
      return;
    }

    setShowReorderModal(false);
    
    const result = await startReorder(order.id, 'regular');
    
    if (result.success) {
      if (result.needsReplacements) {
        // Show replacement dialog
        setShowReplacementDialog(true);
        toast({
          title: "Partial Reorder!",
          description: result.message || "Some meals need replacement.",
          variant: "default",
        });
      } else {
        // All meals available, proceed to checkout
        toast({
          title: "Added to Cart!",
          description: result.message || "All meals added to cart. Proceeding to checkout.",
          variant: "success" as any,
        });
        navigate("/cart");
      }
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to process reorder.",
        variant: "destructive",
      });
    }
  };

  const handleMealEditInCart = async () => {
    const order = selectedOrder as Order;
    if (!order || !startReorder) {
      toast({
        title: "Error",
        description: "Unable to process reorder.",
        variant: "destructive",
      });
      return;
    }

    setShowReorderModal(false);
    
    const result = await startReorder(order.id, 'regular');
    
    if (result.success) {
      if (result.needsReplacements) {
        // Show replacement dialog first
        setShowReplacementDialog(true);
        toast({
          title: "Partial Reorder!",
          description: result.message || "Some meals need replacement.",
          variant: "default",
        });
      } else {
        // All meals available, go to menu for shopping
        toast({
          title: "Added to Cart!",
          description: result.message || "Meals added to cart. Continue shopping.",
          variant: "success" as any,
        });
        navigate("/menu");
      }
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to process reorder.",
        variant: "destructive",
      });
    }
  };

  // Legacy function - now using unified startReorder system
  // This can be removed in future cleanup

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-4">
          <div className="h-8 bg-muted rounded w-48 animate-pulse" />
          <div className="h-4 bg-muted rounded w-96 animate-pulse" />
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-32 bg-muted rounded animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl text-center">
        <h1 className="text-2xl font-bold mb-4">Please log in to view your orders</h1>
        <Button onClick={() => navigate("/auth")}>
          Log In
        </Button>
      </div>
    );
  }

  if (orders.length === 0 && packageOrders.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl text-center">
        <h1 className="text-2xl font-bold mb-4">No orders found</h1>
        <p className="text-muted-foreground mb-6">
          You haven't placed any orders yet. Start exploring our delicious meals!
        </p>
        <Button onClick={() => navigate("/menu")}>
          Browse Menu
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">My Orders</h1>
        <p className="text-muted-foreground">
          Track your order history and delivery status
        </p>
      </div>

      <div className="space-y-6">
        {/* Package Orders */}
        {packageOrders.map((order) => {
          const mealCount = order.packages?.meal_count || order.package_meal_selections?.reduce((sum, sel) => sum + sel.quantity, 0) || 0;
          const isCollection = isCollectionPoint(order.delivery_address);
          
          return (
            <Collapsible key={`package-${order.id}`}>
              <Card className="overflow-hidden">
                <CollapsibleTrigger asChild>
                  <CardHeader className="border-b bg-muted/20 cursor-pointer hover:bg-muted/30 transition-colors group">
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-4 flex-1">
                        <ChevronRight className="h-4 w-4 transition-transform group-data-[state=open]:rotate-90" />
                        <div className="space-y-1 flex-1">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Package className="h-5 w-5" />
                            Order #{order.id.slice(-8)}
                          </CardTitle>
                          <CardDescription className="flex flex-wrap items-center gap-x-4 gap-y-1">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              Ordered {formatShortDate(order.created_at)}
                            </span>
                            {order.requested_delivery_date && (
                              <span className="flex items-center gap-1">
                                {isCollection ? (
                                  <MapPin className="h-4 w-4 text-primary" />
                                ) : (
                                  <Truck className="h-4 w-4 text-primary" />
                                )}
                                {isCollection ? 'Collection' : 'Delivery'}: {formatShortDate(order.requested_delivery_date)}
                              </span>
                            )}
                            <span>{mealCount} meals</span>
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReorder(order.id);
                          }}
                          className="bg-green-500 hover:bg-green-600 text-white transition-all duration-200 hover:scale-105 active:scale-95 shadow-md hover:shadow-lg"
                          size="sm"
                          title="Reorder this order"
                        >
                          <RotateCcw className="h-4 w-4 mr-1" />
                          Reorder
                        </Button>
                        <div className="flex flex-col items-end gap-1">
                          <Badge className={getStatusColor(order.status)}>
                            {order.status.replace("_", " ")}
                          </Badge>
                          <div className="font-semibold text-lg">
                            {formatCurrency(order.total_amount, order.currency)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                
                <CollapsibleContent>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {/* Package Details */}
                      <div>
                        <h4 className="font-medium mb-3 flex items-center gap-2">
                          <Package className="h-4 w-4" />
                          Package Details
                        </h4>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center py-2 px-3 bg-muted/30 rounded-lg">
                            <div>
                              <span className="font-medium">{order.packages?.name}</span>
                              <span className="text-muted-foreground ml-2">
                                ({order.packages?.meal_count} meals)
                              </span>
                            </div>
                            <span className="font-medium">
                              {formatCurrency(order.total_amount, order.currency)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Selected Meals */}
                      {order.package_meal_selections && order.package_meal_selections.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-3">Selected Meals</h4>
                          <div className="space-y-1">
                            {order.package_meal_selections.map((selection, index) => (
                              <div
                                key={index}
                                className="flex justify-between items-center py-1 px-3 bg-muted/20 rounded text-sm"
                              >
                                <span>{selection.meals?.name || 'Unknown meal'}</span>
                                <span className="text-muted-foreground">× {selection.quantity}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Delivery/Collection Information */}
                      {order.delivery_address && (
                        <div className="pt-4 border-t">
                          <h4 className="font-medium mb-2 flex items-center gap-2">
                            {isCollection ? (
                              <>
                                <MapPin className="h-4 w-4" />
                                Collection Point
                              </>
                            ) : (
                              <>
                                <Truck className="h-4 w-4" />
                                Delivery Address
                              </>
                            )}
                          </h4>
                          <p className="text-muted-foreground">{order.delivery_address}</p>
                        </div>
                      )}

                      {/* Customer Information */}
                      {(order.customer_name || order.customer_email) && (
                        <div className="pt-4 border-t">
                          <h4 className="font-medium mb-2">Contact Information</h4>
                          <div className="space-y-1 text-muted-foreground">
                            {order.customer_name && <p>{order.customer_name}</p>}
                            {order.customer_email && <p>{order.customer_email}</p>}
                          </div>
                        </div>
                      )}

                      {/* Order Notes */}
                      {order.order_notes && (
                        <div className="pt-4 border-t">
                          <h4 className="font-medium mb-2 flex items-center gap-2">
                            <MessageSquare className="h-4 w-4" />
                            Your Notes
                          </h4>
                          <p className="text-muted-foreground text-sm whitespace-pre-wrap bg-muted/30 p-3 rounded-lg">
                            {order.order_notes}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          );
        })}

        {/* Regular Meal Orders */}
        {orders.map((order) => {
          const totalItems = order.order_items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
          const originalSubtotal = calculateOriginalSubtotal(order);
          const discountAmount = originalSubtotal - order.total_amount;
          const hasDiscount = discountAmount > 0 && order.coupon_type;
          const isCollection = isCollectionPoint(order.delivery_address);
          
          return (
            <Collapsible key={order.id}>
              <Card className="overflow-hidden">
                <CollapsibleTrigger asChild>
                  <CardHeader className="border-b bg-muted/20 cursor-pointer hover:bg-muted/30 transition-colors group">
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-4 flex-1">
                        <ChevronRight className="h-4 w-4 transition-transform group-data-[state=open]:rotate-90" />
                        <div className="space-y-1 flex-1">
                          <CardTitle className="text-lg">
                            Order #{order.id.slice(-8)}
                          </CardTitle>
                          <CardDescription className="flex flex-wrap items-center gap-x-4 gap-y-1">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              Ordered {formatShortDate(order.created_at)}
                            </span>
                            {order.requested_delivery_date && (
                              <span className="flex items-center gap-1">
                                {isCollection ? (
                                  <MapPin className="h-4 w-4 text-primary" />
                                ) : (
                                  <Truck className="h-4 w-4 text-primary" />
                                )}
                                {isCollection ? 'Collection' : 'Delivery'}: {formatShortDate(order.requested_delivery_date)}
                              </span>
                            )}
                            <span>{totalItems} meals</span>
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMealOrderReorder(order.id);
                          }}
                          className="bg-green-500 hover:bg-green-600 text-white transition-all duration-200 hover:scale-105 active:scale-95 shadow-md hover:shadow-lg"
                          size="sm"
                          title="Reorder this order"
                        >
                          <RotateCcw className="h-4 w-4 mr-1" />
                          Reorder
                        </Button>
                        <div className="flex flex-col items-end gap-1">
                          <Badge className={getStatusColor(order.status)}>
                            {order.status.replace("_", " ")}
                          </Badge>
                          {hasDiscount && (
                            <div className="text-sm text-muted-foreground line-through">
                              {formatCurrency(originalSubtotal, order.currency)}
                            </div>
                          )}
                          <div className="font-semibold text-lg">
                            {formatCurrency(order.total_amount, order.currency)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                
                <CollapsibleContent>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {/* Order Items with Unit Price */}
                      <div>
                        <h4 className="font-medium mb-3 flex items-center gap-2">
                          <Package className="h-4 w-4" />
                          Items ({order.order_items.length})
                        </h4>
                        <div className="space-y-2">
                          {order.order_items.map((item) => (
                            <div
                              key={item.id}
                              className="flex justify-between items-center py-2 px-3 bg-muted/30 rounded-lg"
                            >
                              <div>
                                <span className="font-medium">{item.meal_name}</span>
                                <span className="text-muted-foreground ml-2">
                                  × {item.quantity} @ {formatCurrency(item.unit_price, order.currency)} each
                                </span>
                              </div>
                              <span className="font-medium">
                                {formatCurrency(item.total_price, order.currency)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Order Summary Section */}
                      <div className="pt-4 border-t">
                        <h4 className="font-medium mb-3">Order Summary</h4>
                        <div className="bg-muted/20 rounded-lg p-4 space-y-2">
                          {/* Subtotal */}
                          <div className="flex justify-between text-sm">
                            <span>Subtotal ({totalItems} {totalItems === 1 ? 'item' : 'items'})</span>
                            <span>{formatCurrency(originalSubtotal, order.currency)}</span>
                          </div>
                          
                          {/* Discount Line (if applicable) */}
                          {hasDiscount && (
                            <div className="flex justify-between text-sm text-green-600">
                              <span className="flex items-center gap-2">
                                <Tag className="h-3 w-3" />
                                Discount ({order.coupon_type}
                                {order.coupon_discount_percentage && ` - ${order.coupon_discount_percentage}% off`})
                              </span>
                              <span>-{formatCurrency(discountAmount, order.currency)}</span>
                            </div>
                          )}
                          
                          {/* Total Paid */}
                          <div className="flex justify-between font-semibold text-base pt-2 border-t border-muted">
                            <span>Total Paid</span>
                            <span>{formatCurrency(order.total_amount, order.currency)}</span>
                          </div>
                          
                          {/* Savings Banner */}
                          {discountAmount > 0 && (
                            <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-3 text-center mt-3">
                              <span className="text-green-700 dark:text-green-400 font-medium text-sm">
                                ✨ You saved {formatCurrency(discountAmount, order.currency)} on this order!
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Delivery/Collection Information */}
                      {order.delivery_address && (
                        <div className="pt-4 border-t">
                          <h4 className="font-medium mb-2 flex items-center gap-2">
                            {isCollection ? (
                              <>
                                <MapPin className="h-4 w-4" />
                                Collection Point
                              </>
                            ) : (
                              <>
                                <Truck className="h-4 w-4" />
                                Delivery Address
                              </>
                            )}
                          </h4>
                          <p className="text-muted-foreground">{order.delivery_address}</p>
                        </div>
                      )}

                      {/* Customer Information */}
                      {(order.customer_name || order.customer_email) && (
                        <div className="pt-4 border-t">
                          <h4 className="font-medium mb-2">Contact Information</h4>
                          <div className="space-y-1 text-muted-foreground">
                            {order.customer_name && <p>{order.customer_name}</p>}
                            {order.customer_email && <p>{order.customer_email}</p>}
                          </div>
                        </div>
                      )}

                      {/* Order Notes */}
                      {order.order_notes && (
                        <div className="pt-4 border-t">
                          <h4 className="font-medium mb-2 flex items-center gap-2">
                            <MessageSquare className="h-4 w-4" />
                            Your Notes
                          </h4>
                          <p className="text-muted-foreground text-sm whitespace-pre-wrap bg-muted/30 p-3 rounded-lg">
                            {order.order_notes}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          );
        })}
      </div>

      <div className="mt-8 text-center">
        <Button variant="outline" onClick={() => navigate("/menu")}>
          Order Again
        </Button>
      </div>

      {/* Reorder Confirmation Modal */}
      <ReorderConfirmationModal
        open={showReorderModal}
        onOpenChange={setShowReorderModal}
        order={selectedOrder}
        orderType={selectedOrderType}
        onReorderAsIs={selectedOrderType === 'package' ? handlePackageReorderAsIs : handleMealReorderAsIs}
        onEditInCart={selectedOrderType === 'package' ? handlePackageEditInCart : handleMealEditInCart}
      />

      {/* Meal Replacement Dialog */}
      <MealReplacementDialog
        open={showReplacementDialog}
        onOpenChange={setShowReplacementDialog}
      />
    </div>
  );
};

export default Orders;
