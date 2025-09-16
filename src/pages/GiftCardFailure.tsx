import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { XCircle, Gift, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const GiftCardFailure = () => {
  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="text-center mb-8">
        <XCircle className="mx-auto h-16 w-16 text-red-500 mb-4" />
        <h1 className="text-3xl font-bold mb-2">Gift Card Purchase Failed</h1>
        <p className="text-muted-foreground">
          We're sorry, but there was an issue processing your gift card purchase.
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            What happened?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Your payment may have been declined or there was a technical issue. 
            No charges have been made to your account.
          </p>
          
          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-medium mb-2">Common reasons for failed payments:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Insufficient funds</li>
              <li>• Incorrect card details</li>
              <li>• Card blocked by bank</li>
              <li>• Network connectivity issues</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <Button asChild className="w-full">
          <Link to="/gift-cards">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Try Again
          </Link>
        </Button>
        
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" asChild>
            <Link to="/menu">Browse Menu</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/gift-card-balance">Check Balance</Link>
          </Button>
        </div>
      </div>

      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">Need Help?</h4>
        <p className="text-sm text-blue-800">
          If you continue to experience issues, please contact our support team. 
          We're here to help you with your gift card purchase.
        </p>
      </div>
    </div>
  );
};

export default GiftCardFailure;