import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Gift, Copy, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const GiftCardSuccess = () => {
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [giftCard, setGiftCard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    const fetchGiftCardDetails = async () => {
      if (!sessionId) {
        setLoading(false);
        return;
      }

      try {
        // Fetch gift card by Stripe session ID
        const { data, error } = await supabase
          .from('gift_cards')
          .select('*')
          .eq('stripe_payment_intent_id', sessionId)
          .single();

        if (error) throw error;
        setGiftCard(data);
      } catch (error) {
        console.error('Error fetching gift card:', error);
        toast({
          title: "Error",
          description: "Could not fetch gift card details.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchGiftCardDetails();
  }, [sessionId, toast]);

  const copyCode = () => {
    if (giftCard?.code) {
      navigator.clipboard.writeText(giftCard.code);
      toast({
        title: "Copied!",
        description: "Gift card code copied to clipboard.",
      });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-muted-foreground">Loading gift card details...</p>
      </div>
    );
  }

  if (!giftCard) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <Gift className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
        <h1 className="text-3xl font-bold mb-2">Gift Card Not Found</h1>
        <p className="text-muted-foreground mb-6">We couldn't find your gift card details.</p>
        <Button asChild>
          <Link to="/gift-cards">Buy Another Gift Card</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="text-center mb-8">
        <CheckCircle2 className="mx-auto h-16 w-16 text-green-500 mb-4" />
        <h1 className="text-3xl font-bold mb-2">Gift Card Purchased Successfully!</h1>
        <p className="text-muted-foreground">Your gift card is ready to use</p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Gift Card Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Amount</label>
              <p className="text-lg font-bold">£{giftCard.amount}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Balance</label>
              <p className="text-lg font-bold">£{giftCard.balance}</p>
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium text-muted-foreground">Gift Card Code</label>
            <div className="flex items-center gap-2 mt-1">
              <code className="flex-1 bg-muted px-3 py-2 rounded font-mono text-lg">
                {giftCard.code}
              </code>
              <Button variant="outline" size="sm" onClick={copyCode}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {giftCard.recipient_name && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">Recipient</label>
              <p className="font-medium">{giftCard.recipient_name}</p>
              {giftCard.recipient_email && (
                <p className="text-sm text-muted-foreground">{giftCard.recipient_email}</p>
              )}
            </div>
          )}

          {giftCard.message && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">Message</label>
              <p className="bg-muted p-3 rounded italic">"{giftCard.message}"</p>
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-muted-foreground">Expires</label>
            <p>{new Date(giftCard.expires_at).toLocaleDateString()}</p>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <Button asChild className="w-full">
          <Link to="/menu">Start Shopping</Link>
        </Button>
        
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" asChild>
            <Link to="/gift-cards">Buy Another Gift Card</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/gift-card-balance">Check Balance</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GiftCardSuccess;