import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DeliveryZonesTab } from "./DeliveryZonesTab";
import { CollectionPointsTab } from "./CollectionPointsTab";
import { PostcodeTestingTool } from "./PostcodeTestingTool";
import { ZoneConflictDetector } from "./ZoneConflictDetector";
import WeeklyScheduleManager from "../WeeklyScheduleManager";
import { useFulfillmentData } from "@/hooks/useFulfillmentData";

interface FulfillmentDashboardProps {
  onZoneSubmit: (data: any) => void;
  onCollectionPointSubmit: (data: any) => void;
}

export function FulfillmentDashboard({ onZoneSubmit, onCollectionPointSubmit }: FulfillmentDashboardProps) {
  const { settings, globalSchedule, deliveryZones, collectionPoints, loading } = useFulfillmentData();

  if (loading) {
    return <div>Loading fulfillment data...</div>;
  }

  return (
    <Tabs defaultValue="zones" className="space-y-6">
      <TabsList>
        <TabsTrigger value="zones">Delivery Zones</TabsTrigger>
        <TabsTrigger value="collection">Collection Points</TabsTrigger>
        <TabsTrigger value="schedule">Schedule</TabsTrigger>
        <TabsTrigger value="testing">Testing Tools</TabsTrigger>
      </TabsList>

      <TabsContent value="zones" className="space-y-6">
        <DeliveryZonesTab
          deliveryZones={deliveryZones}
          globalSchedule={globalSchedule}
          onZoneSubmit={onZoneSubmit}
        />
      </TabsContent>

      <TabsContent value="collection" className="space-y-6">
        <CollectionPointsTab
          collectionPoints={collectionPoints}
          globalSchedule={globalSchedule}
          onCollectionPointSubmit={onCollectionPointSubmit}
        />
      </TabsContent>

      <TabsContent value="schedule" className="space-y-6">
        <WeeklyScheduleManager 
          globalSchedule={globalSchedule}
          deliveryZones={[]}
          onScheduleUpdate={() => {}}
        />
      </TabsContent>

      <TabsContent value="testing" className="space-y-6">
        <div className="grid gap-6">
          <PostcodeTestingTool />
          <ZoneConflictDetector />
        </div>
      </TabsContent>
    </Tabs>
  );
}