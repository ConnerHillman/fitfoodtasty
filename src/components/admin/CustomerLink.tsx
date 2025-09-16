import React from 'react';
import { Button } from '@/components/ui/button';
import { useCustomerDetail } from '@/contexts/ModalContext';

interface CustomerLinkProps {
  customerId: string;
  customerName: string;
  customerData?: any; // Full customer object
  className?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
}

const CustomerLink: React.FC<CustomerLinkProps> = ({ 
  customerId, 
  customerName, 
  customerData,
  className = "",
  variant = "link",
  size = "sm"
}) => {
  const { open: openCustomerDetail } = useCustomerDetail();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    openCustomerDetail(customerData || { user_id: customerId, full_name: customerName });
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