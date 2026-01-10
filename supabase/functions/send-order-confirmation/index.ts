import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import { Resend } from "npm:resend@4.0.0";
import Handlebars from "npm:handlebars@4.7.8";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OrderConfirmationRequest {
  orderId: string;
  orderType: 'individual' | 'package';
  templateId?: string;
  customData?: Record<string, any>;
}

serve(async (req) => {
  console.log('[send-order-confirmation] Function invoked', {
    method: req.method,
    url: req.url,
    timestamp: new Date().toISOString()
  });

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize clients
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resendApiKey = Deno.env.get('RESEND_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const resend = new Resend(resendApiKey);

    const { orderId, orderType, templateId, customData = {} }: OrderConfirmationRequest = await req.json();

    console.log(`Sending order confirmation for ${orderType} order ${orderId}`);

    // Get order details
    let orderData: any;
    let orderItems: any[] = [];
    
    if (orderType === 'individual') {
      // Get individual order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (orderError || !order) {
        throw new Error(`Order not found: ${orderError?.message}`);
      }

      // Get order items
      const { data: items, error: itemsError } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', orderId);

      if (itemsError) {
        throw new Error(`Failed to fetch order items: ${itemsError.message}`);
      }

      orderData = order;
      orderItems = items || [];
    } else {
      // Get package order
      const { data: order, error: orderError } = await supabase
        .from('package_orders')
        .select(`
          *,
          packages(name, description)
        `)
        .eq('id', orderId)
        .single();

      if (orderError || !order) {
        throw new Error(`Package order not found: ${orderError?.message}`);
      }

      // Get package meal selections
      const { data: selections, error: selectionsError } = await supabase
        .from('package_meal_selections')
        .select(`
          *,
          meals(name, price)
        `)
        .eq('package_order_id', orderId);

      if (selectionsError) {
        throw new Error(`Failed to fetch package selections: ${selectionsError.message}`);
      }

      orderData = order;
      orderItems = selections?.map(s => ({
        meal_name: s.meals?.name || 'Package Meal',
        quantity: s.quantity,
        unit_price: s.meals?.price || 0,
        total_price: (s.meals?.price || 0) * s.quantity
      })) || [];
    }

    // Check if email notifications are enabled for this order
    if (orderData.email_notifications_enabled === false) {
      console.log(`Email notifications disabled for order ${orderId}`);
      return new Response(
        JSON.stringify({ success: false, message: 'Email notifications disabled for this order' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get customer email and name directly from order (already stored there)
    let customerEmail = orderData.customer_email;
    let customerName = orderData.customer_name;
    let customerPhone = '';

    // Try to get phone and additional details from profile
    if (orderData.user_id) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('phone, full_name')
        .eq('user_id', orderData.user_id)
        .maybeSingle();
      
      if (profile) {
        customerPhone = profile.phone || '';
        if (!customerName) {
          customerName = profile.full_name;
        }
      }
    }

    // If no customer email in order, try to get from auth user
    if (!customerEmail && orderData.user_id) {
      const { data: userData } = await supabase.auth.admin.getUserById(orderData.user_id);
      customerEmail = userData?.user?.email;
      if (!customerName) {
        customerName = userData?.user?.user_metadata?.full_name;
      }
    }

    console.log(`Customer email: ${customerEmail}, name: ${customerName}, phone: ${customerPhone}`);

    if (!customerEmail) {
      throw new Error('No customer email found for order');
    }

    // Get email template
    let template: any;
    if (templateId) {
      const { data: customTemplate, error: templateError } = await supabase
        .from('order_email_templates')
        .select('*')
        .eq('id', templateId)
        .eq('is_active', true)
        .single();

      if (templateError || !customTemplate) {
        console.log(`Custom template not found, using default: ${templateError?.message}`);
      } else {
        template = customTemplate;
      }
    }

    // Fallback to default template
    if (!template) {
      // First try to get the default template if it's active
      const { data: defaultTemplate } = await supabase
        .from('order_email_templates')
        .select('*')
        .eq('template_type', 'order_confirmation')
        .eq('is_default', true)
        .eq('is_active', true)
        .maybeSingle();

      if (defaultTemplate) {
        template = defaultTemplate;
        console.log(`Using default template: ${template.template_name}`);
      } else {
        // Fall back to any active order_confirmation template
        const { data: anyActiveTemplate, error: fallbackError } = await supabase
          .from('order_email_templates')
          .select('*')
          .eq('template_type', 'order_confirmation')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (fallbackError || !anyActiveTemplate) {
          throw new Error(`No active order confirmation template found: ${fallbackError?.message}`);
        }

        template = anyActiveTemplate;
        console.log(`Using fallback template: ${template.template_name}`);
      }
    }

    // Calculate financial values
    const subtotal = orderItems.reduce((sum, item) => sum + (item.total_price || 0), 0);
    const discountAmount = orderData.discount_amount || 0;
    // Delivery fee = total - subtotal + discount (since discount reduces total)
    const deliveryFee = Math.max(0, orderData.total_amount - subtotal + discountAmount);

    // Prepare order items as array for Handlebars {{#each}}
    const orderItemsArray = orderItems.map(item => ({
      meal_name: item.meal_name,
      unit_price: (item.unit_price || 0).toFixed(2),
      quantity: item.quantity,
      total_price: (item.total_price || 0).toFixed(2)
    }));

    // Legacy: pre-rendered HTML for backwards compatibility with simple templates
    const orderItemsHtml = orderItems.map(item => `
      <tr>
        <td style="padding: 12px 10px; border-bottom: 1px solid #e0e0e0;">${item.meal_name}</td>
        <td style="padding: 12px 10px; border-bottom: 1px solid #e0e0e0; text-align: center;">£${(item.unit_price || 0).toFixed(2)}</td>
        <td style="padding: 12px 10px; border-bottom: 1px solid #e0e0e0; text-align: center;">${item.quantity}</td>
        <td style="padding: 12px 10px; border-bottom: 1px solid #e0e0e0; text-align: right;">£${(item.total_price || 0).toFixed(2)}</td>
      </tr>
    `).join('');

    const orderItemsText = orderItems.map(item => 
      `${item.meal_name} x ${item.quantity} - £${(item.total_price || 0).toFixed(2)}`
    ).join('\n');

    // Determine delivery method from address
    const isCollection = orderData.delivery_address?.toLowerCase().includes('collection') || 
                         orderData.delivery_address?.toLowerCase().includes('pickup') ||
                         !orderData.delivery_address;
    const deliveryMethod = isCollection ? 'Collection' : 'Delivery';

    // Build comprehensive variables object
    const variables = {
      // Customer info
      customer_name: customerName || 'Valued Customer',
      customer_email: customerEmail,
      customer_phone: customerPhone || 'Not provided',
      has_customer_phone: !!customerPhone,
      
      // Order info
      order_id: orderId.split('-')[0].toUpperCase(),
      order_date: new Date(orderData.created_at).toLocaleDateString('en-GB', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      
      // Delivery info
      delivery_date: orderData.requested_delivery_date 
        ? new Date(orderData.requested_delivery_date).toLocaleDateString('en-GB', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })
        : 'To be confirmed',
      delivery_address: orderData.delivery_address || 'Collection',
      delivery_method: deliveryMethod,
      
      // Order items - array for {{#each}}
      order_items: orderItemsArray,
      
      // Legacy HTML versions for backwards compatibility
      order_items_html: orderItemsHtml,
      order_items_text: orderItemsText,
      
      // Pricing
      subtotal: subtotal.toFixed(2),
      discount_amount: discountAmount.toFixed(2),
      has_discount: discountAmount > 0,
      delivery_fee: deliveryFee.toFixed(2),
      has_delivery_fee: deliveryFee > 0,
      total_amount: orderData.total_amount.toFixed(2),
      
      // Order notes
      order_notes: orderData.order_notes || '',
      has_order_notes: !!orderData.order_notes,
      
      // Business info
      business_name: 'Fit Food Tasty',
      business_address: 'Unit F, Cartwright Mill Business Centre, Brue Avenue, Bridgwater, Somerset, TA6 5LT',
      business_phone: '07961 719602',
      
      // Any custom data passed in
      ...customData
    };

    console.log('Template variables prepared:', {
      customer_name: variables.customer_name,
      order_id: variables.order_id,
      order_items_count: orderItemsArray.length,
      subtotal: variables.subtotal,
      discount_amount: variables.discount_amount,
      delivery_fee: variables.delivery_fee,
      total_amount: variables.total_amount
    });

    // Compile templates with Handlebars
    const compiledSubject = Handlebars.compile(template.subject_template);
    const compiledHtml = Handlebars.compile(template.html_content);
    const compiledText = template.text_content ? Handlebars.compile(template.text_content) : null;

    // Render with variables
    const subject = compiledSubject(variables);
    const htmlContent = compiledHtml(variables);
    const textContent = compiledText ? compiledText(variables) : null;

    // Send email
    const emailData: any = {
      from: 'Fit Food Tasty <orders@orders.fitfoodtasty.co.uk>',
      to: [customerEmail],
      subject: subject,
      html: htmlContent,
    };

    if (textContent) {
      emailData.text = textContent;
    }

    const { error: emailError } = await resend.emails.send(emailData);

    if (emailError) {
      throw new Error(`Failed to send email: ${emailError.message}`);
    }

    // Log the email
    const { error: logError } = await supabase
      .from('order_emails')
      .insert({
        order_id: orderId,
        order_type: orderType,
        email_type: 'order_confirmation',
        recipient_email: customerEmail,
        subject: subject,
        html_content: htmlContent,
        text_content: textContent,
        template_id: template.id,
        metadata: {
          customer_name: customerName,
          variables: variables
        }
      });

    if (logError) {
      console.error('Failed to log email:', logError);
    }

    console.log(`Order confirmation email sent successfully to ${customerEmail}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Order confirmation email sent successfully',
        recipient: customerEmail 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    console.error('Error sending order confirmation:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
