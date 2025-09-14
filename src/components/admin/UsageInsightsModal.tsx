import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface UsageInsightsModalProps {
  isVisible: boolean;
  onClose: () => void;
  selectedCouponUsage: any;
  usageStats: Record<string, number>;
  usageOrders: any[];
  loadingUsage: boolean;
}

const UsageInsightsModal = ({
  isVisible,
  onClose,
  selectedCouponUsage,
  usageStats,
  usageOrders,
  loadingUsage
}: UsageInsightsModalProps) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[80vh] overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">
              Usage Details: {selectedCouponUsage?.code}
            </h3>
            <Button 
              variant="outline" 
              size="sm"
              onClick={onClose}
            >
              Close
            </Button>
          </div>
          
          <div className="mb-4">
            <div className="text-sm text-muted-foreground">
              Total Uses: <span className="font-semibold">{usageStats[selectedCouponUsage?.code] || 0}</span>
              {" • "}
              Discount: <span className="font-semibold">{selectedCouponUsage?.discount_percentage}%</span>
            </div>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-y-auto max-h-96">
              {loadingUsage ? (
                <div className="p-8 text-center">
                  <div className="text-sm text-muted-foreground">Loading usage details...</div>
                </div>
              ) : usageOrders.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  No orders found for this coupon
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-muted/50 sticky top-0">
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium">Order ID</th>
                      <th className="text-left p-3 font-medium">Customer</th>
                      <th className="text-left p-3 font-medium">Total</th>
                      <th className="text-left p-3 font-medium">Status</th>
                      <th className="text-left p-3 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usageOrders.map((order) => (
                      <tr key={order.id} className="border-b hover:bg-muted/20">
                        <td className="p-3">
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {order.id.slice(0, 8)}...
                          </code>
                        </td>
                        <td className="p-3">
                          <div>
                            <div className="font-medium">{order.customer_name || 'Unknown'}</div>
                            <div className="text-xs text-muted-foreground">{order.customer_email}</div>
                          </div>
                        </td>
                        <td className="p-3">
                          <span className="font-medium">£{order.total_amount}</span>
                        </td>
                        <td className="p-3">
                          <Badge 
                            variant={order.status === 'completed' ? 'default' : 'secondary'}
                            className={order.status === 'completed' ? 'bg-green-100 text-green-800' : ''}
                          >
                            {order.status}
                          </Badge>
                        </td>
                        <td className="p-3 text-sm text-muted-foreground">
                          {new Date(order.created_at).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UsageInsightsModal;