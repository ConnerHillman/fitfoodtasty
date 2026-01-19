import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCart } from '@/contexts/CartContext';
import { calculateAdminTotals } from '@/lib/adminPriceCalculations';
import { supabase } from '@/integrations/supabase/client';
import { Shield, User, Edit3, DollarSign, Calendar, MapPin, RotateCcw, CreditCard, Link2, Banknote, Loader2 } from 'lucide-react';

interface PaymentMethod {
  id: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
}

type AdminPaymentMethod = 'cash' | 'payment_link' | 'charge_card';

interface AdminOrderEnhancementsProps {
  onPriceOverride: (itemId: string, newPrice: number) => void;
  onOrderNotesChange: (notes: string) => void;
  orderNotes: string;
  onCashOrderConfirm: () => Promise<any>;
  onPaymentLinkConfirm?: () => Promise<any>;
  onChargeCardConfirm?: (paymentMethodId: string, stripeCustomerId: string) => Promise<any>;
  totalAmount: number;
  finalTotal: number;
  loading?: boolean;
  priceOverrides?: Record<string, number>;
  onResetAllPrices?: () => void;
  deliveryFees?: number;
  totalOverride?: number | null;
  onTotalOverride?: (total: number | null) => void;
  sendEmail?: boolean;
  onSendEmailChange?: (sendEmail: boolean) => void;
}

