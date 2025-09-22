import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useCart } from '@/contexts/CartContext';
import { supabase } from '@/integrations/supabase/client';

export const useAdminOrder = () => {
  const [loading, setLoading] = useState(false);
  const [priceOverrides, setPriceOverrides] = useState<Record<string, number>>({});
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

  const resetAllPrices = () => {
    setPriceOverrides({});
  };

  const createManualOrder = async (orderNotes: string, deliveryMethod: string, requestedDeliveryDate?: Date) => {
    if (!adminOrderData) {
      throw new Error('No admin order data available');
    }

    setLoading(true);
    try {
      // Prepare order data
      const orderData = {
        // Customer details
        customer_email: adminOrderData.customerEmail,
        customer_name: adminOrderData.customerName,
        customer_phone: adminOrderData.customerPhone || '',
        delivery_address: adminOrderData.deliveryAddress || '',
        postal_code: adminOrderData.postcode,
        
        // Order details
        order_type: 'manual_admin',
        payment_method: 'admin_cash',
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
          type: item.type || 'meal',
          package_data: item.packageData,
        })),
        
        // Totals
        subtotal: calculateTotalWithOverrides(),
        total_amount: calculateTotalWithOverrides(),
        
        // Admin specific
        created_by_admin: true,
        admin_notes: orderNotes,
        delivery_zone_id: adminOrderData.deliveryZoneId,
        is_new_customer: adminOrderData.isNewAccount,
      };

      // Call the create order function (we'll create this as an edge function)
      const { data, error } = await supabase.functions.invoke('create-admin-order', {
        body: orderData
      });

      if (error) throw error;

      toast({
        title: "Order Created Successfully",
        description: `Manual order for ${adminOrderData.customerName} has been created.`,
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
    handlePriceOverride,
    calculateTotalWithOverrides,
    createManualOrder,
    exitAdminMode,
    adminOrderData,
    resetAllPrices,
  };
};