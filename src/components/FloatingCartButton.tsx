import { ShoppingCart } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";

const FloatingCartButton = () => {
  const { getTotalItems } = useCart();
  const { pathname } = useLocation();
  const itemCount = getTotalItems();

  // Hide on cart page
  if (pathname === '/cart') return null;

  return (
    <Link to="/cart" className="fixed bottom-6 right-6 z-50 animate-fade-in">
      <Button
        className="relative w-14 h-14 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-xl hover:shadow-2xl transition-all duration-200 hover:scale-110"
        size="icon"
      >
        <ShoppingCart className="h-6 w-6" />
        {itemCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center min-w-[20px] shadow-md">
            {itemCount > 99 ? '99+' : itemCount}
          </span>
        )}
      </Button>
    </Link>
  );
};

export default FloatingCartButton;
