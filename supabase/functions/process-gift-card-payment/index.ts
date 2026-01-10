import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    console.log("Processing gift card payment...");
    
    const { session_id } = await req.json();

    if (!session_id) {
      throw new Error("Session ID is required");
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ['payment_intent']
    });

    console.log("Session retrieved:", session.id, session.payment_status);

    if (session.payment_status !== 'paid') {
      throw new Error("Payment not completed");
    }

    const metadata = session.metadata;
    if (!metadata || metadata.type !== 'gift_card') {
      throw new Error("Invalid session metadata");
    }

    // Check if gift card already exists
    const { data: existingCard } = await supabaseClient
      .from('gift_cards')
      .select('id')
      .eq('stripe_payment_intent_id', session.payment_intent.id)
      .single();

    if (existingCard) {
      console.log("Gift card already exists for this payment");
      return new Response(JSON.stringify({ 
        success: true, 
        gift_card_id: existingCard.id,
        message: "Gift card already created" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Generate unique gift card code
    const { data: codeResult, error: codeError } = await supabaseClient
      .rpc('generate_gift_card_code');

    if (codeError) {
      throw new Error("Failed to generate gift card code");
    }

    const giftCardCode = codeResult;
    const amount = parseFloat(metadata.amount);
    const isGift = metadata.is_gift === 'true';

    console.log("Creating gift card with code:", giftCardCode);

    // Create gift card record
    const { data: giftCard, error: createError } = await supabaseClient
      .from('gift_cards')
      .insert({
        code: giftCardCode,
        amount: amount,
        balance: amount,
        status: 'active',
        purchaser_user_id: metadata.purchaser_user_id || null,
        purchaser_email: metadata.purchaser_email,
        purchaser_name: metadata.purchaser_name,
        recipient_email: isGift ? metadata.recipient_email : metadata.purchaser_email,
        recipient_name: isGift ? metadata.recipient_name : metadata.purchaser_name,
        message: metadata.message || null,
        stripe_payment_intent_id: session.payment_intent.id,
        purchased_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year from now
      })
      .select()
      .single();

    if (createError) {
      console.error("Error creating gift card:", createError);
      throw new Error("Failed to create gift card");
    }

    console.log("Gift card created:", giftCard.id);

    // Create transaction record
    await supabaseClient
      .from('gift_card_transactions')
      .insert({
        gift_card_id: giftCard.id,
        amount_used: amount,
        remaining_balance: amount,
        transaction_type: 'purchase',
        user_id: metadata.purchaser_user_id || null
      });

    // Send email notification
    try {
      const recipientEmail = isGift ? metadata.recipient_email : metadata.purchaser_email;
      const recipientName = isGift ? metadata.recipient_name : metadata.purchaser_name;
      
      const emailSubject = isGift 
        ? `You've received a £${amount} gift card!`
        : `Your £${amount} gift card is ready!`;

      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #2563eb; text-align: center;">
            ${isGift ? '🎁 You\'ve received a gift card!' : '🎉 Your gift card is ready!'}
          </h1>
          
          <div style="background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%); border-radius: 12px; padding: 30px; text-align: center; color: white; margin: 20px 0;">
            <h2 style="margin: 0 0 10px 0; font-size: 24px;">£${amount} Gift Card</h2>
            <p style="margin: 0 0 20px 0; font-size: 16px; opacity: 0.9;">for delicious meal prep</p>
            <div style="background: white; color: #2563eb; padding: 15px; border-radius: 8px; font-size: 24px; font-weight: bold; letter-spacing: 2px;">
              ${giftCardCode}
            </div>
          </div>

          ${isGift && metadata.message ? `
            <div style="background: #f8fafc; border-left: 4px solid #2563eb; padding: 15px; margin: 20px 0;">
              <h3 style="margin: 0 0 10px 0; color: #1e293b;">Personal Message:</h3>
              <p style="margin: 0; font-style: italic; color: #475569;">"${metadata.message}"</p>
              <p style="margin: 10px 0 0 0; color: #64748b; font-size: 14px;">From: ${metadata.purchaser_name}</p>
            </div>
          ` : ''}

          <div style="background: #f1f5f9; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="margin: 0 0 15px 0; color: #1e293b;">How to use your gift card:</h3>
            <ol style="color: #475569; line-height: 1.6;">
              <li>Browse our delicious meal selection</li>
              <li>Add meals to your cart</li>
              <li>Enter code <strong>${giftCardCode}</strong> at checkout</li>
              <li>Enjoy your healthy meals!</li>
            </ol>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${req.headers.get("origin")}/menu" style="background: #2563eb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              Start Shopping
            </a>
          </div>

          <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 30px; color: #64748b; font-size: 14px;">
            <p><strong>Gift Card Details:</strong></p>
            <ul style="list-style: none; padding: 0;">
              <li>Code: ${giftCardCode}</li>
              <li>Value: £${amount}</li>
              <li>Expires: ${new Date(giftCard.expires_at).toLocaleDateString('en-GB')}</li>
            </ul>
            <p style="margin-top: 15px;">
              You can check your gift card balance anytime at 
              <a href="${req.headers.get("origin")}/gift-card-balance" style="color: #2563eb;">our balance checker</a>.
            </p>
          </div>

          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #94a3b8; font-size: 12px;">
            <p>If you have any questions, please contact our support team.</p>
          </div>
        </div>
      `;

      await resend.emails.send({
        from: "Fit Food Tasty <orders@orders.fitfoodtasty.co.uk>",
        to: [recipientEmail],
        subject: emailSubject,
        html: emailHtml,
      });

      console.log("Gift card email sent to:", recipientEmail);

      // If it's a gift, also send confirmation to purchaser
      if (isGift && metadata.purchaser_email !== metadata.recipient_email) {
        const purchaserHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #2563eb; text-align: center;">🎁 Gift Card Sent Successfully!</h1>
            
            <p>Hi ${metadata.purchaser_name},</p>
            
            <p>Your £${amount} gift card has been successfully sent to <strong>${metadata.recipient_name}</strong> (${metadata.recipient_email}).</p>
            
            <div style="background: #f1f5f9; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h3 style="margin: 0 0 10px 0;">Gift Card Details:</h3>
              <ul style="list-style: none; padding: 0; margin: 0;">
                <li><strong>Code:</strong> ${giftCardCode}</li>
                <li><strong>Value:</strong> £${amount}</li>
                <li><strong>Recipient:</strong> ${metadata.recipient_name}</li>
                <li><strong>Expires:</strong> ${new Date(giftCard.expires_at).toLocaleDateString('en-GB')}</li>
              </ul>
            </div>
            
            <p>The recipient will receive an email with instructions on how to redeem their gift card.</p>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #94a3b8; font-size: 12px;">
              <p>Thank you for choosing our meal prep service!</p>
            </div>
          </div>
        `;

        await resend.emails.send({
          from: "Fit Food Tasty <orders@orders.fitfoodtasty.co.uk>",
          to: [metadata.purchaser_email],
          subject: `Gift card sent to ${metadata.recipient_name}`,
          html: purchaserHtml,
        });

        console.log("Confirmation email sent to purchaser:", metadata.purchaser_email);
      }

    } catch (emailError) {
      console.error("Error sending gift card email:", emailError);
      // Don't fail the entire process if email fails
    }

    return new Response(JSON.stringify({ 
      success: true, 
      gift_card: {
        id: giftCard.id,
        code: giftCard.code,
        amount: giftCard.amount,
        recipient_name: giftCard.recipient_name,
        expires_at: giftCard.expires_at
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error: any) {
    console.error("Error processing gift card payment:", error);
    return new Response(JSON.stringify({ 
      error: error.message || "Failed to process gift card payment" 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});