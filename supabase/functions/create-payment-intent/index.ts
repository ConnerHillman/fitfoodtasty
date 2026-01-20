import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation and sanitization helpers
function sanitizeString(input: unknown, maxLength: number = 255): string {
  if (typeof input !== 'string') return '';
  // Trim, truncate, and remove dangerous characters
  return input.trim().slice(0, maxLength).replace(/[<>]/g, '');
}

function sanitizeEmail(input: unknown): string {
  if (typeof input !== 'string') return '';
  const email = input.trim().toLowerCase().slice(0, 255);
  // Basic email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) ? email : '';
}

function validatePositiveNumber(input: unknown): number {
  if (typeof input === 'number' && !isNaN(input) && isFinite(input) && input >= 0) {
    return input;
  }
  if (typeof input === 'string') {
    const parsed = parseFloat(input);
    if (!isNaN(parsed) && isFinite(parsed) && parsed >= 0) {
      return parsed;
    }
  }
  return 0;
}

function validateInteger(input: unknown, min: number = 1, max: number = 1000): number {
  if (typeof input === 'number' && Number.isInteger(input) && input >= min && input <= max) {
    return input;
  }
  return min;
}

interface PaymentItem {
  name: string;
  amount?: number;
  price?: number;
  quantity: number;
  description?: string;
  meal_id?: string;
}

interface AdminOrderData {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryAddress: string;
  postcode: string;
  deliveryZoneId?: string;
  isNewAccount?: boolean;
}

function validateAndSanitizeItems(items: unknown): PaymentItem[] {
  if (!Array.isArray(items)) return [];
  
  // Limit to 100 items max
  const limitedItems = items.slice(0, 100);
  
  return limitedItems
    .filter((item): item is Record<string, unknown> => 
      typeof item === 'object' && item !== null
    )
    .map(item => ({
      name: sanitizeString(item.name, 100) || 'Item',
      amount: typeof item.amount === 'number' ? Math.round(Math.max(0, item.amount)) : undefined,
      price: typeof item.price === 'number' ? Math.max(0, item.price) : undefined,
      quantity: validateInteger(item.quantity, 1, 100),
      description: sanitizeString(item.description, 500),
      meal_id: sanitizeString(item.meal_id, 50),
    }))
    .filter(item => item.name && (item.amount !== undefined || item.price !== undefined));
}

function validateAdminOrderData(data: unknown): AdminOrderData | null {
  if (typeof data !== 'object' || data === null) return null;
  
  const adminData = data as Record<string, unknown>;
  return {
    customerName: sanitizeString(adminData.customerName, 100),
    customerEmail: sanitizeEmail(adminData.customerEmail),
    customerPhone: sanitizeString(adminData.customerPhone, 20),
    deliveryAddress: sanitizeString(adminData.deliveryAddress, 500),
    postcode: sanitizeString(adminData.postcode, 15),
    deliveryZoneId: sanitizeString(adminData.deliveryZoneId, 50) || undefined,
    isNewAccount: typeof adminData.isNewAccount === 'boolean' ? adminData.isNewAccount : false,
  };
}

