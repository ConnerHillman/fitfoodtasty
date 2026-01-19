import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import { Resend } from "npm:resend@2.0.0";
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

// Helper function to get display name safely (handles OAuth users with missing names)
function getDisplayName(
  firstName?: string | null,
  lastName?: string | null,
  fullName?: string | null,
  email?: string | null,
  fallback: string = 'Customer'
): string {
  const first = firstName?.trim() || '';
  const last = lastName?.trim() || '';
  
  if (first || last) {
    return [first, last].filter(Boolean).join(' ');
  }
  
  if (fullName?.trim()) {
    return fullName.trim();
  }
  
  if (email?.trim()) {
    return email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }
  
  return fallback;
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

    // If no customer email/name in order, try to get from auth user and profiles
    if (orderData.user_id) {
      // Get profile data first (has first_name, last_name, phone)
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name, full_name, phone')
        .eq('user_id', orderData.user_id)
        .single();
      
      if (profile?.phone) {
        customerPhone = profile.phone;
      }
      
      // If no customer name in order, try profile or auth user metadata
      if (!customerName) {
        if (profile) {
          customerName = getDisplayName(profile.first_name, profile.last_name, profile.full_name, customerEmail);
        } else {
          // Fall back to auth user metadata
          const { data: userData } = await supabase.auth.admin.getUserById(orderData.user_id);
          if (userData?.user) {
            const meta = userData.user.user_metadata;
            customerName = getDisplayName(
              meta?.first_name || meta?.given_name,
              meta?.last_name || meta?.family_name,
              meta?.full_name || meta?.name,
              userData.user.email
            );
          }
        }
      }
      
      // If still no email, try auth user
      if (!customerEmail) {
        const { data: userData } = await supabase.auth.admin.getUserById(orderData.user_id);
        customerEmail = userData?.user?.email;
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

    // Fetch all active collection points to match against delivery address
    const { data: collectionPoints } = await supabase
      .from('collection_points')
      .select('id, point_name, address, city, postcode')
      .eq('is_active', true);

    console.log(`Fetched ${collectionPoints?.length || 0} collection points for matching`);

    // Determine if this is a collection order by matching against collection points
    let isCollection = false;
    let matchedCollectionPoint: { point_name: string; address: string } | null = null;

    if (orderData.delivery_address && collectionPoints?.length) {
      const deliveryAddressLower = orderData.delivery_address.toLowerCase();
      
      // Try to match against collection point addresses
      for (const cp of collectionPoints) {
        const cpAddressLower = cp.address?.toLowerCase() || '';
        const cpNameLower = cp.point_name?.toLowerCase() || '';
        const cpCityLower = cp.city?.toLowerCase() || '';
        
        // Check if delivery address contains collection point details
        if (
          deliveryAddressLower.includes(cpAddressLower) ||
          deliveryAddressLower.includes(cpNameLower) ||
          cpAddressLower.includes(deliveryAddressLower.split(',')[0]) ||
          (cpNameLower && deliveryAddressLower.includes(cpNameLower))
        ) {
          isCollection = true;
          matchedCollectionPoint = {
            point_name: cp.point_name,
            address: [cp.address, cp.city, cp.postcode].filter(Boolean).join(', ')
          };
          console.log(`Matched collection point: ${cp.point_name}`);
          break;
        }
      }
    }

    // Fallback detection if no collection point matched
    if (!isCollection && orderData.delivery_address) {
      const addressLower = orderData.delivery_address.toLowerCase();
      isCollection = addressLower.includes('collection') || 
                     addressLower.includes('pickup') ||
                     addressLower.includes('collect');
    }

    // If no delivery address at all, assume collection
    if (!orderData.delivery_address) {
      isCollection = true;
    }

    const deliveryMethod = isCollection ? 'Collection' : 'Delivery';
    
    // Set dynamic labels based on fulfillment type
    const fulfillmentLabel = isCollection ? 'Collection Date' : 'Delivery Date';
    const addressLabel = isCollection ? 'Collection Point' : 'Delivery Address';
    
    // Smart address display - use collection point name if matched, otherwise use stored address
    const displayAddress = isCollection 
      ? (matchedCollectionPoint?.point_name || orderData.delivery_address || 'Collection Point')
      : (orderData.delivery_address || 'To be confirmed');

    console.log(`Order fulfillment: ${deliveryMethod}, isCollection: ${isCollection}, displayAddress: ${displayAddress}`);

    // Determine order type for reorder URL
    const reorderOrderType = orderType === 'package' ? 'package' : 'regular';
    const reorderUrl = `https://fitfoodtasty.co.uk/reorder/${orderId}?type=${reorderOrderType}`;

    // Build comprehensive variables object
    const variables = {
      // Customer info
      customer_name: customerName || 'Valued Customer',
      customer_email: customerEmail,
      customer_phone: customerPhone || '',
      has_customer_phone: !!customerPhone,
      
      // Order info
      order_id: orderId.split('-')[0].toUpperCase(),
      full_order_id: orderId,
      order_date: new Date(orderData.created_at).toLocaleDateString('en-GB', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      
      // Fulfillment info with dynamic labels
      is_collection: isCollection,
      is_delivery: !isCollection,
      fulfillment_label: fulfillmentLabel,
      address_label: addressLabel,
      collection_point_name: matchedCollectionPoint?.point_name || null,
      has_collection_point: !!matchedCollectionPoint,
      
      // Delivery/Collection date
      requested_delivery_date: orderData.requested_delivery_date 
        ? new Date(orderData.requested_delivery_date).toLocaleDateString('en-GB', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })
        : null,
      has_requested_delivery_date: !!orderData.requested_delivery_date,
      delivery_date: orderData.requested_delivery_date 
        ? new Date(orderData.requested_delivery_date).toLocaleDateString('en-GB', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })
        : 'To be confirmed',
      
      // Address display
      delivery_address: displayAddress,
      has_delivery_address: !!displayAddress && displayAddress !== 'To be confirmed',
      full_delivery_address: orderData.delivery_address || null,
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
      
      // Reorder functionality
      order_type: reorderOrderType,
      reorder_url: reorderUrl,
      
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
      is_collection: variables.is_collection,
      fulfillment_label: variables.fulfillment_label,
      address_label: variables.address_label,
      delivery_address: variables.delivery_address,
      collection_point_name: variables.collection_point_name,
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
