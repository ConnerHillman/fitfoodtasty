import { useState, useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
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
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft, CalendarIcon, Clock, Truck, MapPin, ChevronDown, ChevronUp } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Elements } from "@stripe/react-stripe-js";
import { stripePromise } from "@/lib/stripe";
import PaymentForm from "@/components/PaymentForm";
import GiftCardInput from "@/components/GiftCardInput";

const Cart = () => {
  const { items, updateQuantity, removeFromCart, getTotalPrice, clearCart, addToCart } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  // State variables
  const [requestedDeliveryDate, setRequestedDeliveryDate] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState<"delivery" | "pickup">("delivery");
  const [selectedCollectionPoint, setSelectedCollectionPoint] = useState<string>("");
  const [collectionPoints, setCollectionPoints] = useState<any[]>([]);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [clientSecret, setClientSecret] = useState<string>("");
  
  // Coupon state
  const [couponCode, setCouponCode] = useState("");
  const [couponMessage, setCouponMessage] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null); // Store full coupon data
  const [freeItemAdded, setFreeItemAdded] = useState(false);
  
  // Gift card state
  const [appliedGiftCard, setAppliedGiftCard] = useState<{
    code: string;
    amount_used: number;
    gift_card_id: string;
  } | null>(null);
  
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [deliveryZone, setDeliveryZone] = useState<any>(null);
  const [userPostcode, setUserPostcode] = useState<string>("");
  const [manualPostcode, setManualPostcode] = useState<string>("");
  const [postcodeChecked, setPostcodeChecked] = useState<boolean>(false);
  const [orderSummaryExpanded, setOrderSummaryExpanded] = useState<boolean>(false);

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
        // leave default 5.99 on error
      }
    };

    fetchDeliveryFee();
  }, []);

  // Auto-create Stripe PaymentIntent when requirements are met (skip for 100% off)
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

        // Skip payment intent creation for 100% off coupons
        if (isCoupon100PercentOff()) {
          setClientSecret("");
          return;
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
              type: i.type,
              packageData: i.packageData,
            })),
            delivery_fee: deliveryMethod === 'delivery' ? Math.round(deliveryFee * 100) : Math.round(collectionFee * 100),
            delivery_method: deliveryMethod,
            collection_point_id: deliveryMethod === 'pickup' ? selectedCollectionPoint : null,
            requested_delivery_date: requestedDeliveryDate,
            production_date: calculateProductionDate(requestedDeliveryDate),
            customer_email: user?.email,
            customer_name: (user as any)?.user_metadata?.full_name,
            coupon_code: couponApplied ? appliedCoupon?.code : null,
            coupon_data: couponApplied ? appliedCoupon : null,
            gift_card_code: appliedGiftCard?.code || null,
            gift_card_amount_used: appliedGiftCard?.amount_used || 0,
            gift_card_id: appliedGiftCard?.gift_card_id || null,
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
  }, [requestedDeliveryDate, deliveryMethod, selectedCollectionPoint, deliveryZone, items, deliveryFee, couponApplied, appliedCoupon]);

  // Calculate minimum delivery date (tomorrow)
  const getMinDeliveryDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  // Helper function to check if coupon makes order 100% off
  const isCoupon100PercentOff = () => {
    if (!couponApplied || !appliedCoupon) return false;
    
    if (appliedCoupon.discount_percentage >= 100) return true;
    
    const subtotal = getTotalPrice();
    const fees = deliveryMethod === "delivery" ? 
      (appliedCoupon.free_delivery ? 0 : deliveryFee) : 
      (collectionPoints.find(cp => cp.id === selectedCollectionPoint)?.collection_fee || 0);
    const total = subtotal + fees;
    
    return appliedCoupon.discount_amount >= total;
  };

  // Calculate discounted total with new discount types
  const getDiscountedTotal = () => {
    const subtotal = getTotalPrice();
    let fees = deliveryMethod === "delivery" ? deliveryFee : (collectionPoints.find(cp => cp.id === selectedCollectionPoint)?.collection_fee || 0);
    
    // Apply free delivery
    if (couponApplied && appliedCoupon?.free_delivery && deliveryMethod === "delivery") {
      fees = 0;
    }
    
    let total = subtotal + fees;
    
    // Apply coupon discount first
    if (couponApplied && appliedCoupon) {
      if (appliedCoupon.discount_percentage > 0) {
        const discountAmount = (total * appliedCoupon.discount_percentage) / 100;
        total = Math.max(0, total - discountAmount);
      } else if (appliedCoupon.discount_amount > 0) {
        total = Math.max(0, total - appliedCoupon.discount_amount);
      }
    }
    
    // Apply gift card discount
    if (appliedGiftCard) {
      total = Math.max(0, total - appliedGiftCard.amount_used);
    }
    
    return total;
  };

  // Get discount display text
  const getDiscountDisplay = () => {
    if (!couponApplied || !appliedCoupon) return "";
    
    if (appliedCoupon.discount_percentage > 0) {
      return `Discount (${appliedCoupon.discount_percentage}%)`;
    } else if (appliedCoupon.discount_amount > 0) {
      return `Discount (£${appliedCoupon.discount_amount} off)`;
    } else if (appliedCoupon.free_delivery) {
      return "Free Delivery";
    } else if (appliedCoupon.free_item_id) {
      return "Free Item";
    }
    return "Discount";
  };

  // Calculate discount amount for display
  const getDiscountAmount = () => {
    if (!couponApplied || !appliedCoupon) return 0;
    
    const subtotal = getTotalPrice();
    let fees = deliveryMethod === "delivery" ? deliveryFee : (collectionPoints.find(cp => cp.id === selectedCollectionPoint)?.collection_fee || 0);
    
    if (appliedCoupon.discount_percentage > 0) {
      return ((subtotal + fees) * appliedCoupon.discount_percentage) / 100;
    } else if (appliedCoupon.discount_amount > 0) {
      return Math.min(appliedCoupon.discount_amount, subtotal + fees);
    } else if (appliedCoupon.free_delivery && deliveryMethod === "delivery") {
      return fees;
    }
    return 0;
  };

  // Check if coupon expires within 3 days and show warning
  const checkExpiryWarning = (coupon: any) => {
    if (!coupon?.expires_at) return;
    
    const now = new Date();
    const expiryDate = new Date(coupon.expires_at);
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry <= 3 && daysUntilExpiry > 0) {
      const warningMessage = daysUntilExpiry === 1 ? "Expires tomorrow!" : `Expires in ${daysUntilExpiry} days!`;
      toast({
        title: "⚠️ Coupon Expires Soon!",
        description: warningMessage,
        variant: "destructive",
      });
    }
  };

  // Get expiry warning text for display
  const getExpiryWarning = () => {
    if (!couponApplied || !appliedCoupon?.expires_at) return null;
    
    const now = new Date();
    const expiryDate = new Date(appliedCoupon.expires_at);
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry <= 3 && daysUntilExpiry > 0) {
      return daysUntilExpiry === 1 ? "⚠️ Expires tomorrow!" : `⚠️ Expires in ${daysUntilExpiry} days!`;
    }
    return null;
  };

  // Create free order for 100% off coupons
  const createFreeOrder = async () => {
    try {
      const collectionPoint = deliveryMethod === 'pickup' ? collectionPoints.find(cp => cp.id === selectedCollectionPoint) : null;
      const collectionFee = collectionPoint?.collection_fee || 0;
      let deliveryFeeToUse = deliveryMethod === "delivery" ? deliveryFee : collectionFee;
      
      // Apply free delivery
      if (appliedCoupon?.free_delivery && deliveryMethod === "delivery") {
        deliveryFeeToUse = 0;
      }

      const originalTotal = getTotalPrice() + deliveryFeeToUse;
      const discountAmount = originalTotal; // Full discount for free orders

      // Check if we have package items
      const hasPackageItems = items.some(item => item.type === 'package');
      
      if (hasPackageItems) {
        // Handle package order creation
        const packageItem = items.find(item => item.type === 'package');
        if (!packageItem?.packageData) {
          throw new Error('Package data not found');
        }

        const { data: packageOrderData, error: packageOrderError } = await supabase
          .from('package_orders')
          .insert({
            user_id: user?.id,
            package_id: packageItem.packageData.packageId,
            total_amount: 0,
            currency: 'gbp',
            status: 'confirmed',
            customer_email: user?.email,
            customer_name: (user as any)?.user_metadata?.full_name,
            requested_delivery_date: requestedDeliveryDate,
            production_date: calculateProductionDate(requestedDeliveryDate),
            delivery_address: (user as any)?.user_metadata?.delivery_address,
          })
          .select()
          .single();

        if (packageOrderError) throw packageOrderError;

        // Create package meal selections
        const packageSelections = Object.entries(packageItem.packageData.selectedMeals).map(([mealId, quantity]) => ({
          package_order_id: packageOrderData.id,
          meal_id: mealId,
          quantity: quantity,
        }));

        // Add free item to package meal selections if applicable
        if (appliedCoupon?.free_item_id) {
          packageSelections.push({
            package_order_id: packageOrderData.id,
            meal_id: appliedCoupon.free_item_id,
            quantity: 1,
          });
        }

        const { error: selectionsError } = await supabase
          .from('package_meal_selections')
          .insert(packageSelections);

        if (selectionsError) throw selectionsError;

      } else {
        // Handle regular order creation
        const { data, error } = await supabase
          .from('orders')
          .insert({
            user_id: user?.id,
            total_amount: 0,
            discount_amount: discountAmount,
            currency: 'gbp',
            status: 'confirmed',
            customer_email: user?.email,
            customer_name: (user as any)?.user_metadata?.full_name,
            requested_delivery_date: requestedDeliveryDate,
            production_date: calculateProductionDate(requestedDeliveryDate),
            delivery_address: (user as any)?.user_metadata?.delivery_address,
            referral_code_used: appliedCoupon?.code,
            coupon_type: appliedCoupon ? (
              appliedCoupon.discount_amount > 0 ? 'fixed_amount' :
              appliedCoupon.free_delivery ? 'free_delivery' :
              appliedCoupon.free_item_id ? 'free_item' : 'percentage'
            ) : null,
            coupon_discount_percentage: appliedCoupon?.discount_percentage || 0,
            coupon_discount_amount: appliedCoupon?.discount_amount || 0,
            coupon_free_delivery: appliedCoupon?.free_delivery || false,
            coupon_free_item_id: appliedCoupon?.free_item_id || null,
            expires_at: appliedCoupon?.expires_at || null,
          })
          .select()
          .single();

        if (error) throw error;

        // Create order items (including regular cart items)
        const orderItems = items
          .filter(item => !item.id.startsWith('free-')) // Exclude already-free items to avoid duplication
          .map(item => ({
            order_id: data.id,
            meal_id: item.id,
            meal_name: item.name,
            quantity: item.quantity,
            unit_price: item.price,
            total_price: item.price * item.quantity,
          }));

        // Add free item as separate order item if applicable
        if (appliedCoupon?.free_item_id) {
          try {
            const { data: freeItemData, error: freeItemError } = await supabase
              .from('meals')
              .select('name')
              .eq('id', appliedCoupon.free_item_id)
              .single();

            if (!freeItemError && freeItemData) {
              orderItems.push({
                order_id: data.id,
                meal_id: appliedCoupon.free_item_id,
                meal_name: `🎁 FREE: ${freeItemData.name}`,
                quantity: 1,
                unit_price: 0,
                total_price: 0,
              });
            }
          } catch (err) {
            console.error('Error adding free item to order:', err);
          }
        }

        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItems);

        if (itemsError) throw itemsError;
      }

      toast({
        title: "Order Confirmed!",
        description: "Your free order has been placed successfully.",
      });

      clearCart();
      // Redirect to success page or orders page
      window.location.href = '/orders';
    } catch (error) {
      console.error('Error creating free order:', error);
      toast({
        title: "Error",
        description: "Failed to create order. Please try again.",
        variant: "destructive",
      });
    }
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

  // Apply coupon function
  const applyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponMessage("Please enter a coupon code");
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('validate-coupon', {
        body: { 
          code: couponCode.trim(),
          cart_total: getTotalPrice()
        }
      });

      if (error) {
        setCouponMessage("Error validating coupon");
        return;
      }

      if (data.valid) {
        setAppliedCoupon(data.coupon);
        setCouponApplied(true);
        setCouponCode(""); // Clear input
        
        // Handle free item addition
        if (data.coupon.free_item_id && !freeItemAdded) {
          try {
            // Check if free item already exists in cart
            const freeItemId = `free-${data.coupon.free_item_id}`;
            const existingFreeItem = items.find(item => item.id === freeItemId);
            
            if (!existingFreeItem) {
              // Fetch meal details
              const { data: mealData, error: mealError } = await supabase
                .from('meals')
                .select('*')
                .eq('id', data.coupon.free_item_id)
                .single();

              if (!mealError && mealData) {
                // Create free item object
                const freeItem = {
                  id: freeItemId,
                  name: `🎁 FREE: ${mealData.name}`,
                  description: `${mealData.description} (Free with coupon)`,
                  category: mealData.category,
                  price: 0,
                  total_calories: mealData.total_calories || 0,
                  total_protein: mealData.total_protein || 0,
                  total_carbs: mealData.total_carbs || 0,
                  total_fat: mealData.total_fat || 0,
                  total_fiber: mealData.total_fiber || 0,
                  shelf_life_days: mealData.shelf_life_days || 5,
                  image_url: mealData.image_url,
                };
                
                // Add to cart using CartContext
                addToCart(freeItem);
                setFreeItemAdded(true);
                
                toast({
                  title: "Free Item Added!",
                  description: `${mealData.name} has been added to your cart for free!`,
                });
              }
            } else {
              setFreeItemAdded(true);
            }
          } catch (err) {
            console.error("Error adding free item:", err);
            toast({
              title: "Warning",
              description: "Coupon applied but free item could not be added. Contact support if needed.",
              variant: "destructive",
            });
          }
        }
        
        // Set appropriate message based on discount type
        let message = "";
        if (data.coupon.discount_percentage > 0) {
          message = `Coupon applied: ${data.coupon.discount_percentage}% off`;
        } else if (data.coupon.discount_amount > 0) {
          message = `Coupon applied: £${data.coupon.discount_amount} off`;
        } else if (data.coupon.free_delivery) {
          message = "Coupon applied: Free delivery";
        } else if (data.coupon.free_item_id) {
          message = "Coupon applied: Free item added to cart";
        }
        
        // Add expiration date to message if available
        if (data.coupon.expires_at) {
          const expirationDate = new Date(data.coupon.expires_at);
          const formattedDate = expirationDate.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          });
          message += `, expires ${formattedDate}`;
        }
        
        setCouponMessage(message);
        
        // Check for expiry warning
        checkExpiryWarning(data.coupon);
        
        toast({
          title: "Coupon Applied!",
          description: message,
        });
      } else {
        setCouponMessage(data.error || "Invalid or expired coupon");
      }
    } catch (err) {
      console.error("Coupon validation error:", err);
      setCouponMessage("Failed to validate coupon");
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
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="text-center py-12">
          <ShoppingBag className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-xl sm:text-2xl font-semibold mb-2">Your cart is empty</h2>
          <p className="text-muted-foreground mb-6 text-sm sm:text-base">
            Start adding some delicious meals to your cart!
          </p>
          <Button asChild className="w-full sm:w-auto h-12 sm:h-10">
            <Link to="/menu">Browse Menu</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Continue Shopping Button */}
      <div className="mb-4 sm:mb-6">
        <Button asChild size="lg" className="w-full sm:w-auto h-12 sm:h-11 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold px-6 py-3 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200">
          <Link to="/menu" className="flex items-center justify-center space-x-2">
            <ArrowLeft className="h-5 w-5" />
            <span className="text-sm sm:text-base">CONTINUE SHOPPING</span>
          </Link>
        </Button>
      </div>
      
      <div className="mb-6 sm:mb-8">
        <h1 className="text-display-sm text-foreground mb-2">Your Cart</h1>
        <p className="text-body-md text-muted-foreground">
          Review your selected meals before checkout
        </p>
      </div>

      {/* Mobile: Show collapsible order summary first */}
      <div className="block lg:hidden mb-6">
        <Card>
          <CardHeader className="pb-3">
            <Button
              variant="ghost"
              className="w-full flex items-center justify-between p-0 h-auto"
              onClick={() => setOrderSummaryExpanded(!orderSummaryExpanded)}
            >
              <CardTitle className="text-lg">Order Summary - £{getDiscountedTotal().toFixed(2)}</CardTitle>
              {orderSummaryExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </Button>
          </CardHeader>
          {orderSummaryExpanded && (
            <CardContent className="pt-0">
              <div className="space-y-4">
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
                
                {/* Show free items separately with enhanced UI */}
                {items.filter(item => item.id.startsWith('free-')).map(freeItem => (
                  <div key={freeItem.id} className="flex justify-between items-center bg-green-100 border-2 border-green-300 rounded-lg p-3 shadow-sm">
                    <div className="flex items-center gap-2">
                      <div className="bg-green-500 text-white p-1.5 rounded-full">
                        🎁
                      </div>
                      <div className="flex flex-col">
                        <span className="bg-green-600 text-white text-xs font-bold px-2 py-1 rounded-full w-fit mb-1">
                          FREE ITEM
                        </span>
                        <span className="text-green-800 font-semibold">{freeItem.name.replace('🎁 FREE: ', '')}</span>
                      </div>
                    </div>
                    <span className="text-green-700 font-bold text-lg">FREE</span>
                  </div>
                ))}
                
                {/* Original Total (crossed out if discount applied) */}
                <div className="border-t pt-4">
                  {couponApplied && getDiscountAmount() > 0 ? (
                    <>
                      <div className="flex justify-between text-gray-500">
                        <span>Original Total</span>
                        <span className="line-through">£{(getTotalPrice() + (deliveryMethod === "delivery" ? deliveryFee : selectedCollectionPoint ? (collectionPoints.find(cp => cp.id === selectedCollectionPoint)?.collection_fee || 0) : 0)).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-green-600 font-medium">
                        <span>{getDiscountDisplay()}</span>
                        <span>-£{getDiscountAmount().toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-semibold text-lg text-green-700 mt-2">
                        <span>Total</span>
                        <span>£{getDiscountedTotal().toFixed(2)}</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between font-semibold text-lg">
                      <span>Total</span>
                      <span>£{getDiscountedTotal().toFixed(2)}</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      </div>

      <div className="flex flex-col lg:grid lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Cart Items */}
        <div className="order-2 lg:order-1 lg:col-span-2 space-y-4">
          {items.map((item) => {
            const isFreeItem = item.id.startsWith('free-');
            
            return (
              <Card key={item.id} className={isFreeItem ? "bg-gradient-to-r from-green-50 to-emerald-50 border-green-200" : ""}>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row items-start gap-4">
                    {item.image_url && (
                      <div className="relative">
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-full sm:w-20 h-32 sm:h-20 object-cover rounded-lg"
                        />
                        {isFreeItem && (
                          <div className="absolute -top-2 -right-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                            FREE
                          </div>
                        )}
                      </div>
                    )}
                    <div className="flex-1 w-full">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 pr-2">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-base sm:text-lg">{item.name}</h3>
                            {isFreeItem && (
                              <span className="bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                                FREE ITEM
                              </span>
                            )}
                          </div>
                          <p className="text-muted-foreground text-sm mb-2 line-clamp-2">
                            {item.description}
                          </p>
                          <div className={`text-lg font-semibold sm:hidden ${isFreeItem ? 'text-green-600' : ''}`}>
                            {isFreeItem ? 'FREE' : `£${(item.price * item.quantity).toFixed(2)}`}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFromCart(item.id)}
                          className="text-destructive hover:text-destructive min-h-[44px] min-w-[44px] p-2"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1 || isFreeItem}
                            className="h-11 w-11 sm:h-9 sm:w-9"
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-12 sm:w-8 text-center font-medium text-lg sm:text-base">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            disabled={isFreeItem}
                            className="h-11 w-11 sm:h-9 sm:w-9"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className={`text-lg font-semibold hidden sm:block ${isFreeItem ? 'text-green-600' : ''}`}>
                          {isFreeItem ? 'FREE' : `£${(item.price * item.quantity).toFixed(2)}`}
                        </div>
                      </div>
                     </div>
                   </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Order Summary - Desktop only */}
        <div className="order-1 lg:order-2 hidden lg:block space-y-4">
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
              
              {/* Show free items separately with enhanced UI for desktop */}
              {items.filter(item => item.id.startsWith('free-')).map(freeItem => (
                <div key={freeItem.id} className="flex justify-between items-center bg-green-100 border-2 border-green-300 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <div className="bg-green-500 text-white p-1 rounded-full text-sm">
                      🎁
                    </div>
                    <div className="flex flex-col">
                      <span className="bg-green-600 text-white text-xs font-bold px-2 py-0.5 rounded-full w-fit mb-1">
                        FREE ITEM
                      </span>
                      <span className="text-green-800 font-medium">{freeItem.name.replace('🎁 FREE: ', '')}</span>
                    </div>
                  </div>
                  <span className="text-green-700 font-bold">FREE</span>
                </div>
              ))}
              
              {/* Original Total (crossed out if discount applied) */}
              {couponApplied && getDiscountAmount() > 0 ? (
                <>
                  <div className="flex justify-between text-gray-500">
                    <span>Original Total</span>
                    <span className="line-through">£{(getTotalPrice() + (deliveryMethod === "delivery" ? deliveryFee : selectedCollectionPoint ? (collectionPoints.find(cp => cp.id === selectedCollectionPoint)?.collection_fee || 0) : 0)).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-green-600 font-medium">
                    <span>{getDiscountDisplay()}</span>
                    <span>-£{getDiscountAmount().toFixed(2)}</span>
                  </div>
                </>
              ) : null}
              
              <div className="border-t pt-4">
                <div className={`flex justify-between font-semibold text-lg ${couponApplied && getDiscountAmount() > 0 ? 'text-green-700' : ''}`}>
                  <span>Total</span>
                  <span>£{getDiscountedTotal().toFixed(2)}</span>
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
                    className="uppercase h-12"
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
                  <SelectTrigger className="w-full bg-background border-2 focus:border-primary/50 h-12">
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
                      <SelectTrigger className="w-full bg-background border-2 focus:border-primary/50 h-12">
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
                
                {/* Desktop Calendar Button */}
                {!isMobile && (
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal h-12 hidden lg:flex",
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
                )}
              </div>

              {/* Coupon Input Section */}
              {requestedDeliveryDate && (
                <div className="mt-4 mb-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <h4 className="font-semibold text-gray-800 mb-3">Have a coupon code?</h4>
                  <div className="flex flex-col lg:flex-row gap-3">
                    <Input
                      type="text"
                      placeholder="Enter coupon code"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      className="flex-1 h-12"
                      disabled={couponApplied}
                    />
                    <Button
                      variant="outline"
                      className="h-12 lg:w-auto w-full px-6"
                      onClick={applyCoupon}
                      disabled={couponApplied || !couponCode.trim()}
                    >
                      Apply
                    </Button>
                  </div>
                  {couponMessage && (
                    <div className={`mt-3 text-sm ${
                      couponApplied 
                        ? "text-green-600 font-medium" 
                        : "text-red-600"
                     }`}>
                       {couponMessage}
                       {getExpiryWarning() && (
                         <div className="mt-2 text-amber-600 font-medium text-xs bg-amber-50 border border-amber-200 rounded px-2 py-1">
                           {getExpiryWarning()}
                         </div>
                       )}
                       {couponApplied && (
                         <Button
                           variant="outline"
                           size="sm"
                           className="ml-2 h-8"
                          onClick={() => {
                            // Remove free item from cart if it was added
                            if (appliedCoupon?.free_item_id && freeItemAdded) {
                              const freeItemId = `free-${appliedCoupon.free_item_id}`;
                              removeFromCart(freeItemId);
                            }
                            
                            setCouponApplied(false);
                            setAppliedCoupon(null);
                            setCouponMessage("");
                            setFreeItemAdded(false);
                            toast({
                              title: "Coupon Removed",
                              description: "Coupon has been removed from your order.",
                            });
                          }}
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Gift Card Input Section */}
              <div className="mt-4 mb-4">
                <GiftCardInput
                  onGiftCardApplied={(giftCardData) => {
                    setAppliedGiftCard(giftCardData);
                    toast({
                      title: "Gift Card Applied!",
                      description: `Applied £${giftCardData.amount_used} from gift card ${giftCardData.code}`,
                    });
                  }}
                  onGiftCardRemoved={() => {
                    setAppliedGiftCard(null);
                  }}
                  appliedGiftCard={appliedGiftCard}
                  totalAmount={getDiscountedTotal()}
                />
              </div>

              {/* Free Order Button for 100% off coupons */}
              {requestedDeliveryDate && user && isCoupon100PercentOff() && (
                <div className="mt-4">
                  <Button
                    onClick={createFreeOrder}
                    className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-semibold"
                  >
                    Complete Free Order
                  </Button>
                </div>
              )}

              {/* Payment Form - Only for authenticated users with payment required */}
              {requestedDeliveryDate && user && clientSecret && !isCoupon100PercentOff() && (
                <div className="mt-4">
                  <Elements key={clientSecret} stripe={stripePromise} options={{ clientSecret }}>
                    <PaymentForm
                      clientSecret={clientSecret}
                      totalAmount={Math.round(getDiscountedTotal() * 100)}
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
                  <Button asChild className="w-full h-12">
                    <Link to="/auth">Create Account / Log In</Link>
                  </Button>
                </div>
              )}
              <Button
                variant="outline"
                className="w-full h-12"
                onClick={clearCart}
              >
                Clear Cart
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Mobile: Full-width forms and checkout at bottom */}
        <div className="order-3 lg:hidden space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Delivery & Payment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Postcode Input for Non-Authenticated Users */}
              {!user && (
                <div className="space-y-3">
                  <Label htmlFor="postcode-mobile" className="font-semibold">Enter your postcode to check delivery availability</Label>
                  <Input
                    id="postcode-mobile"
                    placeholder="Enter postcode (e.g. SW1A 1AA)"
                    value={manualPostcode}
                    onChange={(e) => handlePostcodeChange(e.target.value)}
                    className="uppercase h-12 text-base"
                  />
                  {manualPostcode && postcodeChecked && !deliveryZone && (
                    <p className="text-sm text-destructive">No delivery available for this postcode</p>
                  )}
                </div>
              )}
              
              {/* Delivery Method Selection */}
              <div className="space-y-3">
                <Label className="font-semibold">Delivery or Collection?</Label>
                <Select value={deliveryMethod} onValueChange={(value: "delivery" | "pickup") => setDeliveryMethod(value)}>
                  <SelectTrigger className="w-full bg-background border-2 focus:border-primary/50 h-12 text-base">
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
                      <SelectTrigger className="w-full bg-background border-2 focus:border-primary/50 h-12 text-base">
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
              <div className="space-y-3">
                <Label htmlFor="delivery-date-mobile" className="flex items-center gap-2 font-semibold">
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
                
                {/* Mobile Calendar Button */}
                {isMobile && (
                  <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal h-12 text-base lg:hidden",
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
                )}
              </div>

              {/* Coupon Input Section */}
              {requestedDeliveryDate && (
                <div className="mt-4 mb-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <h4 className="font-semibold text-gray-800 mb-3">Have a coupon code?</h4>
                  <div className="flex flex-col lg:flex-row gap-3">
                    <Input
                      type="text"
                      placeholder="Enter coupon code"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      className="flex-1 h-12"
                      disabled={couponApplied}
                    />
                    <Button
                      variant="outline"
                      className="h-12 lg:w-auto w-full px-6"
                      onClick={applyCoupon}
                      disabled={couponApplied || !couponCode.trim()}
                    >
                      Apply
                    </Button>
                  </div>
                  {couponMessage && (
                    <div className={`mt-3 text-sm ${
                      couponApplied 
                        ? "text-green-600 font-medium" 
                        : "text-red-600"
                     }`}>
                       {couponMessage}
                       {getExpiryWarning() && (
                         <div className="mt-2 text-amber-600 font-medium text-xs bg-amber-50 border border-amber-200 rounded px-2 py-1">
                           {getExpiryWarning()}
                         </div>
                       )}
                       {couponApplied && (
                         <Button
                           variant="outline"
                           size="sm"
                           className="ml-2 h-8"
                          onClick={() => {
                            // Remove free item from cart if it was added
                            if (appliedCoupon?.free_item_id && freeItemAdded) {
                              const freeItemId = `free-${appliedCoupon.free_item_id}`;
                              removeFromCart(freeItemId);
                            }
                            
                            setCouponApplied(false);
                            setAppliedCoupon(null);
                            setCouponMessage("");
                            setFreeItemAdded(false);
                            toast({
                              title: "Coupon Removed",
                              description: "Coupon has been removed from your order.",
                            });
                          }}
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Gift Card Input Section */}
              <div className="mt-4 mb-4">
                <GiftCardInput
                  onGiftCardApplied={(giftCardData) => {
                    setAppliedGiftCard(giftCardData);
                    toast({
                      title: "Gift Card Applied!",
                      description: `Applied £${giftCardData.amount_used} from gift card ${giftCardData.code}`,
                    });
                  }}
                  onGiftCardRemoved={() => {
                    setAppliedGiftCard(null);
                    toast({
                      title: "Gift Card Removed",
                      description: "Gift card has been removed from your order.",
                    });
                  }}
                  appliedGiftCard={appliedGiftCard}
                  totalAmount={getDiscountedTotal()}
                />
              </div>

              {/* Free Order Button for 100% off coupons */}
              {requestedDeliveryDate && user && isCoupon100PercentOff() && (
                <div className="mt-4">
                  <Button
                    onClick={createFreeOrder}
                    className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-semibold"
                  >
                    Complete Free Order
                  </Button>
                </div>
              )}

              {/* Payment Form - Only for authenticated users with payment required */}
              {requestedDeliveryDate && user && clientSecret && !isCoupon100PercentOff() && (
                <div className="mt-4">
                  <Elements key={clientSecret} stripe={stripePromise} options={{ clientSecret }}>
                    <PaymentForm
                      clientSecret={clientSecret}
                      totalAmount={Math.round(getDiscountedTotal() * 100)}
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
                  <Button asChild className="w-full h-12">
                    <Link to="/auth">Create Account / Log In</Link>
                  </Button>
                </div>
              )}
              
              <Button
                variant="outline"
                className="w-full h-12"
                onClick={clearCart}
              >
                Clear Cart
              </Button>
            </CardContent>
          </Card>
         </div>
         
       </div>
       </div>
      
       {/* Single Shared Calendar Popover */}
       <PopoverContent 
         className="w-auto p-0" 
         side="bottom" 
         align={isMobile ? "center" : "start"} 
         sideOffset={4}
       >
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
  );
};

export default Cart;