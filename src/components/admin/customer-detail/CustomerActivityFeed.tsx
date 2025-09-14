import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Activity, Eye } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

interface ActivityItem {
  id: string;
  created_at: string;
  type: 'view' | 'cart_abandoned' | 'order';
  page?: string;
  total_amount?: number;
}

interface CustomerActivityFeedProps {
  activities: ActivityItem[];
}

export const CustomerActivityFeed = ({ activities }: CustomerActivityFeedProps) => {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'view':
        return <Eye className="h-4 w-4" />;
      case 'cart_abandoned':
        return <Activity className="h-4 w-4 text-orange-500" />;
      case 'order':
        return <Activity className="h-4 w-4 text-green-500" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getActivityDescription = (activity: ActivityItem) => {
    switch (activity.type) {
      case 'view':
        return `Viewed ${activity.page || 'a page'}`;
      case 'cart_abandoned':
        return `Abandoned cart (£${activity.total_amount?.toFixed(2) || '0.00'})`;
      case 'order':
        return `Placed order (£${activity.total_amount?.toFixed(2) || '0.00'})`;
      default:
        return 'Unknown activity';
    }
  };

  const getActivityBadge = (type: string) => {
    switch (type) {
      case 'view':
        return <Badge variant="secondary">View</Badge>;
      case 'cart_abandoned':
        return <Badge variant="destructive">Abandoned</Badge>;
      case 'order':
        return <Badge variant="default">Order</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Activity</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Date & Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activities.map((activity) => (
                <TableRow key={activity.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getActivityIcon(activity.type)}
                      <span>{getActivityDescription(activity)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getActivityBadge(activity.type)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDateTime(activity.created_at)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center text-muted-foreground py-6">
            No recent activity found
          </div>
        )}
      </CardContent>
    </Card>
  );
};