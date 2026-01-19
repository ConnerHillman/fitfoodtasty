import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Gift, CreditCard, Heart, Star, Users, Utensils } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface GiftCardProduct {
  id: string;
  amount: number;
  name: string;
  description: string;
  stripe_price_id: string;
}

const GiftCards = () => {
  const [products, setProducts] = useState<GiftCardProduct[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<GiftCardProduct | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [isCustom, setIsCustom] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isGift, setIsGift] = useState(true);
  
  // Form data
  const [purchaserName, setPurchaserName] = useState("");
  const [purchaserEmail, setPurchaserEmail] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [message, setMessage] = useState("");
  
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchGiftCardProducts();
    if (user) {
      setPurchaserEmail(user.email || "");
      // Try to get user's name from profile
      fetchUserProfile();
    }
  }, [user]);

  const fetchUserProfile = async () => {
    if (!user) return;
    
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name, full_name')
        .eq('user_id', user.id)
        .single();
      
      if (profile) {
        const { getDisplayName } = await import('@/lib/displayName');
        const displayName = getDisplayName(profile);
        if (displayName && displayName !== 'Customer') {
          setPurchaserName(displayName);
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchGiftCardProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('gift_card_products')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching gift card products:', error);
      toast({
        title: "Error",
        description: "Failed to load gift card options",
        variant: "destructive",
      });
    }
  };

  const handleProductSelect = (product: GiftCardProduct) => {
    setSelectedProduct(product);
    setIsCustom(false);
    setCustomAmount("");
  };

  const handleCustomSelect = () => {
    setSelectedProduct(null);
    setIsCustom(true);
  };

  const getSelectedAmount = () => {
    if (isCustom) {
      return parseFloat(customAmount) || 0;
    }
    return selectedProduct?.amount || 0;
  };

  const handlePurchase = async () => {
    const amount = getSelectedAmount();
    
    // Validation
    if (!amount || amount < 10 || amount > 500) {
      toast({
        title: "Error",
        description: "Please select a gift card amount between £10 and £500",
        variant: "destructive",
      });
      return;
    }

    if (!purchaserName || !purchaserEmail) {
      toast({
        title: "Error", 
        description: "Please enter your name and email",
        variant: "destructive",
      });
      return;
    }

    if (isGift && (!recipientName || !recipientEmail)) {
      toast({
        title: "Error",
        description: "Please enter recipient details",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-gift-card-payment', {
        body: {
          amount,
          product_id: selectedProduct?.id || null,
          purchaser_name: purchaserName,
          purchaser_email: purchaserEmail,
          recipient_name: isGift ? recipientName : purchaserName,
          recipient_email: isGift ? recipientEmail : purchaserEmail,
          message: isGift ? message : null,
          is_gift: isGift
        }
      });

      if (error) throw error;

      // Redirect to Stripe Checkout
      if (data?.url) {
        window.open(data.url, '_blank');
      } else {
        throw new Error('No checkout URL received');
      }

    } catch (error: any) {
      console.error('Error creating gift card payment:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create gift card payment",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: <Utensils className="h-5 w-5" />,
      title: "Fresh Meals",
      description: "Choose from our delicious meal prep options"
    },
    {
      icon: <Heart className="h-5 w-5" />,
      title: "Health Focused",
      description: "Nutritionally balanced meals for a healthy lifestyle"
    },
    {
      icon: <Users className="h-5 w-5" />,
      title: "Perfect Gift",
      description: "Great for friends, family, or colleagues"
    },
    {
      icon: <Star className="h-5 w-5" />,
      title: "12 Months Valid",
      description: "Plenty of time to enjoy delicious meals"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-600 p-3 rounded-full">
              <Gift className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Gift Cards</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Give the gift of healthy, delicious meals. Perfect for anyone who loves great food and convenience.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Gift Card Selection */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Choose Gift Card Amount
                </CardTitle>
                <CardDescription>
                  Select from our popular amounts or enter a custom value
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Preset Amounts */}
                <div>
                  <Label className="text-sm font-medium mb-3 block">Popular Amounts</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {products.map((product) => (
                      <button
                        key={product.id}
                        onClick={() => handleProductSelect(product)}
                        className={`p-4 border-2 rounded-lg text-center transition-all hover:border-blue-400 ${
                          selectedProduct?.id === product.id
                            ? 'border-blue-600 bg-blue-50'
                            : 'border-gray-200'
                        }`}
                      >
                        <div className="text-2xl font-bold text-blue-600">£{product.amount}</div>
                        <div className="text-sm text-gray-600 mt-1">{product.description}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Amount */}
                <div>
                  <Label className="text-sm font-medium mb-3 block">Custom Amount</Label>
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={handleCustomSelect}
                      className={`p-4 border-2 rounded-lg flex-1 text-center transition-all hover:border-blue-400 ${
                        isCustom ? 'border-blue-600 bg-blue-50' : 'border-gray-200'
                      }`}
                    >
                      <div className="text-lg font-semibold">Custom Amount</div>
                      <div className="text-sm text-gray-600">£10 - £500</div>
                    </button>
                  </div>
                  {isCustom && (
                    <div className="mt-3">
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">£</span>
                        <Input
                          type="number"
                          placeholder="Enter amount"
                          value={customAmount}
                          onChange={(e) => setCustomAmount(e.target.value)}
                          className="pl-8"
                          min="10"
                          max="500"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Gift Toggle */}
                <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                  <Switch
                    id="is-gift"
                    checked={isGift}
                    onCheckedChange={setIsGift}
                  />
                  <Label htmlFor="is-gift" className="flex-1">
                    This is a gift for someone else
                  </Label>
                </div>

                {/* Purchaser Details */}
                <div className="space-y-4">
                  <h3 className="font-semibold">Your Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="purchaser-name">Your Name</Label>
                      <Input
                        id="purchaser-name"
                        value={purchaserName}
                        onChange={(e) => setPurchaserName(e.target.value)}
                        placeholder="Enter your name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="purchaser-email">Your Email</Label>
                      <Input
                        id="purchaser-email"
                        type="email"
                        value={purchaserEmail}
                        onChange={(e) => setPurchaserEmail(e.target.value)}
                        placeholder="Enter your email"
                      />
                    </div>
                  </div>
                </div>

                {/* Recipient Details */}
                {isGift && (
                  <div className="space-y-4">
                    <h3 className="font-semibold">Recipient Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="recipient-name">Recipient Name</Label>
                        <Input
                          id="recipient-name"
                          value={recipientName}
                          onChange={(e) => setRecipientName(e.target.value)}
                          placeholder="Enter recipient's name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="recipient-email">Recipient Email</Label>
                        <Input
                          id="recipient-email"
                          type="email"
                          value={recipientEmail}
                          onChange={(e) => setRecipientEmail(e.target.value)}
                          placeholder="Enter recipient's email"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="message">Personal Message (Optional)</Label>
                      <Textarea
                        id="message"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Add a personal message to your gift..."
                        rows={3}
                        maxLength={500}
                      />
                      <div className="text-sm text-gray-500 mt-1">
                        {message.length}/500 characters
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Order Summary & Features */}
          <div className="space-y-6">
            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Gift Card Value:</span>
                    <span className="font-semibold">
                      {getSelectedAmount() > 0 ? `£${getSelectedAmount()}` : '—'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Processing Fee:</span>
                    <span className="font-semibold">Free</span>
                  </div>
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center text-lg font-bold">
                      <span>Total:</span>
                      <span className="text-blue-600">
                        {getSelectedAmount() > 0 ? `£${getSelectedAmount()}` : '—'}
                      </span>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={handlePurchase}
                    disabled={loading || getSelectedAmount() === 0}
                    className="w-full"
                    size="lg"
                  >
                    {loading ? 'Processing...' : 'Purchase Gift Card'}
                  </Button>

                  <div className="text-center">
                    <Badge variant="secondary" className="text-xs">
                      Secure payment via Stripe
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Features */}
            <Card>
              <CardHeader>
                <CardTitle>Why Choose Our Gift Cards?</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {features.map((feature, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="bg-blue-100 p-2 rounded-lg">
                        {feature.icon}
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm">{feature.title}</h4>
                        <p className="text-sm text-gray-600">{feature.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GiftCards;