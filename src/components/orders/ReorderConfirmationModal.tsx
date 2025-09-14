import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Calendar, Tag, Truck, ShoppingCart, Edit3 } from "lucide-react";

interface OrderItem {
  id: string;
  meal_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  meals?: {
    id: string;
    name: string;
    is_active: boolean;
    image_url?: string;
  };
}

interface PackageOrderItem {
  quantity: number;
  meals: {
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
  coupon_type?: string;
  coupon_discount_percentage?: number;
  coupon_discount_amount?: number;
  coupon_free_delivery?: boolean;
  coupon_free_item_id?: string;
  order_items?: OrderItem[];
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
  packages?: {
    id: string;
    name: string;
    meal_count: number;
    image_url?: string;
  };
  package_meal_selections?: PackageOrderItem[];
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order | PackageOrder | null;
  orderType: 'regular' | 'package';
  onReorderAsIs: () => void;
  onEditInCart: () => void;
}

const ReorderConfirmationModal = ({ 
  open, 
  onOpenChange, 
  order, 
  orderType, 
  onReorderAsIs, 
  onEditInCart 
}: Props) => {
  if (!order) return null;

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

  const getOrderItems = () => {
    if (orderType === 'package') {
      const packageOrder = order as PackageOrder;
      return packageOrder.package_meal_selections?.map(selection => ({
        id: selection.meals.id,
        name: selection.meals.name,
        quantity: selection.quantity,
        isActive: selection.meals.is_active,
      })) || [];
    } else {
      const regularOrder = order as Order;
      return regularOrder.order_items?.map(item => ({
        id: item.meals?.id || item.id,
        name: item.meal_name,
        quantity: item.quantity,
        price: item.unit_price as number,
        isActive: item.meals?.is_active ?? true,
      })) || [];
    }
  };

  const orderItems = getOrderItems();
  const unavailableItems = orderItems.filter(item => !item.isActive);
  const hasUnavailableItems = unavailableItems.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[96vw] max-w-[96vw] sm:max-w-2xl md:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="mb-6">
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Package className="h-6 w-6" />
            Reorder Confirmation
          </DialogTitle>
          <p className="text-muted-foreground">
            Review your order details before reordering
          </p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">Order ID:</span>
                <span className="text-muted-foreground">#{order.id.slice(-8)}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="font-medium">Total Amount:</span>
                <span className="font-semibold">{formatCurrency(order.total_amount, order.currency)}</span>
              </div>

              {order.requested_delivery_date && (
                <div className="flex items-center justify-between">
                  <span className="font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Delivery Date:
                  </span>
                  <span className="text-muted-foreground">{formatDate(order.requested_delivery_date)}</span>
                </div>
              )}

              {order.delivery_address && (
                <div className="flex items-center justify-between">
                  <span className="font-medium flex items-center gap-2">
                    <Truck className="h-4 w-4" />
                    Delivery Address:
                  </span>
                  <span className="text-muted-foreground text-right max-w-xs">{order.delivery_address}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {orderType === 'package' ? 'Package Contents' : 'Order Items'} 
                ({orderItems.length} {orderItems.length === 1 ? 'item' : 'items'})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {orderType === 'package' && (order as PackageOrder).packages && (
                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div>
                      <span className="font-medium">{(order as PackageOrder).packages!.name}</span>
                      <span className="text-muted-foreground ml-2">
                        ({(order as PackageOrder).packages!.meal_count} meals)
                      </span>
                    </div>
                    <span className="font-medium">
                      {formatCurrency(order.total_amount, order.currency)}
                    </span>
                  </div>
                )}

                {orderItems.map((item, index) => (
                  <div
                    key={index}
                    className={`flex justify-between items-center py-2 px-3 rounded-lg ${
                      item.isActive ? 'bg-muted/20' : 'bg-red-50 border border-red-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={item.isActive ? '' : 'text-red-600'}>{item.name}</span>
                      {!item.isActive && (
                        <Badge variant="destructive" className="text-xs">Unavailable</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">× {item.quantity}</span>
                      {orderType === 'regular' && 'price' in item && typeof item.price === 'number' && (
                        <span className="font-medium">
                          {formatCurrency(item.price * item.quantity, order.currency)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Coupon Information */}
          {(order as Order).coupon_type && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Tag className="h-5 w-5" />
                  Coupon Applied
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div>
                    <span className="font-medium text-green-800">
                      {(order as Order).coupon_type}
                    </span>
                    <div className="text-sm text-green-600">
                      {(order as Order).coupon_discount_percentage && (
                        <span>{(order as Order).coupon_discount_percentage}% off</span>
                      )}
                      {(order as Order).coupon_discount_amount && (
                        <span>{formatCurrency((order as Order).coupon_discount_amount!, order.currency)} off</span>
                      )}
                      {(order as Order).coupon_free_delivery && (
                        <span>Free delivery</span>
                      )}
                      {(order as Order).coupon_free_item_id && (
                        <span>Free item included</span>
                      )}
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-800 border-green-300">
                    Applied
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Warning for unavailable items */}
          {hasUnavailableItems && (
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="pt-6">
                <div className="text-orange-800">
                  <p className="font-medium mb-2">⚠️ Some items are no longer available</p>
                  <p className="text-sm">
                    {unavailableItems.length} item{unavailableItems.length > 1 ? 's are' : ' is'} no longer available. 
                    {orderType === 'package' 
                      ? ' You will be prompted to select replacement meals.'
                      : ' These items will be skipped during reorder.'
                    }
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              onClick={onReorderAsIs}
              className="flex-1 flex items-center gap-2 h-12"
              size="lg"
            >
              <ShoppingCart className="h-5 w-5" />
              Reorder & Checkout
            </Button>
            <Button
              onClick={onEditInCart}
              variant="outline"
              className="flex-1 flex items-center gap-2 h-12"
              size="lg"
            >
              <Edit3 className="h-5 w-5" />
              Edit in Cart
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReorderConfirmationModal;