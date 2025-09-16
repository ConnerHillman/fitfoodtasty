import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export const useDiscounts = () => {
  const { toast } = useToast();
  
  // Coupon state
  const [couponCode, setCouponCode] = useState("");
  const [couponMessage, setCouponMessage] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [freeItemAdded, setFreeItemAdded] = useState(false);
  
  // Gift card state
  const [appliedGiftCard, setAppliedGiftCard] = useState<{
    code: string;
    amount_used: number;
    gift_card_id: string;
  } | null>(null);

  // Helper function to check if coupon makes order 100% off
  const isCoupon100PercentOff = (subtotal: number, fees: number) => {
    if (!couponApplied || !appliedCoupon) return false;
    
    if (appliedCoupon.discount_percentage >= 100) return true;
    
    const total = subtotal + fees;
    return appliedCoupon.discount_amount >= total;
  };

  // Calculate discounted total
  const getDiscountedTotal = (subtotal: number, fees: number) => {
    let adjustedFees = fees;
    
    // Apply free delivery
    if (couponApplied && appliedCoupon?.free_delivery) {
      adjustedFees = 0;
    }
    
    let total = subtotal + adjustedFees;
    
    // Apply coupon discount first
    if (couponApplied && appliedCoupon) {
      if (appliedCoupon.discount_percentage > 0) {
        const discountAmount = (total * appliedCoupon.discount_percentage) / 100;
        total = Math.max(0, total - discountAmount);
      } else if (appliedCoupon.discount_amount > 0) {
        total = Math.max(0, total - appliedCoupon.discount_amount);
      }
    }
    
    // Apply gift card discount
    if (appliedGiftCard) {
      total = Math.max(0, total - appliedGiftCard.amount_used);
    }
    
    return total;
  };

  // Get discount display text
  const getDiscountDisplay = () => {
    if (!couponApplied || !appliedCoupon) return "";
    
    if (appliedCoupon.discount_percentage > 0) {
      return `Discount (${appliedCoupon.discount_percentage}%)`;
    } else if (appliedCoupon.discount_amount > 0) {
      return `Discount (£${appliedCoupon.discount_amount} off)`;
    } else if (appliedCoupon.free_delivery) {
      return "Free Delivery";
    } else if (appliedCoupon.free_item_id) {
      return "Free Item";
    }
    return "Discount";
  };

  // Calculate discount amount for display
  const getDiscountAmount = (subtotal: number, fees: number) => {
    if (!couponApplied || !appliedCoupon) return 0;
    
    if (appliedCoupon.discount_percentage > 0) {
      return ((subtotal + fees) * appliedCoupon.discount_percentage) / 100;
    } else if (appliedCoupon.discount_amount > 0) {
      return Math.min(appliedCoupon.discount_amount, subtotal + fees);
    } else if (appliedCoupon.free_delivery) {
      return fees;
    }
    return 0;
  };

  // Check if coupon expires within 3 days and show warning
  const checkExpiryWarning = (coupon: any) => {
    if (!coupon?.expires_at) return;
    
    const now = new Date();
    const expiryDate = new Date(coupon.expires_at);
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry <= 3 && daysUntilExpiry > 0) {
      const warningMessage = daysUntilExpiry === 1 ? "Expires tomorrow!" : `Expires in ${daysUntilExpiry} days!`;
      toast({
        title: "⚠️ Coupon Expires Soon!",
        description: warningMessage,
        variant: "destructive",
      });
    }
  };

  // Get expiry warning text for display
  const getExpiryWarning = () => {
    if (!couponApplied || !appliedCoupon?.expires_at) return null;
    
    const now = new Date();
    const expiryDate = new Date(appliedCoupon.expires_at);
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry <= 3 && daysUntilExpiry > 0) {
      return daysUntilExpiry === 1 ? "⚠️ Expires tomorrow!" : `⚠️ Expires in ${daysUntilExpiry} days!`;
    }
    return null;
  };

  return {
    // Coupon state
    couponCode,
    setCouponCode,
    couponMessage,
    setCouponMessage,
    couponApplied,
    setCouponApplied,
    appliedCoupon,
    setAppliedCoupon,
    freeItemAdded,
    setFreeItemAdded,
    
    // Gift card state
    appliedGiftCard,
    setAppliedGiftCard,
    
    // Helper functions
    isCoupon100PercentOff,
    getDiscountedTotal,
    getDiscountDisplay,
    getDiscountAmount,
    checkExpiryWarning,
    getExpiryWarning,
  };
};