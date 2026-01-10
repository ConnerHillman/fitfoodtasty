import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/lib/logger';
import type { AbandonedCartProps } from '@/types/cart';

export const useAbandonedCart = ({ 
  cartItems, 
  total,
  customerEmail, 
  customerName 
}: AbandonedCartProps) => {
  const { user } = useAuth();
  const timeoutRef = useRef<NodeJS.Timeout>();
  const sessionId = useRef(crypto.randomUUID());

  // Track cart abandonment
  useEffect(() => {
    if (cartItems.length === 0 || total === 0) {
      return;
    }

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout for 5 minutes of inactivity
    timeoutRef.current = setTimeout(() => {
      trackCartAbandonment();
    }, 5 * 60 * 1000); // 5 minutes

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [cartItems, total, user, customerEmail, customerName]);

  const trackCartAbandonment = async () => {
    try {
      logger.debug('Tracking cart abandonment...');
      
      await supabase.functions.invoke('cart-tracking', {
        body: {
          action: 'abandon',
          cart_data: {
            user_id: user?.id,
            session_id: sessionId.current,
            customer_email: customerEmail,
            customer_name: customerName,
            cart_items: cartItems,
            total_amount: total
          }
        }
      });
    } catch (error) {
      logger.error('Error tracking cart abandonment', error);
    }
  };

  const trackCartRecovery = async () => {
    try {
      logger.debug('Tracking cart recovery...');
      
      await supabase.functions.invoke('cart-tracking', {
        body: {
          action: 'recover',
          cart_data: {
            user_id: user?.id,
            session_id: sessionId.current
          }
        }
      });
    } catch (error) {
      logger.error('Error tracking cart recovery', error);
    }
  };

  return {
    trackCartRecovery
  };
};