import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useCart } from '@/contexts/CartContext';
import { Shield, User, Edit3, DollarSign, Calendar, MapPin } from 'lucide-react';

interface AdminOrderEnhancementsProps {
  onPriceOverride: (itemId: string, newPrice: number) => void;
  onOrderNotesChange: (notes: string) => void;
  orderNotes: string;
  onCashOrderConfirm: () => Promise<any>;
  totalAmount: number;
  finalTotal: number;
  loading?: boolean;
}

export const AdminOrderEnhancements: React.FC<AdminOrderEnhancementsProps> = ({
  onPriceOverride,
  onOrderNotesChange,
  orderNotes,
  onCashOrderConfirm,
  totalAmount,
  finalTotal,
  loading = false,
}) => {
  const { adminOrderData, items } = useCart();
  const [priceEdits, setPriceEdits] = useState<Record<string, number>>({});

  if (!adminOrderData) return null;

  const handlePriceEdit = (itemId: string, newPrice: number) => {
    setPriceEdits(prev => ({ ...prev, [itemId]: newPrice }));
    onPriceOverride(itemId, newPrice);
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
          <CardTitle className="text-lg flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-orange-600" />
            Admin Price Adjustments
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {items.map((item) => (
            <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex-1">
                <div className="font-medium">{item.name}</div>
                <div className="text-sm text-muted-foreground">
                  Qty: {item.quantity} • Original: £{item.price.toFixed(2)}
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
                  value={priceEdits[item.id] || ''}
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
                >
                  <Edit3 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          
          {Object.keys(priceEdits).length > 0 && (
            <div className="pt-3 border-t">
              <div className="text-sm text-orange-600 font-medium">
                Price adjustments applied to {Object.keys(priceEdits).length} item(s)
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

      {/* Quick Admin Actions */}
      <Card className="border-green-200">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5 text-green-600" />
            Admin Payment Options
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-1">
              <div className="font-medium">Subtotal:</div>
              <div>£{totalAmount.toFixed(2)}</div>
            </div>
            <div className="space-y-1">
              <div className="font-medium">Final Total:</div>
              <div className="text-lg font-semibold">£{finalTotal.toFixed(2)}</div>
            </div>
          </div>

          <Button 
            onClick={onCashOrderConfirm}
            disabled={loading || items.length === 0}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
            size="lg"
          >
            {loading ? 'Processing...' : 'Complete Cash/Paid Order'}
          </Button>
          
          <div className="text-xs text-center text-muted-foreground">
            Use this for cash payments, bank transfers, or orders already paid
          </div>
        </CardContent>
      </Card>

      {/* Admin Privileges Notice */}
      <Alert>
        <MapPin className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-1">
            <div className="font-medium">Admin Privileges Active</div>
            <div className="text-sm text-muted-foreground">
              • No delivery date restrictions • Price adjustments allowed • Payment bypass available
            </div>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
};