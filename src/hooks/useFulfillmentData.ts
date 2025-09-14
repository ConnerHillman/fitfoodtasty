import { useDataManager } from "./useDataManager";
import type { FulfillmentSetting, GlobalSchedule, DeliveryZone, CollectionPoint } from "@/types/fulfillment";

export const useFulfillmentData = () => {
  const settingsManager = useDataManager<FulfillmentSetting>("fulfillment_settings", {
    orderBy: { column: "setting_type", ascending: true }
  });

  const scheduleManager = useDataManager<GlobalSchedule>("global_fulfillment_schedule", {
    filters: [{ column: "is_active", operator: "eq", value: true }],
    orderBy: { column: "day_of_week", ascending: true }
  });

  const zonesManager = useDataManager<DeliveryZone>("delivery_zones", {
    orderBy: { column: "zone_name", ascending: true }
  });

  const pointsManager = useDataManager<CollectionPoint>("collection_points", {
    orderBy: { column: "point_name", ascending: true }
  });

  const fetchAllData = async () => {
    await Promise.all([
      settingsManager.refetch(),
      scheduleManager.refetch(),
      zonesManager.refetch(),
      pointsManager.refetch()
    ]);
  };

  return {
    settings: settingsManager.data,
    globalSchedule: scheduleManager.data,
    deliveryZones: zonesManager.data.map(zone => ({ ...zone, order_cutoffs: zone.order_cutoffs || {} })),
    collectionPoints: pointsManager.data,
    loading: settingsManager.loading || scheduleManager.loading || zonesManager.loading || pointsManager.loading,
    fetchAllData,
    fetchSettings: settingsManager.refetch,
    fetchGlobalSchedule: scheduleManager.refetch,
    fetchDeliveryZones: zonesManager.refetch,
    fetchCollectionPoints: pointsManager.refetch
  };
};