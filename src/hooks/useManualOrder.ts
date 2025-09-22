import { useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export interface ManualOrderData {
  customer_email: string;
  customer_name: string;
  customer_phone?: string;
  delivery_address: string;
  order_type: 'phone' | 'complimentary' | 'special' | 'adjustment';
  payment_method: 'cash' | 'card' | 'bank_transfer' | 'complimentary' | 'stripe';
  order_notes: string;
  delivery_method: 'delivery' | 'collection';
  collection_point_id?: string;
  collection_point_name?: string;
  delivery_fee: number; // Auto-calculated, not user input
  meal_selections: Array<{
    meal_id: string;
    meal_name: string;
    price: number;
    quantity: number;
  }>;
  requested_delivery_date?: string;
}

export const useManualOrder = () => {
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const createManualOrder = async (orderData: ManualOrderData) => {
    setLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('create-manual-order', {
        body: orderData
      });

      if (error) {
        throw new Error(error.message || 'Failed to create manual order');
      }

      toast.success('Manual order created successfully');
      return data;
    } catch (error: any) {
      console.error('Error creating manual order:', error);
      toast.error(error.message || 'Failed to create manual order');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const openModal = () => setShowModal(true);
  const closeModal = () => setShowModal(false);

  return {
    loading,
    showModal,
    openModal,
    closeModal,
    createManualOrder
  };
};