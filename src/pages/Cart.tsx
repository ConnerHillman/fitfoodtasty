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
  
  
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [deliveryZone, setDeliveryZone] = useState<any>(null);
  const [userPostcode, setUserPostcode] = useState<string>("");
  const [manualPostcode, setManualPostcode] = useState<string>("");
  const [postcodeChecked, setPostcodeChecked] = useState<boolean>(false);

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

  // Function to fetch delivery zone by postcode
  const fetchDeliveryZoneByPostcode = async (postcode: string) => {
    if (!postcode) return;
    
    try {
      // Clean and format the postcode consistently (remove all non-alphanumerics, uppercase)
      const cleanPostcode = postcode.toUpperCase().replace(/[^A-Z0-9]/g, '');
      // Extract outward code (e.g., TA6 from TA65LT)
      const outcodeMatch = cleanPostcode.match(/^[A-Z]{1,2}\d[A-Z\d]?/);
      const outcode = outcodeMatch ? outcodeMatch[0] : cleanPostcode;
      console.log('Checking delivery for postcode:', cleanPostcode, 'outcode:', outcode);
      
      // Find delivery zone for this postcode
      const { data: zones, error: zonesError } = await supabase
        .from('delivery_zones')
        .select('*')
        .eq('is_active', true);

      if (zonesError) throw zonesError;
      console.log('Available zones:', zones?.length);

      // Find matching zone based on postcode
      const matchingZone = zones?.find(zone => {
        // Check exact postcode match (with normalization)
        if (zone.postcodes?.some((zonePostcode: string) => 
          zonePostcode.toUpperCase().replace(/[^A-Z0-9]/g, '') === cleanPostcode
        )) {
          console.log('Exact postcode match found:', zone.zone_name);
          return true;
        }
        
        // Check prefix match against either cleaned full postcode or outcode
        if (zone.postcode_prefixes?.some((prefix: string) => {
          const cleanPrefix = prefix.toUpperCase().replace(/[^A-Z0-9]/g, '');
          const matches = cleanPostcode.startsWith(cleanPrefix) || outcode.startsWith(cleanPrefix);
          if (matches) console.log('Prefix match found:', cleanPrefix, 'for zone:', zone.zone_name);
          return matches;
        })) {
          return true;
        }
        
        return false;
      });

      if (matchingZone) {
        console.log('Found matching zone:', matchingZone.zone_name);
        setDeliveryZone(matchingZone);
        setPostcodeChecked(true);
        if (matchingZone.delivery_fee) setDeliveryFee(matchingZone.delivery_fee);
      } else {
        console.log('No matching zone found for postcode:', cleanPostcode, 'outcode:', outcode);
        setDeliveryZone(null);
        setPostcodeChecked(true);
      }
    } catch (error) {
      console.error('Failed to fetch delivery zone:', error);
      setPostcodeChecked(true);
    }
  };

  // Fetch user profile and delivery zone
  useEffect(() => {
    const fetchUserDeliveryZone = async () => {
      if (!user) return;
      
      try {
        // Get user's postcode from profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('postal_code')
          .eq('user_id', user.id)
          .single();

        if (profileError) throw profileError;
        
        const postcode = profile?.postal_code || user.user_metadata?.postal_code;
        if (postcode) {
          setUserPostcode(postcode);
          setManualPostcode(postcode);
          await fetchDeliveryZoneByPostcode(postcode);
        }
      } catch (error) {
        console.error('Failed to fetch user delivery zone:', error);
      }
    };

    fetchUserDeliveryZone();
  }, [user]);

  // Handle manual postcode input
  const handlePostcodeChange = async (postcode: string) => {
    setManualPostcode(postcode);
    setPostcodeChecked(false);
    if (postcode.length >= 4) { // Basic UK postcode length check
      await fetchDeliveryZoneByPostcode(postcode);
    }
  };

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

  // Auto-create Stripe PaymentIntent when requirements are met
  useEffect(() => {
    const createPI = async () => {
      try {
        if (!requestedDeliveryDate) return;

        // Validate availability for the chosen day
        const validDay = isAvailableDay(new Date(requestedDeliveryDate + 'T12:00:00'));
        if (!validDay) return;

        // Validate delivery/pickup specifics
        if (deliveryMethod === 'pickup') {
          if (!selectedCollectionPoint) return;
        } else {
          if (!deliveryZone) return;
        }

        const collectionPoint = deliveryMethod === 'pickup' ? collectionPoints.find(cp => cp.id === selectedCollectionPoint) : null;
        const collectionFee = collectionPoint?.collection_fee || 0;

        const { data, error } = await supabase.functions.invoke('create-payment-intent', {
          body: {
            currency: 'gbp',
            items: items.map(i => ({
              name: i.name,
              amount: Math.round(i.price * 100),
              quantity: i.quantity,
              description: i.description,
              meal_id: i.id,
            })),
            delivery_fee: deliveryMethod === 'delivery' ? Math.round(deliveryFee * 100) : Math.round(collectionFee * 100),
            delivery_method: deliveryMethod,
            collection_point_id: deliveryMethod === 'pickup' ? selectedCollectionPoint : null,
            requested_delivery_date: requestedDeliveryDate,
            production_date: calculateProductionDate(requestedDeliveryDate),
            customer_email: user?.email,
            customer_name: (user as any)?.user_metadata?.full_name,
          }
        });

        if (error) throw error;
        if (data?.clientSecret) {
          setClientSecret(data.clientSecret);
        }
      } catch (err) {
        console.error('Auto-create payment intent failed:', err);
      }
    };

    createPI();
  }, [requestedDeliveryDate, deliveryMethod, selectedCollectionPoint, deliveryZone, items, deliveryFee]);

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
    const today = new Date();
    const minDate = new Date(getMinDeliveryDate());
    
    // Date must be in the future
    if (date < minDate) return true;
    
    if (deliveryMethod === "delivery") {
      // For delivery, check if user has a delivery zone
      if (!deliveryZone) {
        console.log("No delivery zone found for mobile debugging");
        return true;
      }
      
      const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      const isAvailable = deliveryZone.delivery_days && deliveryZone.delivery_days.includes(dayOfWeek);
      console.log("Mobile delivery check:", { dayOfWeek, deliveryDays: deliveryZone.delivery_days, isAvailable });
      return !isAvailable;
    } else {
      // For pickup, check collection points
      if (!selectedCollectionPoint) return true;
      
      const selectedPoint = collectionPoints.find(cp => cp.id === selectedCollectionPoint);
      if (!selectedPoint) return true;
      
      const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      const isAvailable = selectedPoint.collection_days && selectedPoint.collection_days.includes(dayOfWeek);
      console.log("Mobile pickup check:", { dayOfWeek, collectionDays: selectedPoint.collection_days, isAvailable });
      return !isAvailable;
    }
  };

  const isAvailableDay = (date: Date) => {
    const minDate = new Date(getMinDeliveryDate());
    if (date < minDate) return false;
    
    if (deliveryMethod === "delivery") {
      if (!deliveryZone) return false;
      const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      return deliveryZone.delivery_days.includes(dayOfWeek);
    } else {
      if (!selectedCollectionPoint) return false;
      const selectedPoint = collectionPoints.find(cp => cp.id === selectedCollectionPoint);
      if (!selectedPoint) return false;
      const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      return selectedPoint.collection_days.includes(dayOfWeek);
    }
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
              
              {/* Postcode Input for Non-Authenticated Users */}
              {!user && (
                <div className="space-y-3 border-t pt-4">
                  <Label htmlFor="postcode" className="font-semibold">Enter your postcode to check delivery availability</Label>
                  <Input
                    id="postcode"
                    placeholder="Enter postcode (e.g. SW1A 1AA)"
                    value={manualPostcode}
                    onChange={(e) => handlePostcodeChange(e.target.value)}
                    className="uppercase"
                  />
                  {manualPostcode && postcodeChecked && !deliveryZone && (
                    <p className="text-sm text-destructive">No delivery available for this postcode</p>
                  )}
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
                
                {deliveryMethod === "delivery" && deliveryZone && (
                  <div className="text-sm text-muted-foreground mb-2">
                    <span>Available delivery days: {deliveryZone.delivery_days.map((day: string) => 
                      day.charAt(0).toUpperCase() + day.slice(1)
                    ).join(', ')}</span>
                    <br />
                    <span className="text-xs">Delivery zone: {deliveryZone.zone_name}</span>
                  </div>
                )}
                
                {deliveryMethod === "delivery" && !deliveryZone && userPostcode && (
                  <div className="text-sm text-destructive mb-2">
                    <span>No delivery available for postcode: {userPostcode}</span>
                  </div>
                )}
                
                <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
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
                          setCalendarOpen(false); // Close the popover after selection
                        }
                      }}
                      disabled={isDateDisabled}
                      modifiers={{
                        available: isAvailableDay
                      }}
                      modifiersStyles={{
                        available: { fontWeight: 'bold' }
                      }}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Payment Form - Only for authenticated users */}
              {requestedDeliveryDate && user && clientSecret && (
                <div className="mt-4">
                  <Elements key={clientSecret} stripe={stripePromise} options={{ clientSecret }}>
                    <PaymentForm
                      clientSecret={clientSecret}
                      totalAmount={Math.round((getTotalPrice() + (deliveryMethod === "delivery" ? deliveryFee : (collectionPoints.find(cp => cp.id === selectedCollectionPoint)?.collection_fee || 0))) * 100)}
                      deliveryMethod={deliveryMethod}
                      requestedDeliveryDate={requestedDeliveryDate}
                    />
                  </Elements>
                </div>
              )}
              
              {/* Login prompt for non-authenticated users */}
              {requestedDeliveryDate && !user && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-2">Ready to complete your order?</h4>
                  <p className="text-sm text-blue-700 mb-3">Create an account or log in to proceed with payment</p>
                  <Button asChild className="w-full">
                    <Link to="/auth">Create Account / Log In</Link>
                  </Button>
                </div>
              )}
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