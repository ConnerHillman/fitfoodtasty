import { useEffect, useState } from "react";
import { Check } from "lucide-react";

interface CartConfirmationProps {
  show: boolean;
  itemName?: string;
  onComplete: () => void;
}

const CartConfirmation = ({ show, itemName, onComplete }: CartConfirmationProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      setIsExiting(false);
      
      // Auto-dismiss after 1.5 seconds
      const exitTimer = setTimeout(() => {
        setIsExiting(true);
      }, 1500);

      // Remove from DOM after exit animation
      const removeTimer = setTimeout(() => {
        setIsVisible(false);
        onComplete();
      }, 1800);

      return () => {
        clearTimeout(exitTimer);
        clearTimeout(removeTimer);
      };
    }
  }, [show, onComplete]);

  if (!isVisible) return null;

  return (
    <div
      className={`
        fixed z-[60] left-1/2 -translate-x-1/2 sm:left-auto sm:right-6 sm:translate-x-0
        pointer-events-none
        transition-all duration-300 ease-out
        ${isExiting 
          ? 'opacity-0 translate-y-2 bottom-24' 
          : 'opacity-100 translate-y-0 bottom-24'
        }
      `}
      style={{
        animation: isExiting ? undefined : 'slideUpFadeIn 0.3s ease-out'
      }}
    >
      <div className="
        flex items-center gap-2.5
        px-4 py-2.5
        bg-card/98 backdrop-blur-sm
        rounded-full
        shadow-dropdown
        border border-border/50
      ">
        <div className="
          flex items-center justify-center
          w-5 h-5
          bg-primary
          rounded-full
        ">
          <Check className="w-3 h-3 text-primary-foreground" strokeWidth={3} />
        </div>
        <span className="text-sm font-medium text-foreground whitespace-nowrap">
          Added to your order
        </span>
      </div>
    </div>
  );
};

export default CartConfirmation;
