import React from 'react';
import ErrorBoundary from './ErrorBoundary';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Users, RefreshCw, Home } from 'lucide-react';

interface CustomerErrorBoundaryProps {
  children: React.ReactNode;
  onRetry?: () => void;
}

const CustomerErrorFallback = ({ onRetry }: { onRetry?: () => void }) => (
  <div className="flex items-center justify-center min-h-[400px] p-6">
    <Alert className="max-w-md">
      <Users className="h-4 w-4" />
      <AlertTitle>Customer Management Error</AlertTitle>
      <AlertDescription className="mt-2">
        <div className="space-y-3">
          <p>
            There was a problem loading customer information. This could be due to a network issue or temporary server problem.
          </p>
          
          <div className="flex gap-2">
            {onRetry && (
              <Button onClick={onRetry} variant="outline" size="sm">
                <RefreshCw className="h-3 w-3 mr-2" />
                Retry
              </Button>
            )}
            <Button 
              onClick={() => window.location.reload()} 
              variant="outline" 
              size="sm"
            >
              <Home className="h-3 w-3 mr-2" />
              Refresh Page
            </Button>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  </div>
);

export const CustomerErrorBoundary: React.FC<CustomerErrorBoundaryProps> = ({ 
  children, 
  onRetry 
}) => {
  return (
    <ErrorBoundary 
      fallback={<CustomerErrorFallback onRetry={onRetry} />}
      onError={(error, errorInfo) => {
        // Log customer-specific errors
        console.error('Customer management error:', {
          error: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack
        });
      }}
    >
      {children}
    </ErrorBoundary>
  );
};

export default CustomerErrorBoundary;