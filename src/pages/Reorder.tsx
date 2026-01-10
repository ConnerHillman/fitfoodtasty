import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Package, ShoppingCart, AlertCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import MealReplacementDialog from '@/components/packages/MealReplacementDialog';

const Reorder = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  const { startReorder, reorderData } = useCart();
  
  const [status, setStatus] = useState<'loading' | 'processing' | 'replacements' | 'error' | 'success'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [showReplacementDialog, setShowReplacementDialog] = useState(false);
  
  const orderType = (searchParams.get('type') as 'package' | 'regular') || 'regular';

  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) return;
    
    // If not logged in, RequireAuth should handle redirect
    if (!user) return;
    
    // If no orderId, show error
    if (!orderId) {
      setStatus('error');
      setErrorMessage('No order ID provided');
      return;
    }
    
    // Start the reorder process
    processReorder();
  }, [authLoading, user, orderId]);

  const processReorder = async () => {
    if (!orderId) return;
    
    setStatus('processing');
    
    try {
      const result = await startReorder(orderId, orderType);
      
      if (!result.success) {
        setStatus('error');
        setErrorMessage(result.error || 'Failed to process reorder');
        return;
      }
      
      if (result.needsReplacements) {
        // Show the replacement dialog
        setStatus('replacements');
        setShowReplacementDialog(true);
      } else {
        // All items available, go directly to cart
        setStatus('success');
        setTimeout(() => {
          navigate('/cart', { 
            state: { 
              reorderSuccess: true, 
              message: result.message || 'Items added to your cart!' 
            } 
          });
        }, 1000);
      }
    } catch (error) {
      console.error('Reorder error:', error);
      setStatus('error');
      setErrorMessage('An unexpected error occurred');
    }
  };

  const handleReplacementDialogClose = (open: boolean) => {
    setShowReplacementDialog(open);
    if (!open) {
      // User completed or cancelled replacements, go to cart
      navigate('/cart');
    }
  };

  // Loading state
  if (authLoading || status === 'loading') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-8 pb-8 text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Loading your order...</h2>
            <p className="text-muted-foreground">Please wait while we retrieve your order details</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Processing state
  if (status === 'processing') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="relative mx-auto mb-6 w-20 h-20">
              <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
              <div className="relative flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary to-primary/80 rounded-full">
                <Package className="h-10 w-10 text-primary-foreground" />
              </div>
            </div>
            <h2 className="text-xl font-semibold mb-2">Processing Your Reorder</h2>
            <p className="text-muted-foreground">Checking availability of your previous meals...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success state (brief flash before redirect)
  if (status === 'success') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="mx-auto mb-6 w-20 h-20 flex items-center justify-center bg-gradient-to-br from-green-500 to-emerald-600 rounded-full">
              <ShoppingCart className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-xl font-semibold mb-2 text-green-600">Items Added to Cart!</h2>
            <p className="text-muted-foreground mb-4">Redirecting you to checkout...</p>
            <div className="flex items-center justify-center gap-2 text-primary">
              <span>Going to cart</span>
              <ArrowRight className="h-4 w-4 animate-pulse" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (status === 'error') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="mx-auto mb-6 w-20 h-20 flex items-center justify-center bg-gradient-to-br from-red-500 to-rose-600 rounded-full">
              <AlertCircle className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-xl font-semibold mb-2 text-red-600">Unable to Process Reorder</h2>
            <p className="text-muted-foreground mb-6">{errorMessage}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button variant="outline" onClick={() => navigate('/orders')}>
                View My Orders
              </Button>
              <Button onClick={() => navigate('/menu')}>
                Browse Menu
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Replacements needed - show dialog
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-8 pb-8 text-center">
          <div className="mx-auto mb-6 w-20 h-20 flex items-center justify-center bg-gradient-to-br from-amber-500 to-orange-600 rounded-full">
            <Package className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Some Meals Need Replacement</h2>
          <p className="text-muted-foreground mb-4">
            {reorderData?.unavailableMeals?.length || 0} meal(s) from your original order are no longer available.
          </p>
          <Button onClick={() => setShowReplacementDialog(true)} className="w-full">
            Choose Replacement Meals
          </Button>
        </CardContent>
      </Card>

      <MealReplacementDialog 
        open={showReplacementDialog} 
        onOpenChange={handleReplacementDialogClose}
      />
    </div>
  );
};

export default Reorder;
