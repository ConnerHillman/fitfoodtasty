import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { CustomerLoadingState } from "./CustomerLoadingState";
import { useCustomerDetail } from "@/contexts/ModalContext";
import type { Customer } from "@/types/customer";

interface ResponsiveCustomerTableProps {
  customers: Customer[];
  loading?: boolean;
}

export function ResponsiveCustomerTable({ customers, loading }: ResponsiveCustomerTableProps) {
  const { open: openCustomerDetail } = useCustomerDetail();

  if (loading) {
    return <CustomerLoadingState type="table" />;
  }

  if (customers.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No customers found matching your filters.</p>
      </div>
    );
  }

  return (
    <>
      {/* Desktop Table View */}
      <div className="hidden md:block">
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Orders</TableHead>
                <TableHead>Total Spent</TableHead>
                <TableHead>Last Order</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((customer) => (
                <TableRow 
                  key={customer.id}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => openCustomerDetail(customer)}
                >
                  <TableCell>
                    <div>
                      <span className="font-medium text-primary hover:underline">
                        {customer.full_name || 'Unknown'}
                      </span>
                      <div className="text-sm text-muted-foreground">{customer.email || 'No email'}</div>
                    </div>
                  </TableCell>
                  <TableCell>{customer.total_orders || 0}</TableCell>
                  <TableCell>£{(customer.total_spent || 0).toFixed(2)}</TableCell>
                  <TableCell>
                    {customer.last_order_date 
                      ? new Date(customer.last_order_date).toLocaleDateString()
                      : 'Never'
                    }
                  </TableCell>
                  <TableCell>{new Date(customer.created_at).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {customers.map((customer) => (
          <Card 
            key={customer.id}
            className="cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => openCustomerDetail(customer)}
          >
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-primary block truncate">
                    {customer.full_name || 'Unknown'}
                  </span>
                  {customer.email && (
                    <div className="text-sm text-muted-foreground truncate">{customer.email}</div>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Orders:</span>
                  <span className="ml-1 font-medium">{customer.total_orders || 0}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Spent:</span>
                  <span className="ml-1 font-medium">£{(customer.total_spent || 0).toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Last Order:</span>
                  <span className="ml-1">
                    {customer.last_order_date 
                      ? new Date(customer.last_order_date).toLocaleDateString()
                      : 'Never'
                    }
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Joined:</span>
                  <span className="ml-1">{new Date(customer.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}