serve(async (req) => {
  console.log('[create-payment-intent] Function invoked', {
    method: req.method,
    url: req.url,
    timestamp: new Date().toISOString()
  });

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    // Parse request body with error handling
    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid request body" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Validate and sanitize all inputs
    const items = validateAndSanitizeItems(body.items);
    const currency = sanitizeString(body.currency, 3) || "gbp";
    const delivery_fee = validatePositiveNumber(body.delivery_fee);
    const delivery_method = sanitizeString(body.delivery_method, 20);
    const collection_point_id = sanitizeString(body.collection_point_id, 50);
    const requested_delivery_date = sanitizeString(body.requested_delivery_date, 20);
    const customer_email = sanitizeEmail(body.customer_email);
    const customer_name = sanitizeString(body.customer_name, 100);
    const coupon_code = sanitizeString(body.coupon_code, 50);
    const discount_percentage = validatePositiveNumber(body.discount_percentage);
    const order_notes = sanitizeString(body.order_notes, 1000);
    const adminOrderData = validateAdminOrderData(body.adminOrderData);

    // Validate coupon_data if present
    const coupon_data = typeof body.coupon_data === 'object' && body.coupon_data !== null
      ? body.coupon_data as Record<string, unknown>
      : null;

    if (items.length === 0) {
      return new Response(JSON.stringify({ error: "No valid items provided" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Calculate total amount with validated inputs
    let totalAmount = 0;
    
    items.forEach((item: PaymentItem) => {
      const unitAmount = typeof item.amount === "number" ? Math.round(item.amount) : Math.round((item.price ?? 0) * 100);
      totalAmount += unitAmount * (item.quantity ?? 1);
    });

    // Add delivery fee
    if (delivery_fee > 0) {
      totalAmount += Math.round(delivery_fee);
    }

    // Validate total amount is reasonable (£0.30 to £100,000)
    if (totalAmount < 30 || totalAmount > 10000000) {
      return new Response(JSON.stringify({ error: "Invalid order amount" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Format the delivery date for display
    const formattedDeliveryDate = requested_delivery_date 
      ? new Date(requested_delivery_date + 'T12:00:00').toLocaleDateString('en-GB', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      : '';

    const deliveryInfo = delivery_method === 'pickup' 
      ? `🗓️🗓️🗓️ COLLECTION DATE 🗓️🗓️🗓️\n\n🔥 ${formattedDeliveryDate.toUpperCase()} 🔥`
      : `🚚🚚🚚 DELIVERY DATE 🚚🚚🚚\n\n🔥 ${formattedDeliveryDate.toUpperCase()} 🔥`;

    console.log('Creating Payment Intent:', {
      amount: totalAmount,
      currency,
      delivery_method,
      requested_delivery_date,
      formattedDeliveryDate,
      deliveryInfo
    });

    // Create comprehensive metadata for the payment intent (all sanitized)
    const metadata: Record<string, string> = {
      delivery_method: delivery_method || '',
      collection_point_id: collection_point_id || '',
      requested_delivery_date: requested_delivery_date || '',
      customer_email: customer_email || '',
      customer_name: customer_name || '',
      coupon_code: coupon_code || '',
      discount_percentage: discount_percentage.toString(),
      coupon_type: coupon_data?.discount_amount ? 'fixed_amount' : 
                 coupon_data?.free_delivery ? 'free_delivery' : 
                 coupon_data?.free_item_id ? 'free_item' : 'percentage',
      coupon_discount_amount: validatePositiveNumber(coupon_data?.discount_amount).toString(),
      coupon_discount_percentage: discount_percentage.toString(),
      coupon_free_delivery: coupon_data?.free_delivery === true ? 'true' : 'false',
      coupon_free_item_id: sanitizeString(coupon_data?.free_item_id, 50) || '',
      items: JSON.stringify(items.map(item => ({
        meal_id: item.meal_id,
        name: item.name,
        quantity: item.quantity,
        amount: typeof item.amount === "number" ? item.amount : Math.round((item.price ?? 0) * 100)
      }))),
      order_notes: order_notes || '',
    };

    // Add admin order metadata if present (all sanitized)
    if (adminOrderData) {
      metadata.is_admin_order = 'true';
      metadata.admin_customer_name = adminOrderData.customerName;
      metadata.admin_customer_email = adminOrderData.customerEmail;
      metadata.admin_customer_phone = adminOrderData.customerPhone || '';
      metadata.admin_delivery_address = adminOrderData.deliveryAddress || '';
      metadata.admin_postcode = adminOrderData.postcode;
      metadata.admin_delivery_zone_id = adminOrderData.deliveryZoneId || '';
      metadata.admin_create_account = adminOrderData.isNewAccount ? 'true' : 'false';
    }

    // Create Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmount,
      currency,
      automatic_payment_methods: { enabled: true },
      description: requested_delivery_date ? deliveryInfo : undefined,
      metadata,
    });

    return new Response(JSON.stringify({ 
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[create-payment-intent] Error:", message);
    return new Response(JSON.stringify({ error: "Payment processing failed" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});