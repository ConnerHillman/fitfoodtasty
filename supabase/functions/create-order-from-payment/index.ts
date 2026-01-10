import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get Stripe secret key
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get authentication token
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.id) throw new Error("User not authenticated");

    // Fetch user profile for accurate delivery address
    const { data: profileData } = await supabaseClient
      .from('profiles')
      .select('delivery_address, full_name, phone, city, postal_code, delivery_instructions')
      .eq('user_id', user.id)
      .single();
    
    // Build full delivery address from profile
    const profileDeliveryAddress = profileData?.delivery_address 
      ? [
          profileData.delivery_address,
          profileData.city,
          profileData.postal_code
        ].filter(Boolean).join(', ')
      : user.user_metadata?.delivery_address || null;

    // Get payment intent ID from request
    const { payment_intent_id } = await req.json();
    if (!payment_intent_id) throw new Error("Payment intent ID is required");

    // Initialize Stripe
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id);
    
    if (paymentIntent.status !== "succeeded") {
      throw new Error("Payment has not succeeded");
    }

    // Extract metadata
    const metadata = paymentIntent.metadata;
    const items = JSON.parse(metadata.items || "[]");
    const discountPercentage = parseFloat(metadata.discount_percentage || "0");
    const couponData = metadata.coupon_type ? {
      code: metadata.coupon_code || '',
      discount_type: metadata.coupon_type,
      discount_amount: parseFloat(metadata.discount_amount || '0'),
      free_delivery: metadata.free_delivery === 'true',
      free_item_id: metadata.free_item_id || null,
    } : null;
    
    // Calculate amounts
    const originalAmount = paymentIntent.amount; // in cents
    const discountAmount = discountPercentage > 0 ? Math.round((originalAmount * discountPercentage) / 100) : 0;
    const finalAmount = originalAmount; // Stripe already processed the discounted amount
    
    // Handle gift card redemption if present
    const giftCardCode = metadata.gift_card_code;
    const giftCardAmountUsed = parseFloat(metadata.gift_card_amount_used || '0');
    const giftCardId = metadata.gift_card_id;
    
    if (giftCardCode && giftCardId && giftCardAmountUsed > 0) {
      // Redeem the gift card
      const { error: redeemError } = await supabaseClient.functions.invoke('redeem-gift-card', {
        body: {
          code: giftCardCode,
          amount_to_use: giftCardAmountUsed,
          user_id: user.id,
          order_id: null // Will be updated later
        }
      });
      
      if (redeemError) {
        console.error('Failed to redeem gift card:', redeemError);
        throw new Error('Failed to redeem gift card');
      }
    }

    // Check if this is a package order
    const hasPackageItems = items.some((item: any) => item.type === 'package');
    
    // Variables to store order data for response
    let createdOrderId: string;
    let orderType: 'package' | 'individual';
    let itemCount: number;
    let customerEmail: string;
    let customerName: string;
    let deliveryAddress: string | null;
    let requestedDeliveryDate: string | null;

    if (hasPackageItems) {
      // Handle package order creation
      const packageItem = items.find((item: any) => item.type === 'package');
      if (!packageItem?.packageData) {
        throw new Error('Package data not found');
      }

      const { data: packageOrderData, error: packageOrderError } = await supabaseClient
        .from('package_orders')
        .insert({
          user_id: user.id,
          package_id: packageItem.packageData.packageId,
          total_amount: finalAmount / 100, // Convert back to dollars
          currency: paymentIntent.currency,
          status: 'confirmed',
          customer_email: metadata.customer_email || user.email,
          customer_name: metadata.customer_name || null,
          requested_delivery_date: metadata.requested_delivery_date || null,
          production_date: metadata.production_date || null,
          delivery_address: profileDeliveryAddress,
          stripe_session_id: payment_intent_id,
          order_notes: metadata.order_notes || null,
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
      if (couponData?.free_item_id) {
        packageSelections.push({
          package_order_id: packageOrderData.id,
          meal_id: couponData.free_item_id,
          quantity: 1,
        });
      }

      const { error: selectionsError } = await supabaseClient
        .from('package_meal_selections')
        .insert(packageSelections);

      if (selectionsError) throw selectionsError;

      console.log('Package order created successfully:', packageOrderData.id);
      
      // Store order data for response
      createdOrderId = packageOrderData.id;
      orderType = 'package';
      itemCount = Object.values(packageItem.packageData.selectedMeals).reduce((sum: number, qty: any) => sum + qty, 0);
      customerEmail = packageOrderData.customer_email || user.email || '';
      customerName = packageOrderData.customer_name || '';
      deliveryAddress = packageOrderData.delivery_address;
      requestedDeliveryDate = packageOrderData.requested_delivery_date;
      
      // Update gift card transaction with order ID if gift card was used
      if (giftCardId && giftCardAmountUsed > 0) {
        const { error: updateError } = await supabaseClient
          .from('gift_card_transactions')
          .update({ order_id: packageOrderData.id })
          .eq('gift_card_id', giftCardId)
          .eq('amount_used', giftCardAmountUsed)
          .eq('user_id', user.id)
          .is('order_id', null)
          .order('created_at', { ascending: false })
          .limit(1);
          
        if (updateError) {
          console.error('Failed to update gift card transaction with order ID:', updateError);
        }
      }

      // Send order confirmation email
      try {
        await supabaseClient.functions.invoke('send-order-confirmation', {
          body: {
            orderId: packageOrderData.id,
            orderType: 'package'
          }
        });
        console.log('Order confirmation email triggered for package order:', packageOrderData.id);
      } catch (emailError) {
        console.error('Failed to trigger order confirmation email:', emailError);
        // Don't fail the order if email fails
      }

    } else {
      // Handle regular order creation
      // Normalize empty strings to null for date fields
      const normalizedRequestedDeliveryDate = metadata.requested_delivery_date && metadata.requested_delivery_date !== '' 
        ? metadata.requested_delivery_date 
        : null;
      const normalizedProductionDate = metadata.production_date && metadata.production_date !== '' 
        ? metadata.production_date 
        : null;

      console.log('[create-order-from-payment] Creating order with data:', {
        user_id: user.id,
        total_amount: finalAmount / 100,
        discount_amount: discountAmount / 100,
        currency: paymentIntent.currency,
        status: 'confirmed',
        customer_email: metadata.customer_email || user.email,
        customer_name: metadata.customer_name || null,
        requested_delivery_date: normalizedRequestedDeliveryDate,
        production_date: normalizedProductionDate,
        delivery_address: profileDeliveryAddress,
      });

      const { data: orderData, error: orderError } = await supabaseClient
        .from('orders')
        .insert({
          user_id: user.id,
          total_amount: finalAmount / 100,
          discount_amount: discountAmount / 100,
          currency: paymentIntent.currency,
          status: 'confirmed',
          customer_email: metadata.customer_email || user.email,
          customer_name: metadata.customer_name || null,
          requested_delivery_date: normalizedRequestedDeliveryDate,
          production_date: normalizedProductionDate,
          delivery_address: profileDeliveryAddress,
          referral_code_used: metadata.coupon_code || null,
          coupon_type: metadata.coupon_type || null,
          coupon_discount_percentage: parseFloat(metadata.coupon_discount_percentage || '0'),
          coupon_discount_amount: parseFloat(metadata.coupon_discount_amount || '0'),
          coupon_free_delivery: metadata.coupon_free_delivery === 'true',
          coupon_free_item_id: metadata.coupon_free_item_id || null,
          stripe_session_id: payment_intent_id,
          order_notes: metadata.order_notes || null,
        })
        .select()
        .single();

      if (orderError) {
        console.error('[create-order-from-payment] Order insert error:', orderError);
        throw orderError;
      }

      // Create order items (excluding free items that are already in cart)
      const orderItems = items
        .filter((item: any) => !item.meal_id?.startsWith('free-'))
        .map((item: any) => ({
          order_id: orderData.id,
          meal_id: item.meal_id,
          meal_name: item.name,
          quantity: item.quantity,
          unit_price: item.amount / 100, // Convert from cents
          total_price: (item.amount * item.quantity) / 100,
        }));

      // Add free item as separate order item if applicable
      if (couponData?.free_item_id) {
        try {
          const { data: freeItemData, error: freeItemError } = await supabaseClient
            .from('meals')
            .select('name')
            .eq('id', couponData.free_item_id)
            .single();

          if (!freeItemError && freeItemData) {
            orderItems.push({
              order_id: orderData.id,
              meal_id: couponData.free_item_id,
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

      const { error: itemsError } = await supabaseClient
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      console.log('Order created successfully:', orderData.id);
      
      // Store order data for response
      createdOrderId = orderData.id;
      orderType = 'individual';
      itemCount = items.reduce((sum: number, item: any) => sum + item.quantity, 0);
      customerEmail = orderData.customer_email || user.email || '';
      customerName = orderData.customer_name || '';
      deliveryAddress = orderData.delivery_address;
      requestedDeliveryDate = orderData.requested_delivery_date;
      
      // Update gift card transaction with order ID if gift card was used
      if (giftCardId && giftCardAmountUsed > 0) {
        const { error: updateError } = await supabaseClient
          .from('gift_card_transactions')
          .update({ order_id: orderData.id })
          .eq('gift_card_id', giftCardId)
          .eq('amount_used', giftCardAmountUsed)
          .eq('user_id', user.id)
          .is('order_id', null)
          .order('created_at', { ascending: false })
          .limit(1);
          
        if (updateError) {
          console.error('Failed to update gift card transaction with order ID:', updateError);
        }
      }

      // Send order confirmation email
      try {
        await supabaseClient.functions.invoke('send-order-confirmation', {
          body: {
            orderId: orderData.id,
            orderType: 'individual'
          }
        });
        console.log('Order confirmation email triggered for order:', orderData.id);
      } catch (emailError) {
        console.error('Failed to trigger order confirmation email:', emailError);
        // Don't fail the order if email fails
      }
    }

    // Return enhanced order data
    return new Response(JSON.stringify({ 
      success: true, 
      orderId: createdOrderId,
      orderNumber: createdOrderId.substring(0, 8).toUpperCase(),
      totalAmount: finalAmount / 100,
      currency: paymentIntent.currency,
      requestedDeliveryDate,
      deliveryAddress,
      customerEmail,
      customerName,
      orderType,
      itemCount,
      message: orderType === 'package' ? 'Package order created successfully' : 'Order created successfully'
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error: any) {
    // Better error handling to capture all error types
    let message: string;
    if (error instanceof Error) {
      message = error.message;
    } else if (typeof error === 'object' && error !== null) {
      message = JSON.stringify(error);
    } else {
      message = String(error);
    }
    console.error("[create-order-from-payment] Error:", message);
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
