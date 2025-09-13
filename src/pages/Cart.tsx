import { useState, useEffect } from "react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft, CalendarIcon, Clock, Truck, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Elements } from "@stripe/react-stripe-js";
import { stripePromise } from "@/lib/stripe";
import PaymentForm from "@/components/PaymentForm";

const Cart = () => {
  const { items, updateQuantity, removeFromCart, getTotalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();
  
  // State variables
  const [requestedDeliveryDate, setRequestedDeliveryDate] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState<"delivery" | "pickup">("delivery");
  const [selectedCollectionPoint, setSelectedCollectionPoint] = useState<string>("");
  const [collectionPoints, setCollectionPoints] = useState<any[]>([]);
  const [deliveryFee, setDeliveryFee] = useState(4.5);
  const [clientSecret, setClientSecret] = useState<string>("");
  const [paymentIntentId, setPaymentIntentId] = useState<string>("");
  const [showPayment, setShowPayment] = useState(false);

  // Fetch collection points
  useEffect(() => {
    const fetchCollectionPoints = async () => {
      try {
        const { data, error } = await supabase
          .from('collection_points')
          .select('*')
          .eq('is_active', true)
          .order('point_name', { ascending: true });
        
        if (error) throw error;
        setCollectionPoints(data || []);
        
        // Auto-select first collection point if available
        if (data && data.length > 0) {
          setSelectedCollectionPoint(data[0].id);
        }
      } catch (error) {
        console.error('Failed to fetch collection points:', error);
      }
    };

    fetchCollectionPoints();
  }, []);

  // Fetch delivery fee from settings (supports both new and legacy keys)
  useEffect(() => {
    const fetchDeliveryFee = async () => {
      try {
        // Preferred: general/default_delivery_fee with JSON { value, currency }
        const { data: generalRow } = await supabase
          .from('fulfillment_settings')
          .select('setting_value')
          .eq('setting_type', 'general')
          .eq('setting_key', 'default_delivery_fee')
          .single();

        if (generalRow?.setting_value !== undefined) {
          const possible = (generalRow as any).setting_value as any;
          const val = typeof possible === 'object' && possible !== null && 'value' in possible
            ? possible.value
            : possible;
          const num = typeof val === 'number' ? val : parseFloat(String(val));
          if (!Number.isNaN(num)) {
            setDeliveryFee(num);
            return;
          }
        }

        // Legacy fallback: fees/delivery_fee as string or number
        const { data: legacyRow } = await supabase
          .from('fulfillment_settings')
          .select('setting_value')
          .eq('setting_type', 'fees')
          .eq('setting_key', 'delivery_fee')
          .single();

        if (legacyRow?.setting_value !== undefined) {
          const num = typeof legacyRow.setting_value === 'number'
            ? legacyRow.setting_value
            : parseFloat(String(legacyRow.setting_value));
          if (!Number.isNaN(num)) setDeliveryFee(num);
        }
      } catch (e) {
        // leave default 2.99 on error
      }
    };

    fetchDeliveryFee();
  }, []);

  // Calculate minimum delivery date (tomorrow)
  const getMinDeliveryDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  // Get available dates for selected collection point
  const getAvailableCollectionDates = () => {
    if (deliveryMethod !== "pickup" || !selectedCollectionPoint) return [];
    
    const selectedPoint = collectionPoints.find(cp => cp.id === selectedCollectionPoint);
    if (!selectedPoint) return [];
    
    const availableDates = [];
    const today = new Date();
    
    // Generate next 30 days and filter by collection days
    for (let i = 1; i <= 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      const dayName = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      
      // Check if this day is in the collection point's available days
      if (selectedPoint.collection_days.some(day => day.toLowerCase() === dayName)) {
        availableDates.push(date.toISOString().split('T')[0]);
      }
    }
    
    return availableDates;
  };

  // Check if a date is available for collection
  const isDateAvailable = (dateString: string) => {
    if (deliveryMethod === "delivery") return true;
    if (!selectedCollectionPoint) return false;
    
    const availableDates = getAvailableCollectionDates();
    return availableDates.includes(dateString);
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

  const isDateDisabled = (date: Date) => {
    if (deliveryMethod === "delivery") return false;
    if (!selectedCollectionPoint) return true;
    
    const selectedPoint = collectionPoints.find(cp => cp.id === selectedCollectionPoint);
    if (!selectedPoint) return true;
    
    const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const today = new Date();
    const minDate = new Date(getMinDeliveryDate());
    
    return date < minDate || !selectedPoint.collection_days.includes(dayOfWeek);
  };

  const isAvailableCollectionDay = (date: Date) => {
    if (deliveryMethod === "delivery") return true;
    if (!selectedCollectionPoint) return false;
    
    const selectedPoint = collectionPoints.find(cp => cp.id === selectedCollectionPoint);
    if (!selectedPoint) return false;
    
    const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const minDate = new Date(getMinDeliveryDate());
    
    return date >= minDate && selectedPoint.collection_days.includes(dayOfWeek);
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
              {deliveryMethod === "delivery" && (
                <div className="flex justify-between">
                  <span>Delivery</span>
                  <span>£{deliveryFee.toFixed(2)}</span>
                </div>
              )}
              {deliveryMethod === "pickup" && selectedCollectionPoint && (
                <div className="flex justify-between">
                  <span>Collection</span>
                  <span>£{(collectionPoints.find(cp => cp.id === selectedCollectionPoint)?.collection_fee || 0).toFixed(2)}</span>
                </div>
              )}
              <div className="border-t pt-4">
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>£{(getTotalPrice() + (deliveryMethod === "delivery" ? deliveryFee : selectedCollectionPoint ? (collectionPoints.find(cp => cp.id === selectedCollectionPoint)?.collection_fee || 0) : 0)).toFixed(2)}</span>
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
              
              {/* Delivery Method Selection */}
              <div className="space-y-3 border-t pt-4">
                <Label className="font-semibold">Delivery or Collection?</Label>
                <Select value={deliveryMethod} onValueChange={(value: "delivery" | "pickup") => setDeliveryMethod(value)}>
                  <SelectTrigger className="w-full bg-background border-2 focus:border-primary/50">
                    <SelectValue placeholder="Choose delivery method" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border shadow-lg z-50">
                    <SelectItem value="delivery" className="flex items-center gap-2">
                      <div className="flex items-center gap-2">
                        <Truck className="h-4 w-4" />
                        Delivery - £{deliveryFee.toFixed(2)}
                      </div>
                    </SelectItem>
                    <SelectItem value="pickup" className="flex items-center gap-2">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Collection - From £{collectionPoints.length > 0 ? Math.min(...collectionPoints.map(cp => cp.collection_fee)).toFixed(2) : '0.00'}
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                
                {deliveryMethod === "pickup" && collectionPoints.length > 0 && (
                  <div className="space-y-3">
                    <Label className="font-semibold">Select Collection Point</Label>
                    <Select value={selectedCollectionPoint} onValueChange={setSelectedCollectionPoint}>
                      <SelectTrigger className="w-full bg-background border-2 focus:border-primary/50">
                        <SelectValue placeholder="Choose collection point" />
                      </SelectTrigger>
                      <SelectContent className="bg-background border shadow-lg z-50">
                        {collectionPoints.map((point) => (
                          <SelectItem key={point.id} value={point.id}>
                            <div>
                              <div className="font-medium">{point.point_name}</div>
                              <div className="text-sm text-muted-foreground">
                                {point.city} - £{point.collection_fee.toFixed(2)}
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    {selectedCollectionPoint && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        {(() => {
                          const point = collectionPoints.find(cp => cp.id === selectedCollectionPoint);
                          return point ? (
                            <div className="text-sm text-blue-800">
                              <strong>Collection Address:</strong><br />
                              {point.point_name}<br />
                              {point.address}<br />
                              {point.city}, {point.postcode}<br />
                              {point.phone && <span>Phone: {point.phone}<br /></span>}
                              <strong>Collection fee: £{point.collection_fee.toFixed(2)}</strong><br />
                              <strong>Collection days:</strong> {point.collection_days.map(day => day.charAt(0).toUpperCase() + day.slice(1)).join(', ')}
                              {point.special_instructions && (
                                <div className="mt-2">
                                  <strong>Special instructions:</strong><br />
                                  {point.special_instructions}
                                </div>
                              )}
                            </div>
                          ) : null;
                        })()}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Delivery Date Selection */}
              <div className="space-y-3 border-t pt-4">
                <Label htmlFor="delivery-date" className="flex items-center gap-2 font-semibold">
                  <CalendarIcon className="h-4 w-4" />
                  {deliveryMethod === "delivery" ? "Delivery Date" : "Collection Date"}
                </Label>
                
                {deliveryMethod === "pickup" && selectedCollectionPoint && (
                  <div className="text-sm text-muted-foreground mb-2">
                    {(() => {
                      const point = collectionPoints.find(cp => cp.id === selectedCollectionPoint);
                      return point ? (
                        <span>Available collection days: {point.collection_days.map(day => 
                          day.charAt(0).toUpperCase() + day.slice(1)
                        ).join(', ')}</span>
                      ) : null;
                    })()}
                  </div>
                )}
                
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !requestedDeliveryDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {requestedDeliveryDate ? (
                        format(new Date(requestedDeliveryDate), "PPP")
                      ) : (
                        <span>Pick a {deliveryMethod === "delivery" ? "delivery" : "collection"} date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={requestedDeliveryDate ? new Date(requestedDeliveryDate + 'T12:00:00') : undefined}
                      onSelect={(date) => {
                        if (date) {
                          // Format date as YYYY-MM-DD without timezone conversion
                          const year = date.getFullYear();
                          const month = String(date.getMonth() + 1).padStart(2, '0');
                          const day = String(date.getDate()).padStart(2, '0');
                          const dateString = `${year}-${month}-${day}`;
                          setRequestedDeliveryDate(dateString);
                        }
                      }}
                      disabled={isDateDisabled}
                      modifiers={{
                        available: deliveryMethod === "pickup" ? isAvailableCollectionDay : () => false
                      }}
                      modifiersStyles={{
                        available: { fontWeight: 'bold' }
                      }}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <Button
                className="w-full"
                size="lg"
                disabled={!requestedDeliveryDate || (deliveryMethod === "pickup" && !selectedCollectionPoint) || (deliveryMethod === "pickup" && !isDateAvailable(requestedDeliveryDate))}
                onClick={async () => {
                  if (!requestedDeliveryDate) {
                    toast({ 
                      title: `${deliveryMethod === "delivery" ? "Delivery" : "Collection"} date required`, 
                      description: `Please select your preferred ${deliveryMethod === "delivery" ? "delivery" : "collection"} date`,
                      variant: 'destructive' 
                    });
                    return;
                  }

                  if (deliveryMethod === "pickup" && !selectedCollectionPoint) {
                    toast({ 
                      title: "Collection point required", 
                      description: "Please select a collection point",
                      variant: 'destructive' 
                    });
                    return;
                  }

                  if (deliveryMethod === "pickup" && !isDateAvailable(requestedDeliveryDate)) {
                    toast({ 
                      title: "Invalid collection date", 
                      description: "Please select a date that falls on an available collection day",
                      variant: 'destructive' 
                    });
                    return;
                  }

                  try {
                    const collectionPoint = deliveryMethod === "pickup" ? collectionPoints.find(cp => cp.id === selectedCollectionPoint) : null;
                    const collectionFee = collectionPoint?.collection_fee || 0;

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
                        delivery_fee: deliveryMethod === "delivery" ? Math.round(deliveryFee * 100) : Math.round(collectionFee * 100),
                        delivery_method: deliveryMethod,
                        collection_point_id: deliveryMethod === "pickup" ? selectedCollectionPoint : null,
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
                {(!requestedDeliveryDate || (deliveryMethod === "pickup" && (!selectedCollectionPoint || !isDateAvailable(requestedDeliveryDate)))) ? 
                  `Select ${deliveryMethod === "delivery" ? "Delivery" : "Collection"} ${!requestedDeliveryDate ? "Date" : !selectedCollectionPoint ? "Point" : "Valid Date"} to Continue` : 
                  'Proceed to Checkout'}
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