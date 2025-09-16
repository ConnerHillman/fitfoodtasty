import { Badge } from "@/components/ui/badge";
import { Phone, MapPin, Clock, Star } from "lucide-react";
import { format } from "date-fns";
import CustomerLink from "../CustomerLink";
import { useCustomerDetail } from "@/contexts/ModalContext";
import type { Customer } from "@/types/customer";

interface CustomerCardViewProps {
  customers: Customer[];
  getCustomerValue: (customer: Customer) => "high" | "medium" | "low";
  loading?: boolean;
}

export function CustomerCardView({ customers, getCustomerValue, loading }: CustomerCardViewProps) {
  const { open: openCustomerDetail } = useCustomerDetail();
  const formatCurrency = (amount: number) => `£${amount.toFixed(2)}`;

  if (loading) {
    return (
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-48 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  if (customers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground">No customers found matching your filters.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {customers.map((customer) => (
        <div
          key={customer.id}
          role="button"
          tabIndex={0}
          onClick={() => openCustomerDetail(customer)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              openCustomerDetail(customer);
            }
          }}
          className="group relative overflow-hidden rounded-xl border border-border/50 bg-gradient-to-br from-card via-card/95 to-card/90 p-6 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 hover:border-primary/30 hover:scale-[1.02] cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {/* Premium badge for high-value customers */}
          {getCustomerValue(customer) === "high" && (
            <div className="absolute top-3 right-3">
              <Badge variant="default" className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-medium">
                <Star className="h-3 w-3 mr-1" />
                VIP
              </Badge>
            </div>
          )}

          {/* Customer Header */}
          <div className="space-y-3">
            <CustomerLink
              customerId={customer.user_id}
              customerName={customer.full_name}
              customerData={customer}
              variant="ghost"
              className="text-xl font-bold text-foreground hover:text-primary transition-colors duration-200 p-0 h-auto justify-start w-full"
            />
            
            <div className="text-sm text-muted-foreground">
              Customer since {format(new Date(customer.created_at), "MMM yyyy")}
            </div>
          </div>

          {/* Customer Stats */}
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="text-center p-3 rounded-lg bg-muted/30">
              <div className="text-lg font-bold text-primary">
                {customer.total_orders}
              </div>
              <div className="text-xs text-muted-foreground">
                Total Orders
              </div>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/30">
              <div className="text-lg font-bold text-green-600">
                {formatCurrency(customer.total_spent)}
              </div>
              <div className="text-xs text-muted-foreground">
                Total Spent
              </div>
            </div>
          </div>

          {/* Customer Details */}
          <div className="mt-4 space-y-2">
            {customer.phone && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-3 w-3" />
                <span>{customer.phone}</span>
              </div>
            )}
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span>{customer.city || 'No city'}, {customer.postal_code || 'No postcode'}</span>
            </div>

            {customer.last_order_date && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>Last order {format(new Date(customer.last_order_date), "MMM dd, yyyy")}</span>
              </div>
            )}
          </div>

          {/* Customer Value Badge */}
          <div className="mt-4 flex items-center justify-between">
            <Badge variant={
              getCustomerValue(customer) === "high" ? "default" :
              getCustomerValue(customer) === "medium" ? "secondary" : "outline"
            } className="text-xs">
              {getCustomerValue(customer) === "high" ? "High Value" :
               getCustomerValue(customer) === "medium" ? "Regular" : "New Customer"}
            </Badge>
          </div>
        </div>
      ))}
    </div>
  );
}