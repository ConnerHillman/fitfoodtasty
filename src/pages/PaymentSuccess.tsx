import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Package, Calendar, ArrowRight } from "lucide-react";

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [isSubscription, setIsSubscription] = useState(false);

  useEffect(() => {
    // Check if this was a subscription payment by looking at the URL or session storage
    const subscriptionFlow = sessionStorage.getItem('subscription_checkout');
    if (subscriptionFlow) {
      setIsSubscription(true);
      sessionStorage.removeItem('subscription_checkout');
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card className="text-center">
            <CardHeader className="pb-4">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl text-green-600">
                {isSubscription ? 'Subscription Activated!' : 'Payment Successful!'}
              </CardTitle>
              <CardDescription className="text-lg">
                {isSubscription 
                  ? 'Welcome to your new meal subscription plan'
                  : 'Thank you for your purchase'
                }
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {sessionId && (
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Transaction ID</p>
                  <p className="font-mono text-sm">{sessionId}</p>
                </div>
              )}

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">What happens next?</h3>
                
                {isSubscription ? (
                  <div className="space-y-3 text-left">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-primary">1</span>
                      </div>
                      <p className="text-sm">You'll receive a confirmation email shortly</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-primary">2</span>
                      </div>
                      <p className="text-sm">Your first delivery will be scheduled based on your plan</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-primary">3</span>
                      </div>
                      <p className="text-sm">You can manage your subscription anytime in your account</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 text-left">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-primary">1</span>
                      </div>
                      <p className="text-sm">You'll receive an order confirmation email</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-primary">2</span>
                      </div>
                      <p className="text-sm">Your order will be prepared and scheduled for delivery</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-primary">3</span>
                      </div>
                      <p className="text-sm">Track your order status in your account</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                {isSubscription ? (
                  <>
                    <Button asChild className="flex-1">
                      <Link to="/my-subscription">
                        <Calendar className="h-4 w-4 mr-2" />
                        Manage Subscription
                      </Link>
                    </Button>
                    <Button variant="outline" asChild className="flex-1">
                      <Link to="/menu">
                        <Package className="h-4 w-4 mr-2" />
                        Browse Menu
                      </Link>
                    </Button>
                  </>
                ) : (
                  <>
                    <Button asChild className="flex-1">
                      <Link to="/orders">
                        <Package className="h-4 w-4 mr-2" />
                        View Orders
                      </Link>
                    </Button>
                    <Button variant="outline" asChild className="flex-1">
                      <Link to="/menu">
                        <ArrowRight className="h-4 w-4 mr-2" />
                        Continue Shopping
                      </Link>
                    </Button>
                  </>
                )}
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-2">
                  Need help? Contact our support team
                </p>
                <Button variant="link" asChild>
                  <Link to="/contact">Get Support</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;