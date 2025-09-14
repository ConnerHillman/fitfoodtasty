import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, Calendar, Clock, CreditCard, RotateCcw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/contexts/CartContext";
import MealReplacementDialog from "@/components/packages/MealReplacementDialog";
import ReorderConfirmationModal from "@/components/orders/ReorderConfirmationModal";

interface OrderItem {
  id: string;
  meal_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface Order {
  id: string;
  total_amount: number;
  currency: string;
  status: string;
  customer_email: string;
  customer_name: string;
  delivery_address: string;
  created_at: string;
  order_items: OrderItem[];
}

interface PackageOrder {
  id: string;
  total_amount: number;
  currency: string;
  status: string;
  customer_email: string;
  customer_name: string;
  delivery_address: string;
  created_at: string;
  packages: {
    id: string;
    name: string;
    meal_count: number;
    image_url?: string;
  };
  package_meal_selections: {
    quantity: number;
    meals: {
      id: string;
      name: string;
    };
  }[];
}

const Orders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [packageOrders, setPackageOrders] = useState<PackageOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReplacementDialog, setShowReplacementDialog] = useState(false);
  const [showReorderModal, setShowReorderModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | PackageOrder | null>(null);
  const [selectedOrderType, setSelectedOrderType] = useState<'regular' | 'package'>('regular');
  const navigate = useNavigate();
  const { toast } = useToast();
  const { startReorder, reorderData, addToCart } = useCart();

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    if (reorderData) {
      setShowReplacementDialog(true);
    }
  }, [reorderData]);

  const fetchOrders = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/auth");
        return;
      }

      // Fetch regular orders
      const { data: ordersData, error } = await supabase
        .from("orders")
        .select(`
          *,
          order_items (
            id,
            meal_name,
            quantity,
            unit_price,
            total_price
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching orders:", error);
        toast({
          title: "Error",
          description: "Failed to load your orders. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // Fetch package orders
      const { data: packageOrdersData, error: packageError } = await supabase
        .from("package_orders")
        .select(`
          *,
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

      if (packageError) {
        console.error("Error fetching package orders:", packageError);
      }

      setOrders(ordersData || []);
      setPackageOrders(packageOrdersData || []);
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "bg-green-100 text-green-800 border-green-200";
      case "out_for_delivery":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "preparing":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "ready":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "confirmed":
        return "bg-cyan-100 text-cyan-800 border-cyan-200";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (amount: number, currency: string = "gbp") => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amount);
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
    
    const result = await startReorder(packageOrder.id);
    
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
        setTimeout(() => {
          window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        }, 100);
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
    
    const result = await startReorder(packageOrder.id);
    
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
    if (!order) return;

    setShowReorderModal(false);
    await executeMealReorder(order.id, false); // Don't redirect to cart, go to checkout
  };

  const handleMealEditInCart = async () => {
    const order = selectedOrder as Order;
    if (!order) return;

    setShowReorderModal(false);
    await executeMealReorder(order.id, true); // Redirect to cart for editing
  };

  const executeMealReorder = async (orderId: string, redirectToCart: boolean = false) => {
    try {
      // Get the original order with its items and coupon info
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .select(`
          id,
          coupon_type,
          coupon_discount_percentage,
          coupon_discount_amount,
          coupon_free_delivery,
          coupon_free_item_id,
          order_items (
            meal_id,
            meal_name,
            quantity,
            unit_price,
            meals (
              id,
              name,
              description,
              category,
              price,
              image_url,
              is_active,
              total_calories,
              total_protein,
              total_carbs,
              total_fat,
              total_fiber,
              shelf_life_days
            )
          )
        `)
        .eq("id", orderId)
        .single();

      if (orderError) throw orderError;

      const orderItems = orderData.order_items || [];
      let unavailableCount = 0;
      let addedCount = 0;

      // Add available meals to cart
      for (const item of orderItems) {
        if (item.meals && item.meals.is_active) {
          const cartItem = {
            id: item.meals.id,
            name: item.meals.name,
            description: item.meals.description || "",
            category: item.meals.category || "uncategorized",
            price: item.meals.price || item.unit_price,
            total_calories: item.meals.total_calories || 0,
            total_protein: item.meals.total_protein || 0,
            total_carbs: item.meals.total_carbs || 0,
            total_fat: item.meals.total_fat || 0,
            total_fiber: item.meals.total_fiber || 0,
            shelf_life_days: item.meals.shelf_life_days || 5,
            image_url: item.meals.image_url,
          };

          // Add each quantity individually
          for (let i = 0; i < item.quantity; i++) {
            addToCart(cartItem);
          }
          addedCount += item.quantity;
        } else {
          unavailableCount++;
        }
      }

      // Check and reapply coupon if it was used in the original order
      let couponMessage = "";
      if (orderData.coupon_type) {
        const { data: couponData, error: couponError } = await supabase
          .from("coupons")
          .select("code, active, expires_at")
          .eq("code", orderData.coupon_type)
          .single();

        if (!couponError && couponData) {
          const now = new Date();
          const expiresAt = couponData.expires_at ? new Date(couponData.expires_at) : null;
          
          if (couponData.active && (!expiresAt || expiresAt > now)) {
            couponMessage = ` Original coupon "${orderData.coupon_type}" is still active and can be reapplied at checkout.`;
          } else {
            couponMessage = ` Note: Original coupon "${orderData.coupon_type}" has expired and cannot be reapplied.`;
          }
        }
      }

      // Show success message
      let description = `${addedCount} meal${addedCount > 1 ? 's' : ''} added to cart.`;
      if (unavailableCount > 0) {
        description += ` ${unavailableCount} meal${unavailableCount > 1 ? 's are' : ' is'} no longer available.`;
      }
      description += couponMessage;

      toast({
        title: "Reorder Complete!",
        description,
        variant: "success" as any,
      });

      // Navigate based on action type
      if (redirectToCart) {
        // For "add to cart", go to menu to continue shopping
        navigate("/menu");
      } else {
        // For "reorder as is", stay on cart but scroll to checkout
        navigate("/cart");
        setTimeout(() => {
          window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        }, 100);
      }

    } catch (error) {
      console.error("Error reordering meals:", error);
      toast({
        title: "Error",
        description: "Failed to reorder meals. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <Package className="h-12 w-12 text-muted-foreground mx-auto animate-pulse" />
          <p className="text-muted-foreground">Loading your orders...</p>
        </div>
      </div>
    );
  }

  if (orders.length === 0 && packageOrders.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-6">
          <Package className="h-24 w-24 text-muted-foreground mx-auto" />
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold">No orders yet</h2>
            <p className="text-muted-foreground max-w-md">
              You haven't placed any orders yet. Browse our delicious meals to get started!
            </p>
          </div>
          <Button onClick={() => navigate("/menu")} size="lg">
            Browse Menu
          </Button>
        </div>
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
        {packageOrders.map((order) => (
          <Card key={`package-${order.id}`} className="overflow-hidden">
            <CardHeader className="border-b bg-muted/20">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-1">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    {order.packages?.name || 'Package'} #{order.id.slice(-8)}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {formatDate(order.created_at)}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className={getStatusColor(order.status)}>
                    {order.status.replace("_", " ")}
                  </Badge>
                  <div className="text-right">
                    <div className="font-semibold">
                      {formatCurrency(order.total_amount, order.currency)}
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            
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

                {/* Delivery Information */}
                {order.delivery_address && (
                  <div className="pt-4 border-t">
                    <h4 className="font-medium mb-2">Delivery Address</h4>
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

                {/* Reorder Button */}
                <div className="pt-4 border-t">
                  <Button 
                    onClick={() => handleReorder(order.id)}
                    className="flex items-center gap-2"
                    size="sm"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Reorder Package
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Regular Meal Orders */}
        {orders.map((order) => (
          <Card key={order.id} className="overflow-hidden">
            <CardHeader className="border-b bg-muted/20">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-1">
                  <CardTitle className="text-lg">
                    Order #{order.id.slice(-8)}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {formatDate(order.created_at)}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className={getStatusColor(order.status)}>
                    {order.status.replace("_", " ")}
                  </Badge>
                  <div className="text-right">
                    <div className="font-semibold">
                      {formatCurrency(order.total_amount, order.currency)}
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-6">
              <div className="space-y-4">
                {/* Order Items */}
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
                            × {item.quantity}
                          </span>
                        </div>
                        <span className="font-medium">
                          {formatCurrency(item.total_price, order.currency)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Delivery Information */}
                {order.delivery_address && (
                  <div className="pt-4 border-t">
                    <h4 className="font-medium mb-2">Delivery Address</h4>
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

                {/* Reorder Button for Regular Orders */}
                <div className="pt-4 border-t">
                  <Button 
                    onClick={() => handleMealOrderReorder(order.id)}
                    className="flex items-center gap-2"
                    size="sm"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Reorder Meals
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
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