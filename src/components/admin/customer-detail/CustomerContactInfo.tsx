import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Mail, Phone, MapPin, Calendar } from "lucide-react";
import { formatLongDate, safeParseDate } from "@/lib/utils";
import { getDisplayName } from "@/lib/displayName";
import type { CustomerProfile } from "@/types/customer";

interface CustomerContactInfoProps {
  customer: CustomerProfile | null;
  email?: string;
}

export const CustomerContactInfo = ({ customer, email }: CustomerContactInfoProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Contact Information</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="font-medium">
                  {getDisplayName({ 
                    first_name: customer?.first_name, 
                    last_name: customer?.last_name, 
                    full_name: customer?.full_name,
                    email 
                  }, 'Unknown')}
                </div>
                <div className="text-sm text-muted-foreground">Full Name</div>
              </div>
            </div>

            {email && (
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="font-medium">{email}</div>
                  <div className="text-sm text-muted-foreground">Email Address</div>
                </div>
              </div>
            )}

            {customer.phone && (
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="font-medium">{customer.phone}</div>
                  <div className="text-sm text-muted-foreground">Phone Number</div>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="font-medium">
                  {safeParseDate(customer.created_at) ? formatLongDate(customer.created_at) : "—"}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground mt-1" />
              <div>
                <div className="font-medium">Delivery Address</div>
                <div className="text-sm text-muted-foreground whitespace-pre-line">
                  {customer.delivery_address}
                  {customer.city && `\n${customer.city}`}
                  {customer.postal_code && `, ${customer.postal_code}`}
                  {customer.county && `\n${customer.county}`}
                </div>
                {customer.delivery_instructions && (
                  <div className="mt-2 p-2 bg-muted/30 rounded text-sm">
                    <div className="font-medium text-muted-foreground mb-1">Delivery Instructions:</div>
                    <div>{customer.delivery_instructions}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};