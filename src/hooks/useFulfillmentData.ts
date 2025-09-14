import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { FulfillmentSetting, GlobalSchedule, DeliveryZone, CollectionPoint } from "@/types/fulfillment";

export const useFulfillmentData = () => {
  const [settings, setSettings] = useState<FulfillmentSetting[]>([]);
  const [globalSchedule, setGlobalSchedule] = useState<GlobalSchedule[]>([]);
  const [deliveryZones, setDeliveryZones] = useState<DeliveryZone[]>([]);
  const [collectionPoints, setCollectionPoints] = useState<CollectionPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("fulfillment_settings")
        .select("*")
        .order("setting_type", { ascending: true });

      if (error) throw error;
      setSettings(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch fulfillment settings",
        variant: "destructive",
      });
    }
  };

  const fetchGlobalSchedule = async () => {
    try {
      const { data, error } = await supabase
        .from('global_fulfillment_schedule')
        .select('*')
        .eq('is_active', true)
        .order('day_of_week');
      
      if (error) throw error;
      setGlobalSchedule(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch global schedule",
        variant: "destructive",
      });
    }
  };

  const fetchDeliveryZones = async () => {
    try {
      const { data, error } = await supabase
        .from("delivery_zones")
        .select("*")
        .order("zone_name", { ascending: true });

      if (error) throw error;
      setDeliveryZones((data || []).map(zone => ({ ...zone, order_cutoffs: zone.order_cutoffs || {} })) as any);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch delivery zones",
        variant: "destructive",
      });
    }
  };

  const fetchCollectionPoints = async () => {
    try {
      const { data, error } = await supabase
        .from("collection_points")
        .select("*")
        .order("point_name", { ascending: true });

      if (error) throw error;
      setCollectionPoints(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch collection points",
        variant: "destructive",
      });
    }
  };

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchSettings(),
        fetchGlobalSchedule(),
        fetchDeliveryZones(),
        fetchCollectionPoints()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load fulfillment data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  return {
    settings,
    globalSchedule,
    deliveryZones,
    collectionPoints,
    loading,
    fetchAllData,
    fetchSettings,
    fetchGlobalSchedule,
    fetchDeliveryZones,
    fetchCollectionPoints
  };
};