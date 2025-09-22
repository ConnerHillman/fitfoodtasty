import { useState } from 'react';
import { useCart } from '@/contexts/CartContext';
import { toast } from '@/hooks/use-toast';

export interface AdminReorderResult {
  success: boolean;
  needsReplacements?: boolean;
  unavailableCount?: number;
  error?: string;
  message?: string;
}

export interface AdminReorderOptions {
  orderId: string;
  orderType: 'package' | 'regular';
  onSuccess?: (result: AdminReorderResult) => void;
  onError?: (error: string) => void;
}

export const useAdminReorder = () => {
  const [isReordering, setIsReordering] = useState(false);
  const [showReorderModal, setShowReorderModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [selectedOrderType, setSelectedOrderType] = useState<'package' | 'regular'>('package');
  const { startReorder } = useCart();

  const initiateReorder = (order: any, orderType: 'package' | 'regular') => {
    setSelectedOrder(order);
    setSelectedOrderType(orderType);
    setShowReorderModal(true);
  };

  const executeReorder = async (options: AdminReorderOptions): Promise<AdminReorderResult> => {
    setIsReordering(true);
    
    try {
      if (!startReorder) {
        throw new Error('Reorder functionality not available');
      }

      const result = await startReorder(options.orderId, options.orderType);
      
      if (result.success) {
        if (result.needsReplacements) {
          toast({
            title: "Reorder Started",
            description: `${result.unavailableCount} items unavailable. Please review and replace items in cart.`,
          });
        } else {
          toast({
            title: "Reorder Complete",
            description: "All items have been added to cart successfully.",
          });
        }
        
        options.onSuccess?.(result);
        return result;
      } else {
        throw new Error(result.error || 'Failed to process reorder');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to process reorder';
      toast({
        title: "Reorder Failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      options.onError?.(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsReordering(false);
      setShowReorderModal(false);
    }
  };

  const handleReorderAsIs = async () => {
    if (!selectedOrder) return;
    
    await executeReorder({
      orderId: selectedOrder.id,
      orderType: selectedOrderType,
      onSuccess: () => {
        // Navigate to menu for continued shopping
        window.location.href = '/menu';
      }
    });
  };

  const handleEditInCart = async () => {
    if (!selectedOrder) return;
    
    await executeReorder({
      orderId: selectedOrder.id,
      orderType: selectedOrderType,
      onSuccess: (result) => {
        if (!result.needsReplacements) {
          // Navigate to cart for checkout
          window.location.href = '/cart';
        }
      }
    });
  };

  const closeModal = () => {
    setShowReorderModal(false);
    setSelectedOrder(null);
  };

  return {
    isReordering,
    showReorderModal,
    selectedOrder,
    selectedOrderType,
    initiateReorder,
    executeReorder,
    handleReorderAsIs,
    handleEditInCart,
    closeModal,
  };
};