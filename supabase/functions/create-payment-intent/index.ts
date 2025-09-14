import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PaymentItem {
  name: string;
  amount?: number; // minor units (e.g., pence)
  price?: number;  // decimal price (e.g., 9.99)
  quantity: number;
  description?: string;
  meal_id?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const {
      items = [],
      currency = "gbp",
      delivery_fee,
      delivery_method,
      collection_point_id,
      requested_delivery_date,
      production_date,
      customer_email,
      customer_name,
      coupon_code,
      coupon_data,
      discount_percentage,
    } = await req.json().catch(() => ({ items: [] }));

    if (!Array.isArray(items) || items.length === 0) {
      return new Response(JSON.stringify({ error: "No items provided" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Calculate total amount
    let totalAmount = 0;
    
    items.forEach((item: PaymentItem) => {
      const unitAmount = typeof item.amount === "number" ? Math.round(item.amount) : Math.round((item.price ?? 0) * 100);
      totalAmount += unitAmount * (item.quantity ?? 1);
    });

    // Add delivery fee
    if (typeof delivery_fee === "number" && delivery_fee > 0) {
      totalAmount += Math.round(delivery_fee);
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

    // Create Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmount,
      currency,
      automatic_payment_methods: { enabled: true },
      description: requested_delivery_date ? deliveryInfo : undefined,
        metadata: {
        delivery_method: delivery_method || '',
        collection_point_id: collection_point_id || '',
        requested_delivery_date: requested_delivery_date || '',
        production_date: production_date || '',
        customer_email: customer_email || '',
        customer_name: customer_name || '',
        coupon_code: coupon_code || '',
        discount_percentage: discount_percentage?.toString() || '0',
        coupon_type: coupon_data?.discount_amount ? 'fixed_amount' : 
                   coupon_data?.free_delivery ? 'free_delivery' : 
                   coupon_data?.free_item_id ? 'free_item' : 'percentage',
        coupon_discount_amount: coupon_data?.discount_amount?.toString() || '0',
        coupon_discount_percentage: discount_percentage?.toString() || '0',
        coupon_free_delivery: coupon_data?.free_delivery?.toString() || 'false',
        coupon_free_item_id: coupon_data?.free_item_id || '',
        items: JSON.stringify(items.map(item => ({
          meal_id: item.meal_id,
          name: item.name,
          quantity: item.quantity,
          amount: typeof item.amount === "number" ? item.amount : Math.round((item.price ?? 0) * 100)
        }))),
      },
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
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});