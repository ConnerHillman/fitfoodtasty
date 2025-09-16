import { Users, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import AddCustomerDialog from "../AddCustomerDialog";
import { CustomerErrorBoundary } from "@/components/common/CustomerErrorBoundary";

interface CustomerHeaderProps {
  onRefresh: () => void;
  isRefreshing?: boolean;
}

export function CustomerHeader({ onRefresh, isRefreshing = false }: CustomerHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <Users className="h-8 w-8 text-primary" />
        <div>
          <h2 className="text-2xl font-bold">Customer Management</h2>
          <p className="text-muted-foreground">View and manage your customer base</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <CustomerErrorBoundary>
          <AddCustomerDialog onCustomerAdded={onRefresh} />
        </CustomerErrorBoundary>
        <Button 
          onClick={onRefresh} 
          variant="outline" 
          size="sm"
          disabled={isRefreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
    </div>
  );
}