import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Tag, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/contexts/CartContext";
import GiftCardInput from "@/components/GiftCardInput";

interface CouponSectionProps {
  couponCode: string;
  onCouponCodeChange: (code: string) => void;
  couponMessage: string;
  onCouponMessageChange: (message: string) => void;
  couponApplied: boolean;
  onCouponAppliedChange: (applied: boolean) => void;
  appliedCoupon: any;
  onAppliedCouponChange: (coupon: any) => void;
  freeItemAdded: boolean;
  onFreeItemAddedChange: (added: boolean) => void;
  appliedGiftCard: any;
  onAppliedGiftCardChange: (giftCard: any) => void;
  checkExpiryWarning: (coupon: any) => void;
}

const CouponSection: React.FC<CouponSectionProps> = ({
  couponCode,
  onCouponCodeChange,
  couponMessage,
  onCouponMessageChange,
  couponApplied,
  onCouponAppliedChange,
  appliedCoupon,
  onAppliedCouponChange,
  freeItemAdded,
  onFreeItemAddedChange,
  appliedGiftCard,
  onAppliedGiftCardChange,
  checkExpiryWarning,
}) => {
  const { toast } = useToast();
  const { addToCart } = useCart();
  const [isApplying, setIsApplying] = useState(false);

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;

    setIsApplying(true);

    try {
      const { data, error } = await supabase.functions.invoke('validate-coupon', {
        body: { coupon_code: couponCode.trim() }
      });

      if (error) throw error;

      if (data.valid) {
        onAppliedCouponChange(data.coupon);
        onCouponAppliedChange(true);
        onCouponMessageChange(`Coupon "${couponCode}" applied successfully!`);
        
        // Check for expiry warning
        checkExpiryWarning(data.coupon);

        // Add free item if applicable
        if (data.coupon.free_item_id && !freeItemAdded) {
          try {
            const { data: mealData, error: mealError } = await supabase
              .from('meals')
              .select('*')
              .eq('id', data.coupon.free_item_id)
              .eq('is_active', true)
              .single();

            if (!mealError && mealData) {
              addToCart({
                id: mealData.id,
                name: `${mealData.name} (FREE)`,
                description: mealData.description || '',
                category: mealData.category || '',
                price: 0, // Free item
                total_calories: mealData.total_calories || 0,
                total_protein: mealData.total_protein || 0,
                total_carbs: mealData.total_carbs || 0,
                total_fat: mealData.total_fat || 0,
                total_fiber: mealData.total_fiber || 0,
                shelf_life_days: mealData.shelf_life_days || 5,
                image_url: mealData.image_url || '',
              });
              onFreeItemAddedChange(true);
              toast({
                title: "Free item added!",
                description: `${mealData.name} has been added to your cart for free.`,
              });
            }
          } catch (freeItemError) {
            console.error('Error adding free item:', freeItemError);
          }
        }

        toast({
          title: "Coupon applied!",
          description: data.message || "Discount applied to your order.",
        });
      } else {
        onCouponMessageChange(data.message || "Invalid coupon code");
        toast({
          title: "Invalid coupon",
          description: data.message || "This coupon code is not valid.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error applying coupon:', error);
      onCouponMessageChange("Failed to apply coupon");
      toast({
        title: "Error",
        description: "Failed to apply coupon. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsApplying(false);
    }
  };

  const removeCoupon = () => {
    onCouponAppliedChange(false);
    onAppliedCouponChange(null);
    onCouponCodeChange("");
    onCouponMessageChange("");
    onFreeItemAddedChange(false);
    toast({
      title: "Coupon removed",
      description: "The coupon has been removed from your order.",
    });
  };

  return (
    <Card className="bg-background border border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Tag className="h-5 w-5" />
          Discounts & Gift Cards
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Coupon Section */}
        <div className="space-y-3">
          <h4 className="font-medium">Coupon Code</h4>
          
          {!couponApplied ? (
            <div className="flex gap-2">
              <Input
                placeholder="Enter coupon code"
                value={couponCode}
                onChange={(e) => onCouponCodeChange(e.target.value.toUpperCase())}
                className="flex-1"
                onKeyPress={(e) => e.key === 'Enter' && applyCoupon()}
              />
              <Button 
                onClick={applyCoupon}
                disabled={!couponCode.trim() || isApplying}
                className="whitespace-nowrap"
              >
                {isApplying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Applying...
                  </>
                ) : (
                  'Apply'
                )}
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2">
                <Badge variant="default" className="bg-green-100 text-green-800">
                  {appliedCoupon?.code}
                </Badge>
                <span className="text-sm text-green-700">Coupon applied</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={removeCoupon}
                className="h-8 w-8 p-0 text-green-700 hover:text-green-900"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {couponMessage && !couponApplied && (
            <p className="text-sm text-destructive">{couponMessage}</p>
          )}
        </div>

        {/* Gift Card Section */}
        <div className="space-y-3">
          <h4 className="font-medium">Gift Card</h4>
          <GiftCardInput 
            onGiftCardApplied={onAppliedGiftCardChange}
            onGiftCardRemoved={() => onAppliedGiftCardChange(null)}
            appliedGiftCard={appliedGiftCard}
            totalAmount={0} // Will be calculated in parent
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default React.memo(CouponSection);