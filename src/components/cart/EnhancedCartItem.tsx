import React from "react";
import { Button } from "@/components/ui/button";
import { Minus, Plus, Trash2 } from "lucide-react";

interface CartItem {
  id: string;
  name: string;
  description: string;
  price: number;
  quantity: number;
  image_url?: string;
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
  return (
    <div className="flex gap-3 sm:gap-4 py-4 border-b border-border/40 last:border-0">
      {item.image_url && (
        <img
          src={item.image_url}
          alt={item.name}
          className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg flex-shrink-0"
        />
      )}
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div>
          <h4 className="font-medium text-sm sm:text-base line-clamp-1">{item.name}</h4>
          <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1 mt-0.5">{item.description}</p>
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
