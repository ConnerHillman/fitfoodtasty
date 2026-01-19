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

interface CartItemCardProps {
  item: CartItem;
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
}

const CartItemCard: React.FC<CartItemCardProps> = ({
  item,
  onUpdateQuantity,
  onRemove,
}) => {
  return (
    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 p-4 border rounded-lg bg-background overflow-hidden">
      <div className="flex gap-3 sm:gap-4 flex-1 min-w-0">
        {item.image_url && (
          <img
            src={item.image_url}
            alt={item.name}
            className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-md flex-shrink-0"
          />
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-base sm:text-lg line-clamp-2 sm:truncate">{item.name}</h3>
          <p className="text-sm text-muted-foreground line-clamp-1 sm:truncate">{item.description}</p>
          <p className="text-base sm:text-lg font-semibold text-primary mt-1">£{item.price.toFixed(2)}</p>
        </div>
      </div>
      <div className="flex items-center justify-between sm:justify-end gap-2 flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/50">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0 touch-manipulation"
            onClick={() => onUpdateQuantity(item.id, Math.max(0, item.quantity - 1))}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <span className="w-8 text-center font-medium">{item.quantity}</span>
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0 touch-manipulation"
            onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onRemove(item.id)}
          className="text-destructive hover:text-destructive h-8 w-8 p-0 touch-manipulation"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default React.memo(CartItemCard);