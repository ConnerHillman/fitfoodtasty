import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CouponModalProps {
  isEdit: boolean;
  isVisible: boolean;
  onClose: () => void;
  formData: {
    code: string;
    discount_type: string;
    discount_percentage: number;
    discount_amount: number;
    free_delivery: boolean;
    free_item_id: string;
    min_order_value: number;
    active: boolean;
  };
  setFormData: (updater: (prev: any) => any) => void;
  isSubmitting: boolean;
  meals: Array<{ id: string; name: string }>;
  onSubmit: (isEdit: boolean) => void;
}

const CouponModal = ({
  isEdit,
  isVisible,
  onClose,
  formData,
  setFormData,
  isSubmitting,
  meals,
  onSubmit
}: CouponModalProps) => {
  const codeInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus code field when modal opens
  useEffect(() => {
    if (isVisible && !isEdit && codeInputRef.current) {
      // Small delay to ensure modal is fully rendered
      const timer = setTimeout(() => {
        codeInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isVisible, isEdit]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">
            {isEdit ? 'Edit Coupon' : 'Create New Coupon'}
          </h3>
          
          <div className="space-y-4">
            {/* Code Input */}
            <div>
              <Label htmlFor="code">Coupon Code</Label>
              <Input
                ref={codeInputRef}
                id="code"
                type="text"
                placeholder="e.g., SAVE20"
                value={formData.code}
                onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                className="mt-1"
                disabled={isSubmitting}
                maxLength={20}
              />
              <div className="text-xs text-muted-foreground mt-1">
                Will be converted to uppercase • Max 20 characters
              </div>
            </div>

            {/* Discount Type Selector */}
            <div>
              <Label htmlFor="discount-type">Discount Type</Label>
              <Select 
                value={formData.discount_type} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, discount_type: value }))}
                disabled={isSubmitting}
              >
                <SelectTrigger className="mt-1 bg-white border border-input z-50">
                  <SelectValue placeholder="Select discount type" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-input shadow-lg z-[60]">
                  <SelectItem value="percentage">Percentage Discount</SelectItem>
                  <SelectItem value="fixed_amount">Fixed Amount (£)</SelectItem>
                  <SelectItem value="free_delivery">Free Delivery</SelectItem>
                  <SelectItem value="free_item">Free Item</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Dynamic Fields Based on Discount Type */}
            {formData.discount_type === 'percentage' && (
              <div>
                <Label htmlFor="discount-percentage">Discount Percentage</Label>
                <Input
                  id="discount-percentage"
                  type="number"
                  min="0"
                  max="100"
                  placeholder="e.g., 20"
                  value={formData.discount_percentage}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    discount_percentage: Math.min(100, Math.max(0, parseInt(e.target.value) || 0))
                  }))}
                  className="mt-1"
                  disabled={isSubmitting}
                />
                <div className="text-xs text-muted-foreground mt-1">
                  Value between 0 and 100
                </div>
              </div>
            )}

            {formData.discount_type === 'fixed_amount' && (
              <div>
                <Label htmlFor="discount-amount">Discount Amount (£)</Label>
                <Input
                  id="discount-amount"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="e.g., 10.00"
                  value={formData.discount_amount}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    discount_amount: Math.max(0, parseFloat(e.target.value) || 0)
                  }))}
                  className="mt-1"
                  disabled={isSubmitting}
                />
                <div className="text-xs text-muted-foreground mt-1">
                  Fixed amount to subtract from order total
                </div>
              </div>
            )}

            {formData.discount_type === 'free_delivery' && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  This coupon will provide free delivery to customers.
                </p>
              </div>
            )}

            {formData.discount_type === 'free_item' && (
              <div>
                <Label htmlFor="free-item">Free Item</Label>
                <Select 
                  value={formData.free_item_id} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, free_item_id: value }))}
                  disabled={isSubmitting}
                >
                  <SelectTrigger className="mt-1 bg-white border border-input z-50">
                    <SelectValue placeholder="Select a meal" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-input shadow-lg z-[60] max-h-48 overflow-y-auto">
                    {meals.map((meal) => (
                      <SelectItem key={meal.id} value={meal.id}>
                        {meal.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="text-xs text-muted-foreground mt-1">
                  Customer will receive this meal for free
                </div>
              </div>
            )}

            {/* Minimum Order Value */}
            <div>
              <Label htmlFor="min-order">Minimum Order Value (£) - Optional</Label>
              <Input
                id="min-order"
                type="number"
                min="0"
                step="0.01"
                placeholder="e.g., 25.00"
                value={formData.min_order_value}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  min_order_value: Math.max(0, parseFloat(e.target.value) || 0)
                }))}
                className="mt-1"
                disabled={isSubmitting}
              />
              <div className="text-xs text-muted-foreground mt-1">
                Leave empty for no minimum requirement
              </div>
            </div>

            {/* Active Checkbox */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="active"
                checked={formData.active}
                onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.checked }))}
                className="rounded"
                disabled={isSubmitting}
              />
              <Label htmlFor="active">Active</Label>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Button 
              variant="outline" 
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              onClick={() => onSubmit(isEdit)}
              disabled={isSubmitting || !formData.code.trim()}
            >
              {isSubmitting ? 'Saving...' : (isEdit ? 'Update' : 'Create')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CouponModal;