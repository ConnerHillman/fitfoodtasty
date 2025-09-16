import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Search, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";

interface GiftCardInfo {
  valid: boolean;
  gift_card_id?: string;
  code?: string;
  balance?: number;
  expires_at?: string;
  error?: string;
}

const GiftCardBalance = () => {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [giftCardInfo, setGiftCardInfo] = useState<GiftCardInfo | null>(null);
  const { toast } = useToast();

  const handleCheck = async () => {
    if (!code.trim()) {
      toast({
        title: "Error",
        description: "Please enter a gift card code",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setGiftCardInfo(null);

    try {
      const { data, error } = await supabase.functions.invoke('validate-gift-card', {
        body: { code: code.trim() }
      });

      if (error) throw error;

      setGiftCardInfo(data);

      if (data.valid) {
        toast({
          title: "Gift Card Found",
          description: `Your gift card has a balance of £${data.balance}`,
        });
      } else {
        toast({
          title: "Gift Card Not Found",
          description: data.error || "Please check your code and try again",
          variant: "destructive",
        });
      }

    } catch (error: any) {
      console.error('Error checking gift card:', error);
      toast({
        title: "Error",
        description: "Failed to check gift card balance",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatExpiryDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const getStatusBadge = () => {
    if (!giftCardInfo?.valid) return null;

    const expiryDate = new Date(giftCardInfo.expires_at!);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (giftCardInfo.balance === 0) {
      return <Badge variant="secondary" className="flex items-center gap-1">
        <CheckCircle className="h-3 w-3" />
        Fully Redeemed
      </Badge>;
    }

    if (daysUntilExpiry <= 30) {
      return <Badge variant="destructive" className="flex items-center gap-1">
        <AlertCircle className="h-3 w-3" />
        Expires Soon
      </Badge>;
    }

    return <Badge variant="default" className="flex items-center gap-1">
      <Clock className="h-3 w-3" />
      Active
    </Badge>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-600 p-3 rounded-full">
              <CreditCard className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Check Gift Card Balance</h1>
          <p className="text-xl text-gray-600">
            Enter your gift card code to check your remaining balance
          </p>
        </div>

        {/* Balance Checker */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Enter Gift Card Code
            </CardTitle>
            <CardDescription>
              Your gift card code is a 12-character combination of letters and numbers
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="gift-card-code">Gift Card Code</Label>
              <Input
                id="gift-card-code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="Enter your 12-character code"
                className="text-center text-lg font-mono tracking-wider"
                maxLength={12}
              />
              <p className="text-sm text-gray-500 mt-1">
                Example: ABC123DEF456
              </p>
            </div>

            <Button 
              onClick={handleCheck}
              disabled={loading || !code.trim()}
              className="w-full"
              size="lg"
            >
              {loading ? 'Checking...' : 'Check Balance'}
            </Button>
          </CardContent>
        </Card>

        {/* Gift Card Information */}
        {giftCardInfo && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Gift Card Details
                {getStatusBadge()}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {giftCardInfo.valid ? (
                <div className="space-y-4">
                  <div className="text-center p-6 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg text-white">
                    <div className="text-sm opacity-90 mb-1">Available Balance</div>
                    <div className="text-4xl font-bold">£{giftCardInfo.balance}</div>
                    <div className="text-sm opacity-90 mt-2">
                      Code: {giftCardInfo.code}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-600">Gift Card Code</div>
                      <div className="font-mono font-semibold text-lg">
                        {giftCardInfo.code}
                      </div>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-600">Expires On</div>
                      <div className="font-semibold">
                        {formatExpiryDate(giftCardInfo.expires_at!)}
                      </div>
                    </div>
                  </div>

                  {giftCardInfo.balance! > 0 && (
                    <div className="text-center space-y-4 pt-4 border-t">
                      <p className="text-gray-600">
                        Ready to use your gift card?
                      </p>
                      <Link to="/menu">
                        <Button size="lg" className="w-full md:w-auto">
                          Start Shopping
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Gift Card Not Found
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {giftCardInfo.error || "Please check your code and try again"}
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setCode("");
                      setGiftCardInfo(null);
                    }}
                  >
                    Try Another Code
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Help Section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Need Help?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Can't find your gift card code?</h4>
              <p className="text-sm text-gray-600">
                Your gift card code was sent to your email when the gift card was purchased. 
                Check your inbox and spam folder for an email from our gift card service.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Gift card expired?</h4>
              <p className="text-sm text-gray-600">
                Our gift cards are valid for 12 months from the purchase date. 
                If your gift card has expired, please contact our support team.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Need more help?</h4>
              <p className="text-sm text-gray-600">
                Contact our customer support team for assistance with your gift card.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GiftCardBalance;