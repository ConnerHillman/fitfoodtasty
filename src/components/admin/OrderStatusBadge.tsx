import React from 'react';
import { Badge } from '@/components/ui/badge';

interface OrderStatusBadgeProps {
  status: string;
  className?: string;
}

const OrderStatusBadge: React.FC<OrderStatusBadgeProps> = ({ status, className = "" }) => {
  const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return 'confirmed';
      case 'completed':
        return 'completed';
      case 'cancelled':
        return 'cancelled';
      case 'pending':
        return 'pending';
      case 'preparing':
        return 'preparing';
      default:
        return 'secondary'; // fallback for unknown statuses
    }
  };

  return (
    <Badge 
      variant={getStatusVariant(status) as any}
      className={className}
    >
      {status}
    </Badge>
  );
};

export default OrderStatusBadge;