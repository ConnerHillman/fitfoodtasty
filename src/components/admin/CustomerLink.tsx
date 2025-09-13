import React from 'react';
import { Button } from '@/components/ui/button';
import { useCustomerDetail } from '@/contexts/CustomerDetailContext';

interface CustomerLinkProps {
  customerId: string;
  customerName: string;
  className?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
}

const CustomerLink: React.FC<CustomerLinkProps> = ({ 
  customerId, 
  customerName, 
  className = "",
  variant = "link",
  size = "sm"
}) => {
  const { openCustomerDetail } = useCustomerDetail();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    openCustomerDetail(customerId);
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      className={`p-0 h-auto font-bold text-foreground text-left justify-start hover:underline hover:text-foreground ${className}`}
    >
      {customerName}
    </Button>
  );
};

export default CustomerLink;