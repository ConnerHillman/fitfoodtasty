import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp, Loader2, Tag, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/contexts/CartContext";
import GiftCardInput from "@/components/GiftCardInput";

interface CollapsibleDiscountsProps {
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
  cartTotal?: number;
}

const CollapsibleDiscounts: React.FC<CollapsibleDiscountsProps> = ({
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
  cartTotal = 0,
}) => {
  const { toast } = useToast();
  const { addToCart } = useCart();
  const [isApplying, setIsApplying] = useState(false);
  const [isOpen, setIsOpen] = useState(couponApplied || !!appliedGiftCard);

  const hasActiveDiscount = couponApplied || !!appliedGiftCard;

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;

    setIsApplying(true);

    try {
      const { data, error } = await supabase.functions.invoke('validate-coupon', {
        body: { 
          code: couponCode.trim(),
          cart_total: cartTotal
        }
      });

      if (error) throw error;

      if (data.valid) {
        onAppliedCouponChange(data.coupon);
        onCouponAppliedChange(true);
        onCouponMessageChange(`Coupon "${couponCode}" applied successfully!`);
        
        checkExpiryWarning(data.coupon);

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
                price: 0,
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
    <div className="border border-border/40 rounded-xl bg-muted/10">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/20 rounded-xl transition-colors">
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">
              {hasActiveDiscount ? "Discounts applied" : "Have a discount code or gift card?"}
            </span>
            {hasActiveDiscount && (
              <Badge variant="secondary" className="text-xs bg-primary/10 text-primary">
                Active
              </Badge>
            )}
          </div>
          {isOpen ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </CollapsibleTrigger>
        
        <CollapsibleContent className="px-4 pb-4 space-y-4">
          {/* Coupon Section */}
          <div className="space-y-3 pt-2">
            <h4 className="text-sm font-medium">Coupon Code</h4>
            
            {!couponApplied ? (
              <div className="flex gap-2">
                <Input
                  placeholder="Enter coupon code"
                  value={couponCode}
                  onChange={(e) => onCouponCodeChange(e.target.value.toUpperCase())}
                  className="flex-1 h-10"
                  onKeyPress={(e) => e.key === 'Enter' && applyCoupon()}
                />
                <Button 
                  onClick={applyCoupon}
                  disabled={!couponCode.trim() || isApplying}
                  className="whitespace-nowrap h-10"
                  size="sm"
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
              <div className="flex items-center justify-between p-3 bg-primary/5 border border-primary/20 rounded-lg">
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="bg-primary/10 text-primary border-0">
                    {appliedCoupon?.code}
                  </Badge>
                  <span className="text-sm text-primary">Coupon applied</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={removeCoupon}
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
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
          <div className="space-y-3 pt-2 border-t border-border/40">
            <h4 className="text-sm font-medium pt-2">Gift Card</h4>
            <GiftCardInput 
              onGiftCardApplied={onAppliedGiftCardChange}
              onGiftCardRemoved={() => onAppliedGiftCardChange(null)}
              appliedGiftCard={appliedGiftCard}
              totalAmount={0}
            />
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default React.memo(CollapsibleDiscounts);
