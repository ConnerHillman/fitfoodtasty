import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Package, ChefHat, Truck, Snowflake, Mail, ArrowRight, Home, ShoppingBag } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useCart } from "@/contexts/CartContext";

interface OrderData {
  orderId: string;
  orderNumber: string;
  totalAmount: number;
  currency: string;
  requestedDeliveryDate: string | null;
  deliveryAddress: string | null;
  customerEmail: string;
  customerName: string;
  orderType: 'package' | 'individual';
  itemCount: number;
}

interface LocationState {
  orderData?: OrderData;
  deliveryMethod?: string;
  requestedDeliveryDate?: string;
}

const PaymentSuccess = () => {
  const { clearCart } = useCart();
  const location = useLocation();
  const state = location.state as LocationState | null;
  
  const orderData = state?.orderData;
  const deliveryMethod = state?.deliveryMethod || 'delivery';

  useEffect(() => {
    // Clear the cart locally after a successful payment redirect
    clearCart();
  }, [clearCart]);

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'To be confirmed';
    return new Date(dateString + 'T12:00:00').toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return `£${amount.toFixed(2)}`;
  };

  const timelineSteps = [
    {
      icon: Package,
      title: "Order Received",
      description: "We've received your order and payment",
      status: "complete"
    },
    {
      icon: ChefHat,
      title: "Freshly Prepared",
      description: "Our chefs will prepare your meals fresh",
      status: "upcoming"
    },
    {
      icon: Truck,
      title: deliveryMethod === 'pickup' ? "Ready for Collection" : "Out for Delivery",
      description: deliveryMethod === 'pickup' 
        ? "We'll notify you when your order is ready" 
        : "Your meals will be delivered to your door",
      status: "upcoming"
    },
    {
      icon: Snowflake,
      title: "Store & Enjoy",
      description: "Refrigerate and enjoy within 5 days",
      status: "upcoming"
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      {/* Success Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-4">
          <CheckCircle2 className="h-12 w-12 text-primary" />
        </div>
        <h1 className="text-3xl font-bold mb-2">Payment Successful!</h1>
        <p className="text-muted-foreground">Thank you for your order. We're excited to prepare your meals!</p>
      </div>

      {/* Order Summary Card */}
      {orderData && (
        <Card className="mb-6">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Order Number</span>
                <span className="font-mono font-semibold text-primary">#{orderData.orderNumber}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Items</span>
                <span>{orderData.itemCount} {orderData.itemCount === 1 ? 'meal' : 'meals'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">
                  {deliveryMethod === 'pickup' ? 'Collection Date' : 'Delivery Date'}
                </span>
                <span className="font-medium">{formatDate(orderData.requestedDeliveryDate)}</span>
              </div>
              {orderData.deliveryAddress && deliveryMethod !== 'pickup' && (
                <div className="flex justify-between items-start">
                  <span className="text-muted-foreground">Delivery Address</span>
                  <span className="text-right max-w-[200px]">{orderData.deliveryAddress}</span>
                </div>
              )}
              <div className="border-t pt-3 mt-3">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Total Paid</span>
                  <span className="text-xl font-bold text-primary">{formatCurrency(orderData.totalAmount)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Email Confirmation Banner */}
      {orderData?.customerEmail && (
        <Card className="mb-6 bg-primary/5 border-primary/20">
          <CardContent className="p-4 flex items-center gap-3">
            <Mail className="h-5 w-5 text-primary flex-shrink-0" />
            <div>
              <p className="font-medium text-sm">Confirmation email sent</p>
              <p className="text-sm text-muted-foreground">{orderData.customerEmail}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* What Happens Next Timeline */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold mb-6">What Happens Next?</h2>
          <div className="space-y-6">
            {timelineSteps.map((step, index) => (
              <div key={index} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    step.status === 'complete' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    <step.icon className="h-5 w-5" />
                  </div>
                  {index < timelineSteps.length - 1 && (
                    <div className="w-0.5 h-full min-h-[24px] bg-border mt-2" />
                  )}
                </div>
                <div className="flex-1 pb-2">
                  <h3 className="font-medium">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="space-y-3">
        {orderData && (
          <Button asChild className="w-full" size="lg">
            <Link to="/orders">
              View Order Details
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        )}
        <div className="flex gap-3">
          <Button asChild variant="outline" className="flex-1" size="lg">
            <Link to="/menu">
              <ShoppingBag className="mr-2 h-4 w-4" />
              Order More
            </Link>
          </Button>
          <Button asChild variant="outline" className="flex-1" size="lg">
            <Link to="/">
              <Home className="mr-2 h-4 w-4" />
              Go Home
            </Link>
          </Button>
        </div>
      </div>

      {/* Fallback for direct URL access */}
      {!orderData && (
        <Card className="mt-6 bg-muted/50">
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">
              Looking for your order details? Visit your{' '}
              <Link to="/orders" className="text-primary hover:underline font-medium">
                order history
              </Link>
              {' '}to view all your orders.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PaymentSuccess;
