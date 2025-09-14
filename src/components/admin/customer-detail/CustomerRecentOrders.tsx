import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate, formatCurrency } from "@/lib/utils";
import OrderLink from "../OrderLink";
import OrderStatusBadge from "../OrderStatusBadge";

interface CustomerOrder {
  id: string;
  created_at: string;
  total_amount: number;
  status: string;
  type: 'order' | 'package_order';
  items?: number;
}

interface CustomerRecentOrdersProps {
  orders: CustomerOrder[];
  limit?: number;
}

export const CustomerRecentOrders = ({ orders, limit = 5 }: CustomerRecentOrdersProps) => {
  const recentOrders = orders.slice(0, limit);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Orders</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentOrders.length > 0 ? (
              recentOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono text-sm">
                    <OrderLink orderId={order.id}>
                      {order.id.slice(0, 8)}...
                    </OrderLink>
                  </TableCell>
                  <TableCell>
                    {formatDate(new Date(order.created_at), { 
                      month: 'short', 
                      day: 'numeric', 
                      year: 'numeric' 
                    })}
                  </TableCell>
                  <TableCell>
                    <span className="capitalize">
                      {order.type === 'package_order' ? 'Package' : 'Regular'}
                    </span>
                  </TableCell>
                  <TableCell>{order.items || 0}</TableCell>
                  <TableCell>{formatCurrency(order.total_amount)}</TableCell>
                  <TableCell>
                    <OrderStatusBadge status={order.status} />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-6">
                  No orders found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};