import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  console.log('[create-order-from-payment] Function invoked', {
    method: req.method,
    url: req.url,
    timestamp: new Date().toISOString()
  });

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
    
    // Extract fulfillment data from metadata (passed from checkout)
    const fulfillmentMethod = metadata.fulfillment_method || 'delivery';
    const collectionPointId = metadata.collection_point_id || null;
    const deliveryZoneId = metadata.delivery_zone_id || null;
    
    console.log('[create-order-from-payment] Fulfillment data from metadata:', {
      fulfillmentMethod,
      collectionPointId,
      deliveryZoneId
    });
    
    // Check if this is a package order
    const hasPackageItems = items.some((item: any) => item.type === 'package');

    // ============ IDEMPOTENCY CHECK ============
    // Check if an order already exists for this payment intent
    if (hasPackageItems) {
      const { data: existingPackageOrder, error: checkError } = await supabaseClient
        .from('package_orders')
        .select('*')
        .eq('stripe_payment_intent_id', payment_intent_id)
        .maybeSingle();
      
      if (checkError) {
        console.error('[create-order-from-payment] Error checking existing package order:', checkError);
      }
      
      if (existingPackageOrder) {
        console.log('[create-order-from-payment] Idempotent return - package order already exists:', existingPackageOrder.id);
        
        // Fetch meal selections for item count
        const { data: selections } = await supabaseClient
          .from('package_meal_selections')
          .select('quantity')
          .eq('package_order_id', existingPackageOrder.id);
        
        const itemCount = selections?.reduce((sum, s) => sum + (s.quantity || 1), 0) || 0;
        
        return new Response(JSON.stringify({ 
          success: true,
          idempotent: true,
          orderId: existingPackageOrder.id,
          orderNumber: existingPackageOrder.id.substring(0, 8).toUpperCase(),
          totalAmount: existingPackageOrder.total_amount,
          currency: existingPackageOrder.currency,
          requestedDeliveryDate: existingPackageOrder.requested_delivery_date,
          deliveryAddress: existingPackageOrder.delivery_address,
          customerEmail: existingPackageOrder.customer_email || user.email || '',
          customerName: existingPackageOrder.customer_name || '',
          orderType: 'package',
          itemCount,
          fulfillmentMethod: existingPackageOrder.fulfillment_method,
          message: 'Package order already exists for this payment'
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
    } else {
      const { data: existingOrder, error: checkError } = await supabaseClient
        .from('orders')
        .select('*')
        .eq('stripe_payment_intent_id', payment_intent_id)
        .maybeSingle();
      
      if (checkError) {
        console.error('[create-order-from-payment] Error checking existing order:', checkError);
      }
      
      if (existingOrder) {
        console.log('[create-order-from-payment] Idempotent return - order already exists:', existingOrder.id);
        
        // Fetch order items for item count
        const { data: orderItems } = await supabaseClient
          .from('order_items')
          .select('quantity')
          .eq('order_id', existingOrder.id);
        
        const itemCount = orderItems?.reduce((sum, item) => sum + item.quantity, 0) || 0;
        
        return new Response(JSON.stringify({ 
          success: true,
          idempotent: true,
          orderId: existingOrder.id,
          orderNumber: existingOrder.id.substring(0, 8).toUpperCase(),
          totalAmount: existingOrder.total_amount,
          currency: existingOrder.currency,
          requestedDeliveryDate: existingOrder.requested_delivery_date,
          deliveryAddress: existingOrder.delivery_address,
          customerEmail: existingOrder.customer_email || user.email || '',
          customerName: existingOrder.customer_name || '',
          orderType: 'individual',
          itemCount,
          fulfillmentMethod: existingOrder.fulfillment_method,
          message: 'Order already exists for this payment'
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
    }
    // ============ END IDEMPOTENCY CHECK ============

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

      // Insert with conflict handling for race conditions
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
          stripe_payment_intent_id: payment_intent_id,
          order_notes: metadata.order_notes || null,
          // New fulfillment fields
          fulfillment_method: fulfillmentMethod,
          collection_point_id: fulfillmentMethod === 'collection' ? collectionPointId : null,
          delivery_zone_id: fulfillmentMethod === 'delivery' ? deliveryZoneId : null,
        })
        .select()
        .single();

      // Handle unique constraint violation (race condition)
      if (packageOrderError?.code === '23505') {
        console.log('[create-order-from-payment] Race condition detected, fetching existing package order');
        const { data: existingOrder } = await supabaseClient
          .from('package_orders')
          .select('*')
          .eq('stripe_payment_intent_id', payment_intent_id)
          .single();
        
        if (existingOrder) {
          const { data: selections } = await supabaseClient
            .from('package_meal_selections')
            .select('quantity')
            .eq('package_order_id', existingOrder.id);
          
          const itemCount = selections?.reduce((sum, s) => sum + (s.quantity || 1), 0) || 0;
          
          return new Response(JSON.stringify({ 
            success: true,
            idempotent: true,
            orderId: existingOrder.id,
            orderNumber: existingOrder.id.substring(0, 8).toUpperCase(),
            totalAmount: existingOrder.total_amount,
            currency: existingOrder.currency,
            requestedDeliveryDate: existingOrder.requested_delivery_date,
            deliveryAddress: existingOrder.delivery_address,
            customerEmail: existingOrder.customer_email || user.email || '',
            customerName: existingOrder.customer_name || '',
            orderType: 'package',
            itemCount,
            fulfillmentMethod: existingOrder.fulfillment_method,
            message: 'Package order already exists for this payment'
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          });
        }
      }

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

      // Send admin notification for new order
      try {
        await supabaseClient.functions.invoke('send-admin-notification', {
          body: {
            type: 'new_order',
            orderId: packageOrderData.id,
            orderNumber: packageOrderData.id.substring(0, 8).toUpperCase(),
            customerName: packageOrderData.customer_name || metadata.customer_name || '',
            customerEmail: packageOrderData.customer_email || user.email || '',
            totalAmount: finalAmount / 100,
            itemCount: Object.values(packageItem.packageData.selectedMeals).reduce((sum: number, qty: any) => sum + qty, 0),
            deliveryDate: packageOrderData.requested_delivery_date,
            deliveryAddress: packageOrderData.delivery_address,
            orderNotes: packageOrderData.order_notes,
            orderType: 'package',
            fulfillmentMethod: fulfillmentMethod
          }
        });
        console.log('Admin notification sent for package order:', packageOrderData.id);
      } catch (notifyError) {
        console.error('Failed to send admin notification:', notifyError);
        // Don't fail the order if notification fails
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
        fulfillment_method: fulfillmentMethod,
        collection_point_id: collectionPointId,
        delivery_zone_id: deliveryZoneId,
      });

      // Insert with conflict handling for race conditions
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
          stripe_payment_intent_id: payment_intent_id,
          order_notes: metadata.order_notes || null,
          // New fulfillment fields
          fulfillment_method: fulfillmentMethod,
          collection_point_id: fulfillmentMethod === 'collection' ? collectionPointId : null,
          delivery_zone_id: fulfillmentMethod === 'delivery' ? deliveryZoneId : null,
        })
        .select()
        .single();

      // Handle unique constraint violation (race condition)
      if (orderError?.code === '23505') {
        console.log('[create-order-from-payment] Race condition detected, fetching existing order');
        const { data: existingOrder } = await supabaseClient
          .from('orders')
          .select('*')
          .eq('stripe_payment_intent_id', payment_intent_id)
          .single();
        
        if (existingOrder) {
          const { data: orderItems } = await supabaseClient
            .from('order_items')
            .select('quantity')
            .eq('order_id', existingOrder.id);
          
          const itemCount = orderItems?.reduce((sum, item) => sum + item.quantity, 0) || 0;
          
          return new Response(JSON.stringify({ 
            success: true,
            idempotent: true,
            orderId: existingOrder.id,
            orderNumber: existingOrder.id.substring(0, 8).toUpperCase(),
            totalAmount: existingOrder.total_amount,
            currency: existingOrder.currency,
            requestedDeliveryDate: existingOrder.requested_delivery_date,
            deliveryAddress: existingOrder.delivery_address,
            customerEmail: existingOrder.customer_email || user.email || '',
            customerName: existingOrder.customer_name || '',
            orderType: 'individual',
            itemCount,
            fulfillmentMethod: existingOrder.fulfillment_method,
            message: 'Order already exists for this payment'
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          });
        }
      }

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
      itemCount = orderItems.reduce((sum: number, item: any) => sum + item.quantity, 0);
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

      // Send admin notification for new order
      try {
        await supabaseClient.functions.invoke('send-admin-notification', {
          body: {
            type: 'new_order',
            orderId: orderData.id,
            orderNumber: orderData.id.substring(0, 8).toUpperCase(),
            customerName: orderData.customer_name || metadata.customer_name || '',
            customerEmail: orderData.customer_email || user.email || '',
            totalAmount: finalAmount / 100,
            itemCount: orderItems.reduce((sum: number, item: any) => sum + item.quantity, 0),
            deliveryDate: orderData.requested_delivery_date,
            deliveryAddress: orderData.delivery_address,
            orderNotes: orderData.order_notes,
            orderType: 'individual',
            fulfillmentMethod: fulfillmentMethod
          }
        });
        console.log('Admin notification sent for order:', orderData.id);
      } catch (notifyError) {
        console.error('Failed to send admin notification:', notifyError);
        // Don't fail the order if notification fails
      }
    }

    // Return success response
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
      fulfillmentMethod,
      message: 'Order created successfully'
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error: any) {
    console.error('[create-order-from-payment] Error:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Failed to create order'
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
