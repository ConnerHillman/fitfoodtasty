import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Mail, Phone, MapPin, Calendar } from "lucide-react";
import { formatLongDate } from "@/lib/utils";

interface CustomerProfile {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  delivery_address: string;
  delivery_instructions: string;
  city: string;
  postal_code: string;
  county: string;
  created_at: string;
}

interface CustomerContactInfoProps {
  customer: CustomerProfile;
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
                <div className="font-medium">{customer.full_name}</div>
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
                  {formatLongDate(customer.created_at)}
                </div>
                <div className="text-sm text-muted-foreground">Customer Since</div>
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