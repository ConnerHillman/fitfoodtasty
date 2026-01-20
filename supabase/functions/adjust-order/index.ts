import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation helpers
function sanitizeString(input: unknown, maxLength: number = 255): string {
  if (typeof input !== 'string') return '';
  return input.trim().slice(0, maxLength).replace(/[<>]/g, '');
}

function validateUUID(input: unknown): string | null {
  if (typeof input !== 'string') return null;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(input) ? input : null;
}

function validatePositiveNumber(input: unknown): number {
  if (typeof input === 'number' && !isNaN(input) && isFinite(input) && input >= 0) {
    return input;
  }
  return 0;
}

function validateInteger(input: unknown, min: number = 1, max: number = 1000): number {
  if (typeof input === 'number' && Number.isInteger(input) && input >= min && input <= max) {
    return input;
  }
  return min;
}

interface MealModification {
  action: 'add' | 'remove' | 'update_quantity' | 'replace';
  mealId: string;
  quantity?: number;
  replacementMealId?: string;
  itemId?: string;
}

interface AdjustOrderRequest {
  orderId: string;
  orderType: 'individual' | 'package';
  adjustmentType?: 'discount' | 'refund' | 'fee';
  amount?: number;
  reason: string;
  mealModifications?: MealModification[];
  newDeliveryDate?: string;
}

