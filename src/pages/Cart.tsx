import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShoppingBag, ArrowLeft, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useDeliveryLogic } from "@/hooks/useDeliveryLogic";
import { useDiscounts } from "@/hooks/useDiscounts";
import { useDateValidation } from "@/hooks/useDateValidation";
import { useDebounce } from "@/hooks/useDebounce";
import { useAdminOrder } from "@/hooks/useAdminOrder";
import { logger } from "@/lib/logger";
import { getUserFullName, getUserDeliveryAddress } from "@/types/user";
import OrderSummary from "@/components/cart/OrderSummary";
import DeliveryOptions from "@/components/cart/DeliveryOptions";
import DatePicker from "@/components/cart/DatePicker";
import CouponSection from "@/components/cart/CouponSection";
import PaymentSection from "@/components/cart/PaymentSection";
import CartItemCard from "@/components/cart/CartItemCard";
import SubscriptionToggle from "@/components/cart/SubscriptionToggle";
import CustomerNotes from "@/components/cart/CustomerNotes";
import { AdminOrderEnhancements } from "@/components/cart/AdminOrderEnhancements";

const Cart = () => {
  const { items, updateQuantity, removeFromCart, getTotalPrice, addToCart, adminOrderData } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const isAdminMode = searchParams.get('admin_order') === 'true' || adminOrderData;
  
  // Custom hooks for cart logic
  const deliveryLogic = useDeliveryLogic();
  const discounts = useDiscounts();
  const dateValidation = useDateValidation(deliveryLogic.deliveryZone);
  const adminOrder = useAdminOrder();
  
  // State variables
  const [clientSecret, setClientSecret] = useState<string>("");
  const [orderSummaryExpanded, setOrderSummaryExpanded] = useState<boolean>(false);
  const [orderNotes, setOrderNotes] = useState("");
  const [isSubscription, setIsSubscription] = useState(false);
  const [sendEmail, setSendEmail] = useState(adminOrderData?.sendEmail ?? true);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Memoized calculations
  const subtotal = useMemo(() => getTotalPrice(), [getTotalPrice]);
  const fees = useMemo(() => {
    return deliveryLogic.deliveryMethod === "delivery" 
      ? deliveryLogic.deliveryFee 
      : deliveryLogic.getCollectionFee();
  }, [deliveryLogic.deliveryMethod, deliveryLogic.deliveryFee, deliveryLogic.getCollectionFee]);

  const finalTotal = useMemo(() => {
    return discounts.getDiscountedTotal(subtotal, fees);
  }, [subtotal, fees, discounts.getDiscountedTotal]);

  const discountAmount = useMemo(() => {
    return discounts.getDiscountAmount(subtotal, fees);
  }, [subtotal, fees, discounts.getDiscountAmount]);

  const isCoupon100Off = useMemo(() => {
    return discounts.isCoupon100PercentOff(subtotal, fees);
  }, [subtotal, fees, discounts.isCoupon100PercentOff]);

  // Debounced PaymentIntent creation function
  const createPaymentIntentRef = useRef<() => Promise<void>>();
  
  createPaymentIntentRef.current = useCallback(async () => {
    try {
      if (items.length === 0) return;

      // Skip payment intent creation for 100% off coupons
      if (isCoupon100Off) {
        setClientSecret("");
        return;
      }

      // Require date selection before creating PaymentIntent to ensure metadata is correct
      if (!dateValidation.requestedDeliveryDate) {
        setClientSecret("");
        return;
      }

      // Use subscription checkout if subscription is selected
      const functionName = isSubscription ? 'create-subscription-checkout' : 'create-payment-intent';
      const { data, error } = await supabase.functions.invoke(functionName, {
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
          delivery_fee: Math.round(fees * 100),
          delivery_method: deliveryLogic.deliveryMethod,
          collection_point_id: deliveryLogic.deliveryMethod === 'pickup' ? deliveryLogic.selectedCollectionPoint : null,
          requested_delivery_date: dateValidation.requestedDeliveryDate,
          customer_email: user?.email,
          customer_name: getUserFullName(user),
          coupon_code: discounts.couponApplied ? discounts.appliedCoupon?.code : null,
          coupon_data: discounts.couponApplied ? discounts.appliedCoupon : null,
          gift_card_code: discounts.appliedGiftCard?.code || null,
          gift_card_amount_used: discounts.appliedGiftCard?.amount_used || 0,
          gift_card_id: discounts.appliedGiftCard?.gift_card_id || null,
          order_notes: orderNotes.trim() || null,
          adminOrderData: isAdminMode ? adminOrderData : undefined,
        }
      });

      if (error) throw error;
      if (data?.clientSecret) {
        setClientSecret(data.clientSecret);
      }
    } catch (err) {
      logger.error('Auto-create payment intent failed', err);
    }
  }, [
    dateValidation.requestedDeliveryDate, 
    deliveryLogic.deliveryMethod, 
    deliveryLogic.selectedCollectionPoint, 
    deliveryLogic.deliveryZone, 
    items, 
    fees, 
    discounts.couponApplied, 
    discounts.appliedCoupon,
    orderNotes,
    isCoupon100Off,
    user?.email,
    user,
    isSubscription
  ]);

  const debouncedCreatePaymentIntent = useDebounce(useCallback(() => {
    createPaymentIntentRef.current?.();
  }, []), 500);

  // Auto-create Stripe PaymentIntent when requirements are met (debounced)
  useEffect(() => {
    debouncedCreatePaymentIntent();
  }, [
    dateValidation.requestedDeliveryDate, 
    deliveryLogic.deliveryMethod, 
    deliveryLogic.selectedCollectionPoint, 
    deliveryLogic.deliveryZone, 
    items, 
    fees, 
    discounts.couponApplied, 
    discounts.appliedCoupon,
    orderNotes,
    isCoupon100Off,
    isSubscription, // Add isSubscription to trigger payment intent updates
    debouncedCreatePaymentIntent
  ]);

  // Memoized apply coupon function
  const applyCoupon = useCallback(async () => {
    if (!discounts.couponCode.trim()) return;

    try {
      const { data, error } = await supabase.functions.invoke('validate-coupon', {
        body: { 
          code: discounts.couponCode.trim(),
          cart_total: subtotal
        }
      });

      if (error) throw error;

      if (data.valid) {
        discounts.setAppliedCoupon(data.coupon);
        discounts.setCouponApplied(true);
        discounts.setCouponMessage(`Coupon "${discounts.couponCode}" applied successfully!`);
        
        // Check for expiry warning
        discounts.checkExpiryWarning(data.coupon);

        // Add free item if applicable
        if (data.coupon.free_item_id && !discounts.freeItemAdded) {
          try {
            const { data: mealData, error: mealError } = await supabase
              .from('meals')
              .select('*')
              .eq('id', data.coupon.free_item_id)
              .eq('is_active', true)
              .single();

            if (!mealError && mealData) {
              addToCart({
                id: mealData.id,
                name: `${mealData.name} (FREE)`,
                description: mealData.description || '',
                category: mealData.category || '',
                price: 0,
                total_calories: mealData.total_calories || 0,
                total_protein: mealData.total_protein || 0,
                total_carbs: mealData.total_carbs || 0,
                total_fat: mealData.total_fat || 0,
                total_fiber: mealData.total_fiber || 0,
                shelf_life_days: mealData.shelf_life_days || 5,
                image_url: mealData.image_url || '',
              });
              discounts.setFreeItemAdded(true);
              toast({
                title: "Free item added!",
                description: `${mealData.name} has been added to your cart for free.`,
              });
            }
          } catch (freeItemError) {
            logger.error('Error adding free item', freeItemError);
          }
        }

        toast({
          title: "Coupon applied!",
          description: data.message || "Discount applied to your order.",
        });
      } else {
        discounts.setCouponMessage(data.message || "Invalid coupon code");
        toast({
          title: "Invalid coupon",
          description: data.message || "This coupon code is not valid.",
          variant: "destructive",
        });
      }
    } catch (error) {
      logger.error('Error applying coupon', error);
      discounts.setCouponMessage("Failed to apply coupon");
      toast({
        title: "Error",
        description: "Failed to apply coupon. Please try again.",
        variant: "destructive",
      });
    }
  }, [discounts, toast, addToCart]);

  // Memoized create free order for 100% off coupons
  const createFreeOrder = useCallback(async () => {
    // Validate required date field
    if (!dateValidation.requestedDeliveryDate) {
      toast({
        title: "Please select a date",
        description: `Choose a ${deliveryLogic.deliveryMethod === "pickup" ? "collection" : "delivery"} date to continue.`,
        variant: "destructive",
      });
      return;
    }

    try {
      let deliveryFeeToUse = fees;
      
      // Apply free delivery
      if (discounts.appliedCoupon?.free_delivery && deliveryLogic.deliveryMethod === "delivery") {
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
            customer_name: getUserFullName(user),
            requested_delivery_date: dateValidation.requestedDeliveryDate,
            delivery_address: getUserDeliveryAddress(user),
            order_notes: orderNotes.trim() || null,
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

        const { error: selectionsError } = await supabase
          .from('package_meal_selections')
          .insert(packageSelections);

        if (selectionsError) throw selectionsError;
      } else {
        // Handle regular order creation
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .insert({
            user_id: user?.id,
            total_amount: 0,
            currency: 'gbp',
            status: 'confirmed',
            customer_email: user?.email,
            customer_name: getUserFullName(user),
            requested_delivery_date: dateValidation.requestedDeliveryDate,
            delivery_address: getUserDeliveryAddress(user),
            coupon_discount_percentage: discounts.appliedCoupon?.discount_percentage || 0,
            coupon_discount_amount: discounts.appliedCoupon?.discount_amount || 0,
            coupon_free_delivery: discounts.appliedCoupon?.free_delivery || false,
            coupon_free_item_id: discounts.appliedCoupon?.free_item_id,
            order_notes: orderNotes.trim() || null,
          })
          .select()
          .single();

        if (orderError) throw orderError;

        // Create order items
        const orderItems = items.map(item => ({
          order_id: orderData.id,
          meal_id: item.id,
          meal_name: item.name,
          quantity: item.quantity,
          unit_price: item.price,
          total_price: item.price * item.quantity,
        }));

        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItems);

        if (itemsError) throw itemsError;
      }

      toast({
        title: "Order confirmed!",
        description: `Your free ${deliveryLogic.deliveryMethod === "pickup" ? "collection" : "delivery"} is confirmed.`,
      });

      // Clear cart and navigate
      // clearCart(); // Commented out to prevent clearing until navigation
      window.location.href = "/payment-success";
    } catch (error) {
      logger.error('Error creating free order', error);
      toast({
        title: "Error",
        description: "Failed to create order. Please try again.",
        variant: "destructive",
      });
    }
  }, [items, fees, discounts, deliveryLogic, dateValidation, user, orderNotes, getTotalPrice, toast]);

  // Empty cart display
  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center py-12">
          <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
          <p className="text-muted-foreground mb-6">
            Add some delicious meals to get started!
          </p>
          <Button asChild>
            <Link to="/menu">Browse Menu</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl overflow-x-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <Button 
          variant="outline" 
          size="sm" 
          asChild
          className="h-10 px-5 rounded-xl border-border/60 bg-card hover:bg-accent hover:border-primary/30 shadow-sm hover:shadow-md transition-all duration-200"
        >
          <Link to="/menu" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            <span className="font-medium">Continue Shopping</span>
          </Link>
        </Button>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => {
            items.forEach(item => removeFromCart(item.id));
            toast({
              title: "Cart cleared",
              description: "All items have been removed from your cart.",
            });
          }}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Empty Cart
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Admin Order Enhancements */}
          {isAdminMode && (
            <AdminOrderEnhancements
              onPriceOverride={adminOrder.handlePriceOverride}
              onOrderNotesChange={setOrderNotes}
              orderNotes={orderNotes}
              onCashOrderConfirm={async () => {
                await adminOrder.createManualOrder(orderNotes, deliveryLogic.deliveryMethod, dateValidation.requestedDeliveryDate ? new Date(dateValidation.requestedDeliveryDate) : undefined, sendEmail);
              }}
              onPaymentLinkConfirm={async () => {
                await adminOrder.createPaymentLinkOrder(orderNotes, deliveryLogic.deliveryMethod, dateValidation.requestedDeliveryDate ? new Date(dateValidation.requestedDeliveryDate) : undefined, sendEmail, false);
              }}
              onChargeCardConfirm={async (paymentMethodId: string, stripeCustomerId: string) => {
                await adminOrder.chargeCardOrder(orderNotes, deliveryLogic.deliveryMethod, dateValidation.requestedDeliveryDate ? new Date(dateValidation.requestedDeliveryDate) : undefined, paymentMethodId, stripeCustomerId, sendEmail);
              }}
              onNewCardPaymentSuccess={async (paymentIntentId: string) => {
                await adminOrder.completeNewCardOrder(paymentIntentId, orderNotes, deliveryLogic.deliveryMethod, dateValidation.requestedDeliveryDate ? new Date(dateValidation.requestedDeliveryDate) : undefined, sendEmail);
              }}
              totalAmount={adminOrder.calculateTotalWithOverrides()}
              finalTotal={adminOrder.calculateUnifiedTotal(fees)}
              loading={adminOrder.loading}
              priceOverrides={adminOrder.priceOverrides}
              onResetAllPrices={adminOrder.resetAllPrices}
              deliveryFees={fees}
              sendEmail={sendEmail}
              onSendEmailChange={setSendEmail}
              adminPaymentIntent={adminOrder.adminPaymentIntent}
              saveCardToFile={adminOrder.saveCardToFile}
              onSaveCardChange={adminOrder.setSaveCardToFile}
              onPrepareNewCardPayment={adminOrder.createAdminPaymentIntent}
              onClearPaymentIntent={adminOrder.clearAdminPaymentIntent}
              hasSelectedDate={!!dateValidation.requestedDeliveryDate}
            />
          )}

          {/* Cart Items */}
          <div className="space-y-4">
            {items.map((item) => (
              <CartItemCard
                key={item.id}
                item={item}
                onUpdateQuantity={updateQuantity}
                onRemove={removeFromCart}
              />
            ))}
          </div>

          {/* Delivery Options */}
          <DeliveryOptions
            deliveryMethod={deliveryLogic.deliveryMethod}
            onDeliveryMethodChange={deliveryLogic.setDeliveryMethod}
            selectedCollectionPoint={deliveryLogic.selectedCollectionPoint}
            onCollectionPointChange={deliveryLogic.setSelectedCollectionPoint}
            collectionPoints={deliveryLogic.collectionPoints}
            manualPostcode={deliveryLogic.manualPostcode}
            onPostcodeChange={deliveryLogic.handlePostcodeChange}
            deliveryZone={deliveryLogic.deliveryZone}
            postcodeChecked={deliveryLogic.postcodeChecked}
            deliveryFee={deliveryLogic.deliveryFee}
            getCollectionFee={deliveryLogic.getCollectionFee}
          />

          {/* Date Picker */}
          <DatePicker
            requestedDeliveryDate={dateValidation.requestedDeliveryDate}
            onDateChange={dateValidation.setRequestedDeliveryDate}
            calendarOpen={dateValidation.calendarOpen}
            onCalendarOpenChange={dateValidation.setCalendarOpen}
            deliveryMethod={deliveryLogic.deliveryMethod}
            isDateAvailable={dateValidation.isDateAvailable}
            isDateDisabled={dateValidation.isDateDisabled}
            getMinDeliveryDate={dateValidation.getMinDeliveryDate}
          />

          {/* Subscription Toggle */}
          <SubscriptionToggle
            isSubscription={isSubscription}
            onToggle={setIsSubscription}
          />

          {/* Customer Order Notes */}
          <CustomerNotes
            value={orderNotes}
            onChange={setOrderNotes}
          />

          {/* Coupons & Gift Cards */}
          <CouponSection
            couponCode={discounts.couponCode}
            onCouponCodeChange={discounts.setCouponCode}
            couponMessage={discounts.couponMessage}
            onCouponMessageChange={discounts.setCouponMessage}
            couponApplied={discounts.couponApplied}
            onCouponAppliedChange={discounts.setCouponApplied}
            appliedCoupon={discounts.appliedCoupon}
            onAppliedCouponChange={discounts.setAppliedCoupon}
            freeItemAdded={discounts.freeItemAdded}
            onFreeItemAddedChange={discounts.setFreeItemAdded}
            appliedGiftCard={discounts.appliedGiftCard}
            onAppliedGiftCardChange={discounts.setAppliedGiftCard}
            checkExpiryWarning={discounts.checkExpiryWarning}
            cartTotal={subtotal}
          />
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Order Summary */}
          <OrderSummary
            items={items}
            subtotal={subtotal}
            fees={fees}
            discountAmount={discountAmount}
            discountDisplay={discounts.getDiscountDisplay}
            giftCardAmount={discounts.appliedGiftCard?.amount_used || 0}
            finalTotal={finalTotal}
            expanded={true}
            onToggleExpanded={undefined}
            isMobile={false}
            expiryWarning={discounts.getExpiryWarning}
            isSubscription={isSubscription}
            isAdminMode={!!isAdminMode}
            adminPriceOverrides={adminOrder.priceOverrides}
            adminTotalOverride={adminOrder.totalOverride}
            onAdminTotalChange={adminOrder.handleTotalOverride}
          />

          {/* Payment Section */}
          <PaymentSection
            user={user}
            clientSecret={clientSecret}
            finalTotal={finalTotal}
            deliveryMethod={deliveryLogic.deliveryMethod}
            requestedDeliveryDate={dateValidation.requestedDeliveryDate ? new Date(dateValidation.requestedDeliveryDate) : null}
            isCoupon100PercentOff={isCoupon100Off}
            onCreateFreeOrder={createFreeOrder}
            orderNotes={orderNotes}
            onOrderNotesChange={setOrderNotes}
            hasSelectedDate={!!dateValidation.requestedDeliveryDate}
            customerName={getUserFullName(user) || ''}
            customerEmail={user?.email || ''}
          />
        </div>
      </div>
    </div>
  );
};

export default Cart;