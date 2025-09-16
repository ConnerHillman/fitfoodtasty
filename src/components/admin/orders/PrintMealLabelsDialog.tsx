import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Printer, Package, FileText, Download, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface OrderItem {
  id: string;
  meal_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface PackageMealSelection {
  id: string;
  meal_id: string;
  quantity: number;
  meals?: {
    name: string;
    price: number;
  };
}

interface Order {
  id: string;
  user_id: string;
  customer_name: string;
  customer_email: string;
  total_amount: number;
  status: string;
  created_at: string;
  order_items?: OrderItem[];
  package_meal_selections?: PackageMealSelection[];
  type: 'individual' | 'package';
  packages?: {
    name: string;
  };
}

interface MealLabelData {
  mealName: string;
  quantity: number;
  selected: boolean;
}

interface PrintMealLabelsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
}

export const PrintMealLabelsDialog: React.FC<PrintMealLabelsDialogProps> = ({
  isOpen,
  onClose,
  order
}) => {
  const { toast } = useToast();
  const [mealLabels, setMealLabels] = useState<MealLabelData[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [includeCustomerInfo, setIncludeCustomerInfo] = useState(true);
  const [includeOrderInfo, setIncludeOrderInfo] = useState(true);

  // Initialize meal labels data when order changes
  useEffect(() => {
    if (!order) {
      setMealLabels([]);
      return;
    }

    const labels: MealLabelData[] = [];

    if (order.type === 'individual' && order.order_items) {
      order.order_items.forEach(item => {
        labels.push({
          mealName: item.meal_name,
          quantity: item.quantity,
          selected: true
        });
      });
    } else if (order.type === 'package' && order.package_meal_selections) {
      order.package_meal_selections.forEach(selection => {
        labels.push({
          mealName: selection.meals?.name || 'Unknown Meal',
          quantity: selection.quantity,
          selected: true
        });
      });
    }

    setMealLabels(labels);
  }, [order]);

  const handleToggleMeal = (index: number) => {
    setMealLabels(prev => 
      prev.map((label, i) => 
        i === index ? { ...label, selected: !label.selected } : label
      )
    );
  };

  const handleSelectAll = () => {
    setMealLabels(prev => prev.map(label => ({ ...label, selected: true })));
  };

  const handleDeselectAll = () => {
    setMealLabels(prev => prev.map(label => ({ ...label, selected: false })));
  };

  const handleGenerateLabels = async () => {
    if (!order) return;

    const selectedLabels = mealLabels.filter(label => label.selected);
    
    if (selectedLabels.length === 0) {
      toast({
        title: "No Labels Selected",
        description: "Please select at least one meal to generate labels.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      // TODO: Implement actual label generation
      // This would involve:
      // 1. Fetching meal details (ingredients, allergens, nutrition info)
      // 2. Generating PDF labels with proper formatting
      // 3. Including customer and order information if selected
      // 4. Triggering download or opening print dialog

      // Simulate generation time
      await new Promise(resolve => setTimeout(resolve, 2000));

      toast({
        title: "Labels Generated",
        description: `Generated ${selectedLabels.length} meal labels for order ${order.id.slice(-8)}.`,
      });

      onClose();
      
    } catch (error) {
      console.error('Error generating labels:', error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate meal labels. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClose = () => {
    if (!isGenerating) {
      onClose();
    }
  };

  if (!order) return null;

  const selectedCount = mealLabels.filter(label => label.selected).length;
  const totalLabels = mealLabels.reduce((sum, label) => 
    label.selected ? sum + label.quantity : sum, 0
  );

  const hasNoMeals = mealLabels.length === 0;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Printer className="h-5 w-5" />
            Print Meal Labels - Order #{order.id.slice(-8)}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Package className="h-4 w-4" />
                Order Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Customer:</span>
                <span className="font-medium">{order.customer_name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Type:</span>
                <Badge variant={order.type === 'package' ? 'default' : 'secondary'}>
                  {order.type === 'package' ? 'Package' : 'Individual'}
                </Badge>
              </div>
              {order.type === 'package' && order.packages && (
                <div className="flex justify-between text-sm">
                  <span>Package:</span>
                  <span className="font-medium">{order.packages.name}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* No Meals Warning */}
          {hasNoMeals && (
            <div className="flex items-start gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-destructive">No Meals Found</h4>
                <p className="text-sm text-destructive/80 mt-1">
                  This order doesn't contain any meals to generate labels for.
                </p>
              </div>
            </div>
          )}

          {/* Meal Selection */}
          {!hasNoMeals && (
            <>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Select Meals for Labels</Label>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleSelectAll}>
                      Select All
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleDeselectAll}>
                      Clear All
                    </Button>
                  </div>
                </div>

                <Card className="max-h-48 overflow-y-auto">
                  <CardContent className="p-4 space-y-3">
                    {mealLabels.map((label, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <Checkbox
                          checked={label.selected}
                          onCheckedChange={() => handleToggleMeal(index)}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">
                            {label.mealName}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Quantity: {label.quantity} {label.quantity === 1 ? 'label' : 'labels'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Selection Summary */}
                <div className="text-sm text-muted-foreground">
                  {selectedCount} meals selected • {totalLabels} total labels to generate
                </div>
              </div>

              <Separator />

              {/* Label Options */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Label Options</Label>
                
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="include-customer"
                      checked={includeCustomerInfo}
                      onCheckedChange={(checked) => setIncludeCustomerInfo(checked === true)}
                    />
                    <Label htmlFor="include-customer" className="text-sm">
                      Include customer information on labels
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="include-order"
                      checked={includeOrderInfo}
                      onCheckedChange={(checked) => setIncludeOrderInfo(checked === true)}
                    />
                    <Label htmlFor="include-order" className="text-sm">
                      Include order ID and date on labels
                    </Label>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isGenerating}>
            Cancel
          </Button>
          {!hasNoMeals && (
            <Button 
              onClick={handleGenerateLabels} 
              disabled={isGenerating || selectedCount === 0}
            >
              {isGenerating ? (
                "Generating..."
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  Generate {totalLabels} Labels
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};