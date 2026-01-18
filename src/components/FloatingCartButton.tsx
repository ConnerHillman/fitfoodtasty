import { Link, useLocation } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { useEffect, useState, useCallback } from "react";
import CartConfirmation from "./CartConfirmation";

const FloatingCartButton = () => {
  const { getTotalItems, getTotalPrice } = useCart();
  const { pathname } = useLocation();
  const itemCount = getTotalItems();
  const totalPrice = getTotalPrice();
  const [isPulsing, setIsPulsing] = useState(false);
  const [prevItemCount, setPrevItemCount] = useState(itemCount);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Trigger pulse animation and confirmation when items are added
  useEffect(() => {
    if (itemCount > prevItemCount) {
      setIsPulsing(true);
      setShowConfirmation(true);
      const timer = setTimeout(() => setIsPulsing(false), 300);
      return () => clearTimeout(timer);
    }
    setPrevItemCount(itemCount);
  }, [itemCount, prevItemCount]);

  const handleConfirmationComplete = useCallback(() => {
    setShowConfirmation(false);
  }, []);

  // Hide on cart page or when cart is empty
  if (pathname === '/cart' || itemCount === 0) return null;

  const formattedPrice = new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
  }).format(totalPrice);

  return (
    <>
      {/* Confirmation chip - positioned above checkout button */}
      <CartConfirmation 
        show={showConfirmation} 
        onComplete={handleConfirmationComplete} 
      />

      {/* Floating checkout button */}
      <Link 
        to="/cart" 
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-fade-in sm:left-auto sm:right-6 sm:translate-x-0"
      >
        <button
          className={`
            flex items-center justify-center gap-3
            h-14 px-8
            rounded-full
            bg-primary
            text-primary-foreground
            shadow-cta
            hover:shadow-cta-hover
            active:scale-[0.98]
            transition-all duration-200 ease-out
            ${isPulsing ? 'animate-subtle-pulse' : ''}
          `}
        >
          <span className="font-semibold text-base tracking-wide">
            Checkout
          </span>
          <span className="h-5 w-px bg-primary-foreground/25" aria-hidden="true" />
          <span className="font-bold text-base tabular-nums">
            {formattedPrice}
          </span>
        </button>
      </Link>
    </>
  );
};

export default FloatingCartButton;
