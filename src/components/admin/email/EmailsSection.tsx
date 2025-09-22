import { AdminTabsLayout, TabConfig } from "@/components/admin/common/AdminTabsLayout";
import { EmailTemplatesManager } from "@/components/admin/EmailTemplatesManager";
import { WelcomeEmailsManager } from "./WelcomeEmailsManager";
import { AuthEmailsManager } from "./AuthEmailsManager";
import { AbandonedCartsManager } from "./AbandonedCartsManager";
import { Mail, ShoppingCart, Heart, Shield, CheckCircle } from "lucide-react";


export const EmailsSection = () => {
  const emailTabs: TabConfig[] = [
    {
      value: "order-confirmation",
      label: "Order Confirmation",
      icon: Mail,
      content: <EmailTemplatesManager />
    },
    {
      value: "abandoned-cart", 
      label: "Abandoned Cart",
      icon: ShoppingCart,
      content: <AbandonedCartsManager />
    },
    {
      value: "welcome",
      label: "Welcome",
      icon: Heart,
      content: <WelcomeEmailsManager />
    },
    {
      value: "password-reset",
      label: "Password Reset",
      icon: Shield,
      content: <AuthEmailsManager />
    },
    {
      value: "verification",
      label: "Account Verification", 
      icon: CheckCircle,
      content: <AuthEmailsManager />
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Email Management</h2>
        <p className="text-muted-foreground">
          Manage all customer email communications from one place
        </p>
      </div>
      
      <AdminTabsLayout
        tabs={emailTabs}
        defaultValue="order-confirmation"
        className="space-y-6"
      />
    </div>
  );
};
