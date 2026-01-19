import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useCart } from '@/contexts/CartContext';
import { supabase } from '@/integrations/supabase/client';

export const useAdminOrder = () => {
  const [loading, setLoading] = useState(false);
  const [priceOverrides, setPriceOverrides] = useState<Record<string, number>>({});
  const [totalOverride, setTotalOverride] = useState<number | null>(null);
  const { items, adminOrderData, clearCart, clearAdminOrderData } = useCart();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handlePriceOverride = (itemId: string, newPrice: number) => {
    setPriceOverrides(prev => ({
      ...prev,
      [itemId]: newPrice
    }));
  };

  const calculateTotalWithOverrides = () => {
    return items.reduce((total, item) => {
      const price = priceOverrides[item.id] || item.price;
      return total + (price * item.quantity);
    }, 0);
  };

  const handleTotalOverride = (newTotal: number | null) => {
    setTotalOverride(newTotal);
  };

  // Unified calculation that considers all overrides and fees
  const calculateUnifiedTotal = (fees: number = 0) => {
    const subtotalWithOverrides = calculateTotalWithOverrides();
    const calculatedTotal = subtotalWithOverrides + fees;
    return totalOverride !== null ? totalOverride : calculatedTotal;
  };

  const getFinalTotal = (deliveryFees: number = 0) => {
    return calculateUnifiedTotal(deliveryFees);
  };

  const resetAllPrices = () => {
    setPriceOverrides({});
    setTotalOverride(null);
  };

  // Prepare common order data
  const prepareOrderData = (orderNotes: string, deliveryMethod: string, requestedDeliveryDate?: Date, sendEmail: boolean = true) => {
    if (!adminOrderData) {
      throw new Error('No admin order data available');
    }

    return {
      // Customer details
      customer_email: adminOrderData.customerEmail,
      customer_name: adminOrderData.customerName,
      customer_phone: adminOrderData.customerPhone || '',
      delivery_address: adminOrderData.deliveryAddress || '',
      postal_code: adminOrderData.postcode,
      
      // Order details
      order_type: 'manual_admin',
      delivery_method: deliveryMethod,
      requested_delivery_date: requestedDeliveryDate?.toISOString().split('T')[0],
      order_notes: orderNotes,
      
      // Items with price overrides
      meal_selections: items.map(item => ({
        meal_id: item.id,
        meal_name: item.name,
        quantity: item.quantity,
        unit_price: priceOverrides[item.id] || item.price,
        total_price: (priceOverrides[item.id] || item.price) * item.quantity,
        original_price: item.price,
        type: item.type || 'meal',
        package_data: item.packageData,
      })),
      
      // Totals
      subtotal: calculateTotalWithOverrides(),
      total_amount: totalOverride !== null ? totalOverride : calculateTotalWithOverrides(),
      
      // Admin specific
      created_by_admin: true,
      admin_notes: orderNotes,
      delivery_zone_id: adminOrderData.deliveryZoneId,
      is_new_customer: adminOrderData.isNewAccount,
      email_notifications_enabled: sendEmail,
    };
  };

  const createManualOrder = async (orderNotes: string, deliveryMethod: string, requestedDeliveryDate?: Date, sendEmail: boolean = true) => {
    setLoading(true);
    try {
      const orderData = {
        ...prepareOrderData(orderNotes, deliveryMethod, requestedDeliveryDate, sendEmail),
        payment_method: 'admin_cash',
      };

      const { data, error } = await supabase.functions.invoke('create-admin-order', {
        body: orderData
      });

      if (error) throw error;

      toast({
        title: "Order Created Successfully",
        description: `Manual order for ${adminOrderData?.customerName} has been created.`,
      });

      // Clear cart and admin data
      clearCart();
      clearAdminOrderData?.();
      
      // Navigate to success page
      navigate('/admin?tab=orders');
      
      return { success: true, orderId: data.orderId };
    } catch (error: any) {
      console.error('Error creating manual order:', error);
      toast({
        title: "Error Creating Order",
        description: error.message || "Failed to create manual order",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const createPaymentLinkOrder = async (orderNotes: string, deliveryMethod: string, requestedDeliveryDate?: Date, sendEmail: boolean = true) => {
    setLoading(true);
    try {
      const orderData = {
        ...prepareOrderData(orderNotes, deliveryMethod, requestedDeliveryDate, sendEmail),
        payment_method: 'payment_link',
      };

      const { data, error } = await supabase.functions.invoke('create-admin-payment-link', {
        body: orderData
      });

      if (error) throw error;

      toast({
        title: "Payment Link Created",
        description: `Order created and payment link sent to ${adminOrderData?.customerEmail}`,
      });

      // Copy payment link to clipboard
      if (data.paymentUrl) {
        try {
          await navigator.clipboard.writeText(data.paymentUrl);
          toast({
            title: "Payment Link Copied",
            description: "The payment link has been copied to your clipboard.",
          });
        } catch (clipboardError) {
          console.log('Could not copy to clipboard:', clipboardError);
        }
      }

      // Clear cart and admin data
      clearCart();
      clearAdminOrderData?.();
      
      // Navigate back to admin
      navigate('/admin?tab=orders');
      
      return { success: true, orderId: data.orderId, paymentUrl: data.paymentUrl };
    } catch (error: any) {
      console.error('Error creating payment link order:', error);
      toast({
        title: "Error Creating Payment Link",
        description: error.message || "Failed to create payment link",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const chargeCardOrder = async (
    orderNotes: string, 
    deliveryMethod: string, 
    requestedDeliveryDate: Date | undefined, 
    paymentMethodId: string,
    stripeCustomerId: string,
    sendEmail: boolean = true
  ) => {
    setLoading(true);
    try {
      const orderData = {
        ...prepareOrderData(orderNotes, deliveryMethod, requestedDeliveryDate, sendEmail),
        payment_method: 'card_on_file',
        payment_method_id: paymentMethodId,
        stripe_customer_id: stripeCustomerId,
      };

      const { data, error } = await supabase.functions.invoke('charge-customer-card', {
        body: orderData
      });

      if (error) throw error;

      toast({
        title: "Card Charged Successfully",
        description: `Order confirmed and card charged for ${adminOrderData?.customerName}`,
      });

      // Clear cart and admin data
      clearCart();
      clearAdminOrderData?.();
      
      // Navigate back to admin
      navigate('/admin?tab=orders');
      
      return { success: true, orderId: data.orderId, paymentIntentId: data.paymentIntentId };
    } catch (error: any) {
      console.error('Error charging card:', error);
      toast({
        title: "Error Charging Card",
        description: error.message || "Failed to charge customer's card",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const exitAdminMode = () => {
    clearAdminOrderData?.();
    navigate('/admin?tab=orders');
    toast({
      title: "Admin Mode Exited",
      description: "Returned to admin dashboard",
    });
  };

  return {
    loading,
    priceOverrides,
    totalOverride,
    handlePriceOverride,
    handleTotalOverride,
    calculateTotalWithOverrides,
    calculateUnifiedTotal,
    getFinalTotal,
    createManualOrder,
    createPaymentLinkOrder,
    chargeCardOrder,
    exitAdminMode,
    adminOrderData,
    resetAllPrices,
  };
};