function validateMealModifications(modifications: unknown): MealModification[] {
  if (!Array.isArray(modifications)) return [];
  
  // Limit to 50 modifications max
  return modifications.slice(0, 50)
    .filter((mod): mod is Record<string, unknown> => 
      typeof mod === 'object' && mod !== null
    )
    .map(mod => ({
      action: ['add', 'remove', 'update_quantity', 'replace'].includes(mod.action as string) 
        ? mod.action as MealModification['action'] 
        : 'add',
      mealId: validateUUID(mod.mealId) || '',
      quantity: validateInteger(mod.quantity, 1, 100),
      replacementMealId: validateUUID(mod.replacementMealId) || undefined,
      itemId: validateUUID(mod.itemId) || undefined,
    }))
    .filter(mod => mod.mealId || mod.itemId);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !userData.user) {
      throw new Error("Authentication failed");
    }

    // Verify admin role
    const { data: userRole } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', userData.user.id)
      .single();
    
    if (!userRole || userRole.role !== 'admin') {
      throw new Error("Admin access required");
    }

    // Parse and validate request body
    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      throw new Error("Invalid request body");
    }

    // Validate and sanitize all inputs
    const orderId = validateUUID(body.orderId);
    if (!orderId) {
      throw new Error("Invalid order ID");
    }

    const orderType = body.orderType === 'package' ? 'package' : 'individual';
    const adjustmentType = ['discount', 'refund', 'fee'].includes(body.adjustmentType as string)
      ? body.adjustmentType as 'discount' | 'refund' | 'fee'
      : undefined;
    const amount = validatePositiveNumber(body.amount);
    const reason = sanitizeString(body.reason, 500);
    const mealModifications = validateMealModifications(body.mealModifications);
    const newDeliveryDate = sanitizeString(body.newDeliveryDate, 20);

    // Get the order with items
    const tableName = orderType === 'package' ? 'package_orders' : 'orders';
    const itemsTable = orderType === 'package' ? 'package_meal_selections' : 'order_items';
    
    const { data: order, error: orderError } = await supabaseClient
      .from(tableName)
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      throw new Error("Order not found");
    }

    let newTotal = order.total_amount;
    const oldValues: any = { 
      total_amount: order.total_amount,
      requested_delivery_date: order.requested_delivery_date
    };
    const newValues: any = {};

    // Process meal modifications if provided
    if (mealModifications && mealModifications.length > 0) {
      for (const modification of mealModifications) {
        if (modification.action === 'add') {
          // Get meal details for pricing
          const { data: meal } = await supabaseClient
            .from('meals')
            .select('price, name')
            .eq('id', modification.mealId)
            .single();

          if (meal) {
            const quantity = modification.quantity || 1;
            const totalPrice = meal.price * quantity;

            if (orderType === 'package') {
              // Add to package meal selections
              await supabaseClient
                .from('package_meal_selections')
                .insert({
                  package_order_id: orderId,
                  meal_id: modification.mealId,
                  quantity
                });
            } else {
              // Add to order items
              await supabaseClient
                .from('order_items')
                .insert({
                  order_id: orderId,
                  meal_id: modification.mealId,
                  meal_name: meal.name,
                  quantity,
                  unit_price: meal.price,
                  total_price: totalPrice
                });
              
              newTotal += totalPrice;
            }
          }
        } else if (modification.action === 'remove' && modification.itemId) {
          // Get item details before removal
          const { data: item } = await supabaseClient
            .from(itemsTable)
            .select('*')
            .eq('id', modification.itemId)
            .single();

          if (item) {
            // Remove the item
            await supabaseClient
              .from(itemsTable)
              .delete()
              .eq('id', modification.itemId);

            if (orderType === 'individual') {
              newTotal -= item.total_price;
            }
          }
        } else if (modification.action === 'update_quantity' && modification.itemId) {
          const { data: item } = await supabaseClient
            .from(itemsTable)
            .select('*')
            .eq('id', modification.itemId)
            .single();

          if (item && modification.quantity) {
            if (orderType === 'package') {
              await supabaseClient
                .from('package_meal_selections')
                .update({ quantity: modification.quantity })
                .eq('id', modification.itemId);
            } else {
              const newTotalPrice = item.unit_price * modification.quantity;
              await supabaseClient
                .from('order_items')
                .update({ 
                  quantity: modification.quantity,
                  total_price: newTotalPrice
                })
                .eq('id', modification.itemId);

              newTotal = newTotal - item.total_price + newTotalPrice;
            }
          }
        }
      }
    }

    // Handle delivery date change if provided
    if (newDeliveryDate) {
      const deliveryDate = new Date(newDeliveryDate);
      newValues.requested_delivery_date = deliveryDate.toISOString().split('T')[0];
    }

    // Apply financial adjustments if provided
    if (adjustmentType && amount) {
      if (adjustmentType === 'discount' || adjustmentType === 'refund') {
        newTotal = Math.max(0, newTotal - amount);
      } else if (adjustmentType === 'fee') {
        newTotal = newTotal + amount;
      }
    }

    newValues.total_amount = newTotal;

    // Log the change
    await supabaseClient.rpc('log_order_change', {
      p_order_id: orderId,
      p_order_type: orderType,
      p_action_type: 'adjust',
      p_performed_by: userData.user.id,
      p_old_values: oldValues,
      p_new_values: newValues,
      p_reason: reason,
      p_amount_changed: newTotal - order.total_amount,
      p_metadata: { 
        adjustment_type: adjustmentType,
        meal_modifications: mealModifications || [],
        delivery_date_changed: !!newDeliveryDate
      }
    });

    // Update the order with all changes
    const updateData: any = {
      total_amount: newTotal,
      last_modified_by: userData.user.id,
      updated_at: new Date().toISOString()
    };

    if (newDeliveryDate) {
      updateData.requested_delivery_date = newValues.requested_delivery_date;
    }

    const { data: updatedOrder, error: updateError } = await supabaseClient
      .from(tableName)
      .update(updateData)
      .eq('id', orderId)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to update order: ${updateError.message}`);
    }

    // If it's a refund and we have a Stripe session, process the refund
    if (adjustmentType === 'refund' && order.stripe_session_id && amount > 0) {
      try {
        const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
          apiVersion: "2025-08-27.basil",
        });

        // Get the payment intent from the session
        const session = await stripe.checkout.sessions.retrieve(order.stripe_session_id);
        
        if (session.payment_intent && typeof session.payment_intent === 'string') {
          // Process refund
          await stripe.refunds.create({
            payment_intent: session.payment_intent,
            amount: Math.round(amount * 100), // Convert to cents
            reason: 'requested_by_customer',
            metadata: {
              order_id: orderId,
              order_type: orderType,
              adjustment_reason: reason
            }
          });

          // Update refund tracking
          await supabaseClient
            .from(tableName)
            .update({
              refund_amount: (order.refund_amount || 0) + amount,
              refund_reason: reason
            })
            .eq('id', orderId);
        }
      } catch (stripeError) {
        console.error('Stripe refund failed:', stripeError);
        // Don't fail the entire operation if Stripe fails
      }
    }

    const hasFinancialAdjustment = adjustmentType && amount;
    const hasMealModifications = mealModifications && mealModifications.length > 0;
    const hasDateChange = !!newDeliveryDate;
    
    let message = "Order updated successfully";
    if (hasFinancialAdjustment && hasMealModifications && hasDateChange) {
      message = `Order ${adjustmentType}, meal modifications, and delivery date updated successfully`;
    } else if (hasFinancialAdjustment && hasMealModifications) {
      message = `Order ${adjustmentType} and meal modifications applied successfully`;
    } else if (hasFinancialAdjustment && hasDateChange) {
      message = `Order ${adjustmentType} and delivery date updated successfully`;
    } else if (hasMealModifications && hasDateChange) {
      message = "Meal modifications and delivery date updated successfully";
    } else if (hasFinancialAdjustment) {
      message = `Order ${adjustmentType} applied successfully`;
    } else if (hasMealModifications) {
      message = "Meal modifications applied successfully";
    } else if (hasDateChange) {
      message = "Delivery date updated successfully";
    }

    return new Response(JSON.stringify({
      success: true,
      order: updatedOrder,
      message
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error('Error in adjust-order:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Failed to adjust order' 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});