import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrendingUp, Users, Star } from "lucide-react";
import { formatCurrency, formatMonthYear } from "@/lib/utils";

interface MonthlyRevenue {
  month: string;
  orders: number;
  revenue: number;
}

interface CustomerStats {
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  orderFrequency: number;
  daysSinceLastOrder?: number;
  customerLifetimeValue?: number;
}

interface CustomerAnalyticsProps {
  stats: CustomerStats | null;
  monthlyRevenue: MonthlyRevenue[];
}

export const CustomerAnalytics = ({ stats, monthlyRevenue }: CustomerAnalyticsProps) => {
  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customer Lifetime Value</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats?.customerLifetimeValue || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Projected value
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Order Frequency</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(stats?.orderFrequency || 0).toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground">
              orders per month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Days Since Last Order</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.daysSinceLastOrder !== undefined ? stats.daysSinceLastOrder : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              recency indicator
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Revenue Breakdown */}
      {monthlyRevenue.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Monthly Revenue Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Month</TableHead>
                  <TableHead>Orders</TableHead>
                  <TableHead>Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {monthlyRevenue.map((month) => (
                  <TableRow key={month.month}>
                    <TableCell>
                      {formatMonthYear(month.month + '-01')}
                    </TableCell>
                    <TableCell>{month.orders}</TableCell>
                    <TableCell>{formatCurrency(month.revenue)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};