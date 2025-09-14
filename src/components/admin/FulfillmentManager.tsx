import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Clock, 
  Settings, 
  Truck, 
  Store
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import WeeklyScheduleManager from "./WeeklyScheduleManager";
import { useFulfillmentData } from "@/hooks/useFulfillmentData";
import { DeliveryZonesTab } from "./fulfillment/DeliveryZonesTab";
import { CollectionPointsTab } from "./fulfillment/CollectionPointsTab";

const FulfillmentManager = () => {
  const [activeTab, setActiveTab] = useState("schedule");
  const { toast } = useToast();
  
  const {
    settings,
    globalSchedule,
    deliveryZones,
    collectionPoints,
    loading,
    fetchDeliveryZones,
    fetchCollectionPoints,
    fetchGlobalSchedule
  } = useFulfillmentData();

  // Zone management
  const handleZoneSubmit = async (formData: any) => {
    try {
      const { error } = await supabase
        .from("delivery_zones")
        .upsert(formData);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Delivery zone saved successfully",
      });

      fetchDeliveryZones();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to save delivery zone",
        variant: "destructive",
      });
    }
  };

  // Collection point management
  const handleCollectionPointSubmit = async (formData: any) => {
    try {
      const { error } = await supabase
        .from("collection_points")
        .upsert(formData);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Collection point saved successfully",
      });

      fetchCollectionPoints();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to save collection point",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Settings className="h-5 w-5" />
        <h1 className="text-2xl font-bold">Fulfillment Management</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="schedule" className="flex items-center space-x-2">
            <Clock className="h-4 w-4" />
            <span>Schedule</span>
          </TabsTrigger>
          <TabsTrigger value="general" className="flex items-center space-x-2">
            <Settings className="h-4 w-4" />
            <span>General</span>
          </TabsTrigger>
          <TabsTrigger value="zones" className="flex items-center space-x-2">
            <Truck className="h-4 w-4" />
            <span>Delivery Zones</span>
          </TabsTrigger>
          <TabsTrigger value="collection" className="flex items-center space-x-2">
            <Store className="h-4 w-4" />
            <span>Collection Points</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="schedule" className="space-y-6">
          <WeeklyScheduleManager 
            globalSchedule={globalSchedule}
            deliveryZones={deliveryZones}
            onScheduleUpdate={fetchGlobalSchedule}
          />
        </TabsContent>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Time Slots</CardTitle>
              <CardDescription>
                Configure delivery time slot options
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {["morning", "afternoon", "evening"].map((slot) => (
                  <div key={slot} className="space-y-2">
                    <Label className="capitalize">{slot}</Label>
                    <Input
                      placeholder="09:00-12:00"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="zones" className="space-y-6">
          <DeliveryZonesTab
            deliveryZones={deliveryZones}
            globalSchedule={globalSchedule}
            onZoneSubmit={handleZoneSubmit}
          />
        </TabsContent>

        <TabsContent value="collection" className="space-y-6">
          <CollectionPointsTab
            collectionPoints={collectionPoints}
            globalSchedule={globalSchedule}
            onCollectionPointSubmit={handleCollectionPointSubmit}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FulfillmentManager;