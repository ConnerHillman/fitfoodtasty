import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect } from "react";
import { useCart } from "@/contexts/CartContext";

const PaymentSuccess = () => {
  const { clearCart } = useCart();

  useEffect(() => {
    // Clear the cart locally after a successful payment redirect
    clearCart();
  }, [clearCart]);

  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <CheckCircle2 className="mx-auto h-16 w-16 text-primary mb-4" />
      <h1 className="text-3xl font-bold mb-2">Payment Successful</h1>
      <p className="text-muted-foreground mb-6">Thank you for your order! We've received your payment.</p>
      <div className="flex items-center justify-center gap-3">
        <Button asChild>
          <Link to="/menu">Order More</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/">Go Home</Link>
        </Button>
      </div>
    </div>
  );
};

export default PaymentSuccess;