export const AdminOrderEnhancements: React.FC<AdminOrderEnhancementsProps> = ({
  onPriceOverride,
  onOrderNotesChange,
  orderNotes,
  onCashOrderConfirm,
  onPaymentLinkConfirm,
  onChargeCardConfirm,
  totalAmount,
  finalTotal,
  loading = false,
  priceOverrides = {},
  onResetAllPrices,
  deliveryFees = 0,
  totalOverride,
  onTotalOverride,
  sendEmail = true,
  onSendEmailChange,
}) => {
  const { adminOrderData, items } = useCart();
  const [priceEdits, setPriceEdits] = useState<Record<string, number>>({});
  const [isEditingTotal, setIsEditingTotal] = useState(false);
  const [tempTotalValue, setTempTotalValue] = useState('');
  
  // Payment method state
  const [paymentMethod, setPaymentMethod] = useState<AdminPaymentMethod>('cash');
  const [savedCards, setSavedCards] = useState<PaymentMethod[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<string>('');
  const [stripeCustomerId, setStripeCustomerId] = useState<string>('');
  const [loadingCards, setLoadingCards] = useState(false);
  const [hasStripeCustomer, setHasStripeCustomer] = useState(false);
  
  // Calculate totals using the unified system
  const adminCalculation = calculateAdminTotals(items, priceOverrides);
  
  // Calculate the true final total including delivery fees with safe defaults
  const subtotal = adminCalculation?.subtotal ?? 0;
  const calculatedTotal = subtotal + (deliveryFees ?? 0);
  const displayTotal = (totalOverride !== null && totalOverride !== undefined) ? totalOverride : calculatedTotal;

  // Fetch saved payment methods when payment method changes to charge_card
  useEffect(() => {
    const fetchPaymentMethods = async () => {
      if (paymentMethod !== 'charge_card' || !adminOrderData?.customerEmail) return;
      
      setLoadingCards(true);
      try {
        const { data, error } = await supabase.functions.invoke('get-customer-payment-methods', {
          body: { customerEmail: adminOrderData.customerEmail }
        });
        
        if (error) throw error;
        
        setSavedCards(data.paymentMethods || []);
        setHasStripeCustomer(data.hasStripeCustomer || false);
        setStripeCustomerId(data.stripeCustomerId || '');
        
        if (data.paymentMethods?.length > 0) {
          setSelectedCardId(data.paymentMethods[0].id);
        }
      } catch (err) {
        console.error('Error fetching payment methods:', err);
        setSavedCards([]);
      } finally {
        setLoadingCards(false);
      }
    };
    
    fetchPaymentMethods();
  }, [paymentMethod, adminOrderData?.customerEmail]);

  if (!adminOrderData) return null;

  const handlePriceEdit = (itemId: string, newPrice: number) => {
    setPriceEdits(prev => ({ ...prev, [itemId]: newPrice }));
    onPriceOverride(itemId, newPrice);
  };

  const handleConfirmOrder = async () => {
    if (paymentMethod === 'cash') {
      return onCashOrderConfirm();
    } else if (paymentMethod === 'payment_link' && onPaymentLinkConfirm) {
      return onPaymentLinkConfirm();
    } else if (paymentMethod === 'charge_card' && onChargeCardConfirm && selectedCardId && stripeCustomerId) {
      return onChargeCardConfirm(selectedCardId, stripeCustomerId);
    }
  };

  const getButtonText = () => {
    if (loading) return 'Processing...';
    switch (paymentMethod) {
      case 'cash':
        return 'Complete Cash/Paid Order';
      case 'payment_link':
        return 'Create Order & Send Payment Link';
      case 'charge_card':
        return 'Create Order & Charge Card';
      default:
        return 'Complete Order';
    }
  };

  const isConfirmDisabled = () => {
    if (loading || items.length === 0) return true;
    if (paymentMethod === 'charge_card' && (!selectedCardId || savedCards.length === 0)) return true;
    return false;
  };

  const formatCardBrand = (brand: string) => {
    return brand.charAt(0).toUpperCase() + brand.slice(1);
  };

  return (
    <div className="space-y-6">
      {/* Admin Customer Info Banner */}
      <Alert className="border-blue-200 bg-blue-50">
        <Shield className="h-4 w-4 text-blue-600" />
        <AlertDescription>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-blue-900">Admin Order Mode</div>
              <div className="text-sm text-blue-700">
                Creating order for <strong>{adminOrderData.customerName}</strong>
              </div>
              <div className="text-sm text-blue-600">
                {adminOrderData.customerEmail} • {adminOrderData.postcode}
              </div>
            </div>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-300">
              <User className="h-3 w-3 mr-1" />
              Admin
            </Badge>
          </div>
        </AlertDescription>
      </Alert>

      {/* Price Override Section */}
      <Card className="border-orange-200">
        <CardHeader>
          <CardTitle className="text-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-orange-600" />
              Admin Price Adjustments
            </div>
            {adminCalculation.hasOverrides && onResetAllPrices && (
              <Button
                variant="outline"
                size="sm"
                onClick={onResetAllPrices}
                className="text-xs"
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                Reset All Prices
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {items.map((item) => {
            const calculation = adminCalculation.itemCalculations.find(calc => calc.id === item.id);
            const isOverridden = calculation?.isOverridden ?? false;
            const currentPrice = calculation?.currentPrice ?? item.price;
            
            return (
              <div key={item.id} className={`flex items-center justify-between p-3 border rounded-lg ${isOverridden ? 'border-orange-300 bg-orange-50' : ''}`}>
                <div className="flex-1">
                  <div className="font-medium flex items-center gap-2">
                    {item.name}
                    {isOverridden && <Edit3 className="h-3 w-3 text-orange-500" />}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Qty: {item.quantity} • Original: £{item.price.toFixed(2)}
                    {isOverridden && (
                      <span className="text-orange-600 font-medium ml-2">
                        → Current: £{currentPrice.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor={`price-${item.id}`} className="sr-only">
                    Override price for {item.name}
                  </Label>
                  <Input
                    id={`price-${item.id}`}
                    type="number"
                    step="0.01"
                    min="0"
                    className="w-24"
                    placeholder={item.price.toFixed(2)}
                    value={priceEdits[item.id] || (isOverridden ? currentPrice.toFixed(2) : '')}
                    onChange={(e) => {
                      const newPrice = parseFloat(e.target.value) || item.price;
                      handlePriceEdit(item.id, newPrice);
                    }}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setPriceEdits(prev => {
                        const newEdits = { ...prev };
                        delete newEdits[item.id];
                        return newEdits;
                      });
                      onPriceOverride(item.id, item.price);
                    }}
                    title="Reset to original price"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
          
          {adminCalculation.hasOverrides && (
            <div className="pt-3 border-t">
              <div className="text-sm text-orange-600 font-medium">
                Price adjustments applied to {adminCalculation.totalOverrides} item(s)
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Admin Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Edit3 className="h-5 w-5" />
            Order Notes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Label htmlFor="admin-notes">Internal notes and customer instructions</Label>
          <Textarea
            id="admin-notes"
            value={orderNotes}
            onChange={(e) => onOrderNotesChange(e.target.value)}
            placeholder="Add order notes, special instructions, or internal comments..."
            rows={4}
            className="mt-2"
          />
        </CardContent>
      </Card>

      {/* Payment Method Selection */}
      <Card className="border-green-200">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5 text-green-600" />
            Admin Payment Options
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Payment Method Radio Group */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Payment Method</Label>
            <RadioGroup 
              value={paymentMethod} 
              onValueChange={(value) => setPaymentMethod(value as AdminPaymentMethod)}
              className="grid grid-cols-3 gap-3"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="cash" id="cash" />
                <Label htmlFor="cash" className="flex items-center gap-1 cursor-pointer text-sm">
                  <Banknote className="h-4 w-4" />
                  Cash/Paid
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="payment_link" id="payment_link" />
                <Label htmlFor="payment_link" className="flex items-center gap-1 cursor-pointer text-sm">
                  <Link2 className="h-4 w-4" />
                  Payment Link
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="charge_card" id="charge_card" />
                <Label htmlFor="charge_card" className="flex items-center gap-1 cursor-pointer text-sm">
                  <CreditCard className="h-4 w-4" />
                  Saved Card
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Payment Method Description */}
          <div className="text-sm text-muted-foreground p-3 bg-muted/50 rounded-lg">
            {paymentMethod === 'cash' && (
              <p>Use for cash payments, bank transfers, or orders already paid offline.</p>
            )}
            {paymentMethod === 'payment_link' && (
              <p>Creates order and sends a payment link to the customer's email. Order status will be "pending_payment" until paid.</p>
            )}
            {paymentMethod === 'charge_card' && (
              <p>Charge the customer's saved card immediately. Order will be confirmed instantly.</p>
            )}
          </div>

          {/* Saved Cards Selection (only shown when charge_card is selected) */}
          {paymentMethod === 'charge_card' && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Select Card</Label>
              {loadingCards ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground p-3 border rounded-lg">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading saved cards...
                </div>
              ) : savedCards.length === 0 ? (
                <Alert>
                  <CreditCard className="h-4 w-4" />
                  <AlertDescription>
                    {hasStripeCustomer 
                      ? "This customer has no saved cards. Use Payment Link instead."
                      : "This customer has never made a payment with Stripe. Use Payment Link instead."}
                  </AlertDescription>
                </Alert>
              ) : (
                <Select value={selectedCardId} onValueChange={setSelectedCardId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a card" />
                  </SelectTrigger>
                  <SelectContent>
                    {savedCards.map((card) => (
                      <SelectItem key={card.id} value={card.id}>
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4" />
                          <span>{formatCardBrand(card.brand)} •••• {card.last4}</span>
                          <span className="text-muted-foreground">
                            (expires {card.expMonth}/{card.expYear})
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          {/* Order Totals */}
          <div className="grid grid-cols-2 gap-4 text-sm pt-3 border-t">
            <div className="space-y-1">
              <div className="font-medium">Subtotal{adminCalculation?.hasOverrides ? ' (with adjustments)' : ''}:</div>
              <div>£{subtotal.toFixed(2)}</div>
            </div>
            <div className="space-y-1">
              <div className="font-medium">Delivery Fee:</div>
              <div>£{(deliveryFees ?? 0).toFixed(2)}</div>
            </div>
          </div>

          <div className="text-lg font-semibold pt-2 border-t">
            Total: £{displayTotal.toFixed(2)}
          </div>
          
          {/* Email Notification Preference */}
          {onSendEmailChange && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={sendEmail}
                  onChange={(e) => onSendEmailChange(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">Send order confirmation email to customer</span>
              </Label>
            </div>
          )}

          <Button 
            onClick={handleConfirmOrder}
            disabled={isConfirmDisabled()}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
            size="lg"
          >
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {getButtonText()}
          </Button>
        </CardContent>
      </Card>

      {/* Admin Privileges Notice */}
      <Alert>
        <MapPin className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-1">
            <div className="font-medium">Admin Privileges Active</div>
            <div className="text-sm text-muted-foreground">
              • No delivery date restrictions • Price adjustments allowed • Payment options available
            </div>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
};
