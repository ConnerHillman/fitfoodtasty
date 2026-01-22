import React from "react";
import { Button } from "@/components/ui/button";
import { Minus, Plus, Trash2, Package } from "lucide-react";

interface PackageData {
  packageId: string;
  packageName: string;
  selectedMeals: Record<string, number>;
  mealNames?: Record<string, string>;
}

interface CartItem {
  id: string;
  name: string;
  description: string;
  price: number;
  quantity: number;
  image_url?: string;
  type?: 'meal' | 'package';
  packageData?: PackageData;
}

interface EnhancedCartItemProps {
  item: CartItem;
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
}

const EnhancedCartItem: React.FC<EnhancedCartItemProps> = ({
  item,
  onUpdateQuantity,
  onRemove,
}) => {
  const isPackage = item.type === 'package';
  
  // Build the meal list for packages
  const packageMealsList = React.useMemo(() => {
    if (!isPackage || !item.packageData?.selectedMeals) return null;
    
    const { selectedMeals, mealNames } = item.packageData;
    return Object.entries(selectedMeals)
      .filter(([_, qty]) => qty > 0)
      .map(([mealId, qty]) => {
        const name = mealNames?.[mealId] || 'Meal';
        return { name, quantity: qty };
      });
  }, [isPackage, item.packageData]);

  return (
    <div className="flex gap-3 sm:gap-4 py-4 border-b border-border/40 last:border-0">
      {item.image_url ? (
        <img
          src={item.image_url}
          alt={item.name}
          className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg flex-shrink-0"
        />
      ) : isPackage ? (
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg flex-shrink-0 bg-primary/10 flex items-center justify-center">
          <Package className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
        </div>
      ) : null}
      
      <div className="flex-1 min-w-0 flex flex-col">
        <div>
          <h4 className="font-medium text-sm sm:text-base line-clamp-1">{item.name}</h4>
          
          {/* For packages: show full meal list */}
          {isPackage && packageMealsList && packageMealsList.length > 0 ? (
            <div className="mt-1.5 space-y-0.5">
              <p className="text-xs text-muted-foreground font-medium">Your selections:</p>
              <ul className="text-xs text-muted-foreground space-y-0.5">
                {packageMealsList.map((meal, idx) => (
                  <li key={idx} className="flex items-center gap-1">
                    <span className="text-primary">•</span>
                    <span>{meal.quantity}× {meal.name}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            /* For regular meals: show description truncated */
            <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1 mt-0.5">
              {item.description}
            </p>
          )}
        </div>
        
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-7 w-7 sm:h-8 sm:w-8 p-0 touch-manipulation rounded-lg"
              onClick={() => onUpdateQuantity(item.id, Math.max(0, item.quantity - 1))}
              aria-label="Decrease quantity"
            >
              <Minus className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
            <span className="w-6 sm:w-8 text-center text-sm font-medium">{item.quantity}</span>
            <Button
              variant="outline"
              size="sm"
              className="h-7 w-7 sm:h-8 sm:w-8 p-0 touch-manipulation rounded-lg"
              onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
              aria-label="Increase quantity"
            >
              <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRemove(item.id)}
              className="h-7 w-7 sm:h-8 sm:w-8 p-0 touch-manipulation text-muted-foreground hover:text-destructive ml-1"
              aria-label="Remove item"
            >
              <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          </div>
          <span className="text-sm sm:text-base font-semibold">
            £{(item.price * item.quantity).toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default React.memo(EnhancedCartItem);
