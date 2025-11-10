import { useMemo } from "react";
import { useEnhancedDataManager } from "./useEnhancedDataManager";
import type { FulfillmentSetting, GlobalSchedule, DeliveryZone, CollectionPoint } from "@/types/fulfillment";
import type { DataManagerConfig } from "@/types/api";

export const useFulfillmentData = () => {
  const settingsConfig: DataManagerConfig = {
    orderBy: { column: "setting_type", ascending: true }
  };

  const scheduleConfig: DataManagerConfig = {
    filters: [{ column: "is_active", operator: "eq", value: true }],
    orderBy: { column: "day_of_week", ascending: true }
  };

  const zonesConfig: DataManagerConfig = {
    orderBy: { column: "zone_name", ascending: true }
  };

  const pointsConfig: DataManagerConfig = {
    orderBy: { column: "point_name", ascending: true }
  };

  const settingsManager = useEnhancedDataManager<FulfillmentSetting>("fulfillment_settings", settingsConfig);
  const scheduleManager = useEnhancedDataManager<GlobalSchedule>("global_fulfillment_schedule", scheduleConfig);
  const zonesManager = useEnhancedDataManager<DeliveryZone>("delivery_zones", zonesConfig);
  const pointsManager = useEnhancedDataManager<CollectionPoint>("collection_points", pointsConfig);

  const fetchAllData = async () => {
    await Promise.all([
      settingsManager.refetch(),
      scheduleManager.refetch(),
      zonesManager.refetch(),
      pointsManager.refetch()
    ]);
  };

  // Ensure order_cutoffs is always an object
  const deliveryZones = useMemo(() => 
    zonesManager.data.map(zone => ({ 
      ...zone, 
      order_cutoffs: zone.order_cutoffs || {} 
    })),
    [zonesManager.data]
  );

  const loading = settingsManager.loading || scheduleManager.loading || zonesManager.loading || pointsManager.loading;

  return {
    settings: settingsManager.data,
    globalSchedule: scheduleManager.data,
    deliveryZones,
    collectionPoints: pointsManager.data,
    loading,
    fetchAllData,
    
    // Individual refetch functions
    fetchSettings: settingsManager.refetch,
    fetchGlobalSchedule: scheduleManager.refetch,
    fetchDeliveryZones: zonesManager.refetch,
    fetchCollectionPoints: pointsManager.refetch,
    
    // CRUD operations
    updateSetting: settingsManager.update,
    updateSchedule: scheduleManager.update,
    updateZone: zonesManager.update,
    createZone: zonesManager.create,
    deleteZone: zonesManager.remove,
    updateCollectionPoint: pointsManager.update,
    createCollectionPoint: pointsManager.create,
    deleteCollectionPoint: pointsManager.remove
  };
};