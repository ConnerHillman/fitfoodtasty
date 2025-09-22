import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Package, Repeat, Plus } from "lucide-react";
import AllOrders from "@/pages/AllOrders";
import AdminSubscriptionsManager from "./AdminSubscriptionsManager";
import { ManualOrderModal } from "./ManualOrderModal";
import { useManualOrder } from "@/hooks/useManualOrder";

const OrdersAndSubscriptionsManager = () => {
  const manualOrder = useManualOrder();

  const handleOrderCreated = () => {
    // Trigger refresh in AllOrders component
    window.location.reload();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Orders & Subscriptions</h2>
        <Button onClick={manualOrder.openModal} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Manual Order
        </Button>
      </div>
      
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

      <ManualOrderModal
        open={manualOrder.showModal}
        onOpenChange={manualOrder.closeModal}
        onOrderCreated={handleOrderCreated}
      />
    </div>
  );
};

export default OrdersAndSubscriptionsManager;