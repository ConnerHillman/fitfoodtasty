import { useState } from "react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft, Calendar, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Cart = () => {
  const { items, updateQuantity, removeFromCart, getTotalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();
  const [requestedDeliveryDate, setRequestedDeliveryDate] = useState("");

  // Calculate minimum delivery date (tomorrow)
  const getMinDeliveryDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  // Calculate production date based on delivery date and shortest shelf life
  const calculateProductionDate = (deliveryDate: string) => {
    if (!deliveryDate || items.length === 0) return null;
    
    // Find the shortest shelf life among all meals in cart
    const shortestShelfLife = Math.min(...items.map(item => item.shelf_life_days || 5));
    
    const delivery = new Date(deliveryDate);
    const production = new Date(delivery);
    production.setDate(production.getDate() - shortestShelfLife);
    
    return production.toISOString().split('T')[0];
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'breakfast': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'lunch': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'dinner': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <ShoppingBag className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Your cart is empty</h2>
          <p className="text-muted-foreground mb-6">
            Start adding some delicious meals to your cart!
          </p>
          <Button asChild>
            <Link to="/menu">Browse Menu</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Continue Shopping Button */}
      <div className="mb-6">
        <Button asChild size="lg" className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold px-6 py-3 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200">
          <Link to="/menu" className="flex items-center space-x-2">
            <ArrowLeft className="h-5 w-5" />
            <span>CONTINUE SHOPPING</span>
          </Link>
        </Button>
      </div>
      
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-2">Your Cart</h1>
        <p className="text-muted-foreground text-lg">
          Review your selected meals before checkout
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  {item.image_url && (
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                  )}
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-lg">{item.name}</h3>
                        <p className="text-muted-foreground text-sm mb-2">
                          {item.description}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFromCart(item.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="text-lg font-semibold">
                        £{(item.price * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Order Summary */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>£{getTotalPrice().toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery</span>
                <span>£2.99</span>
              </div>
              <div className="border-t pt-4">
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>£{(getTotalPrice() + 2.99).toFixed(2)}</span>
                </div>
              </div>
              
              {/* Account Creation CTA - Only show for non-authenticated users */}
              {!user && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-green-800 mb-1">Save 20% on your first order!</h4>
                      <p className="text-sm text-green-700">Create a free account to unlock exclusive savings</p>
                    </div>
                    <Button 
                      asChild
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white font-bold px-4 py-2 rounded-full"
                    >
                      <Link to="/auth">Create Account</Link>
                    </Button>
                  </div>
                </div>
              )}
              
              {/* Delivery Date Selection */}
              <div className="space-y-3 border-t pt-4">
                <Label htmlFor="delivery-date" className="flex items-center gap-2 font-semibold">
                  <Calendar className="h-4 w-4" />
                  Requested Delivery Date
                </Label>
                <Input
                  id="delivery-date"
                  type="date"
                  min={getMinDeliveryDate()}
                  value={requestedDeliveryDate}
                  onChange={(e) => setRequestedDeliveryDate(e.target.value)}
                  className="w-full"
                />
                {requestedDeliveryDate && (
                  <div className="bg-muted rounded-lg p-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <Clock className="h-3 w-3" />
                      Production Schedule
                    </div>
                    <p className="text-sm">
                      <strong>Production Date:</strong> {calculateProductionDate(requestedDeliveryDate)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Based on shortest shelf life in your cart
                    </p>
                  </div>
                )}
              </div>

              <Button
                className="w-full"
                size="lg"
                disabled={!requestedDeliveryDate}
                onClick={async () => {
                  if (!requestedDeliveryDate) {
                    toast({ 
                      title: 'Delivery date required', 
                      description: 'Please select your preferred delivery date',
                      variant: 'destructive' 
                    });
                    return;
                  }

                  try {
                    const { data, error } = await supabase.functions.invoke('create-payment', {
                      body: {
                        currency: 'gbp',
                        items: items.map(i => ({
                          name: i.name,
                          amount: Math.round(i.price * 100),
                          quantity: i.quantity,
                          description: i.description,
                          meal_id: i.id,
                        })),
                        delivery_fee: 299,
                        requested_delivery_date: requestedDeliveryDate,
                        production_date: calculateProductionDate(requestedDeliveryDate),
                        successPath: '/payment-success',
                        cancelPath: '/cart'
                      }
                    });
                    if (error) throw error;
                    if (data?.url) {
                      window.open(data.url, '_blank');
                    } else {
                      throw new Error('No checkout URL returned');
                    }
                  } catch (err: any) {
                    console.error(err);
                    toast({ title: 'Checkout error', description: err.message || 'Unable to start checkout', variant: 'destructive' });
                  }
                }}
              >
                {requestedDeliveryDate ? 'Proceed to Checkout' : 'Select Delivery Date to Continue'}
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={clearCart}
              >
                Clear Cart
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Cart;