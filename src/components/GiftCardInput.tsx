import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Gift, CheckCircle, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface GiftCardInputProps {
  onGiftCardApplied: (giftCardData: {
    code: string;
    amount_used: number;
    gift_card_id: string;
  }) => void;
  onGiftCardRemoved: () => void;
  appliedGiftCard?: {
    code: string;
    amount_used: number;
  } | null;
  totalAmount: number;
}

const GiftCardInput = ({ 
  onGiftCardApplied, 
  onGiftCardRemoved, 
  appliedGiftCard, 
  totalAmount 
}: GiftCardInputProps) => {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleApplyGiftCard = async () => {
    if (!code.trim()) {
      toast({
        title: "Error",
        description: "Please enter a gift card code",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('validate-gift-card', {
        body: { 
          code: code.trim(),
          amount_to_use: totalAmount
        }
      });

      if (error) throw error;

      if (!data.valid) {
        toast({
          title: "Invalid Gift Card",
          description: data.error || "Please check your code and try again",
          variant: "destructive",
        });
        return;
      }

      onGiftCardApplied({
        code: data.code,
        amount_used: data.amount_used,
        gift_card_id: data.gift_card_id
      });

      setCode("");
      
      toast({
        title: "Gift Card Applied",
        description: `£${data.amount_used} has been applied to your order`,
      });

    } catch (error: any) {
      console.error('Error applying gift card:', error);
      toast({
        title: "Error",
        description: "Failed to validate gift card",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveGiftCard = () => {
    onGiftCardRemoved();
    toast({
      title: "Gift Card Removed",
      description: "Gift card has been removed from your order",
    });
  };

  if (appliedGiftCard) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-5 w-5" />
            Gift Card Applied
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
            <div>
              <div className="font-semibold">Gift Card: {appliedGiftCard.code}</div>
              <div className="text-sm text-green-600">
                -£{appliedGiftCard.amount_used} applied
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemoveGiftCard}
              className="text-red-600 hover:text-red-700"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="h-5 w-5" />
          Gift Card
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="gift-card-code">Gift Card Code</Label>
          <div className="flex gap-2">
            <Input
              id="gift-card-code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Enter 12-character code"
              className="font-mono"
              maxLength={12}
            />
            <Button 
              onClick={handleApplyGiftCard}
              disabled={loading || !code.trim()}
              size="sm"
            >
              {loading ? 'Applying...' : 'Apply'}
            </Button>
          </div>
        </div>
        
        <div className="text-sm text-gray-500">
          <p>Enter your gift card code to apply it to this order.</p>
          <p className="mt-1">
            Don't have the code? 
            <a href="/gift-card-balance" className="text-blue-600 hover:underline ml-1">
              Check your balance here
            </a>
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default GiftCardInput;