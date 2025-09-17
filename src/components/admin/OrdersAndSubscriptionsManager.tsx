import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, Repeat } from "lucide-react";
import AllOrders from "@/pages/AllOrders";
import AdminSubscriptionsManager from "./AdminSubscriptionsManager";

const OrdersAndSubscriptionsManager = () => {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="orders" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="orders" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Orders
          </TabsTrigger>
          <TabsTrigger value="subscriptions" className="flex items-center gap-2">
            <Repeat className="h-4 w-4" />
            Subscriptions
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="orders" className="mt-6">
          <AllOrders />
        </TabsContent>
        
        <TabsContent value="subscriptions" className="mt-6">
          <AdminSubscriptionsManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OrdersAndSubscriptionsManager;