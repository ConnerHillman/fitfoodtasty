import { Link, useLocation } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { useEffect, useState } from "react";

const FloatingCartButton = () => {
  const { getTotalItems, getTotalPrice } = useCart();
  const { pathname } = useLocation();
  const itemCount = getTotalItems();
  const totalPrice = getTotalPrice();
  const [isPulsing, setIsPulsing] = useState(false);
  const [prevItemCount, setPrevItemCount] = useState(itemCount);

  // Trigger pulse animation when items are added
  useEffect(() => {
    if (itemCount > prevItemCount) {
      setIsPulsing(true);
      const timer = setTimeout(() => setIsPulsing(false), 300);
      return () => clearTimeout(timer);
    }
    setPrevItemCount(itemCount);
  }, [itemCount, prevItemCount]);

  // Hide on cart page or when cart is empty
  if (pathname === '/cart' || itemCount === 0) return null;

  const formattedPrice = new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
  }).format(totalPrice);

  return (
    <Link 
      to="/cart" 
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-fade-in sm:left-auto sm:right-6 sm:translate-x-0"
    >
      <button
        className={`
          flex items-center justify-center gap-3
          h-14 px-8
          rounded-full
          bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500
          text-white
          shadow-lg shadow-emerald-500/25
          hover:shadow-xl hover:shadow-emerald-500/30
          hover:from-emerald-500 hover:via-emerald-400 hover:to-teal-400
          active:scale-[0.98]
          transition-all duration-200 ease-out
          ${isPulsing ? 'scale-105' : ''}
        `}
      >
        <span className="font-semibold text-base tracking-wide">
          Checkout
        </span>
        <span className="h-5 w-px bg-white/30" aria-hidden="true" />
        <span className="font-bold text-base tabular-nums">
          {formattedPrice}
        </span>
      </button>
    </Link>
  );
};

export default FloatingCartButton;
