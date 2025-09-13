import React from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface OrderLinkProps {
  orderId: string;
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
}

const OrderLink: React.FC<OrderLinkProps> = ({ 
  orderId, 
  children, 
  className = "",
  variant = "ghost",
  size = "sm"
}) => {
  const navigate = useNavigate();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/orders/${orderId}`);
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      className={`p-0 h-auto font-normal text-left justify-start hover:underline ${className}`}
    >
      {children}
    </Button>
  );
};

export default OrderLink;