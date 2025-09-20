import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useDeliveryLogic = () => {
  const { user } = useAuth();
  const [deliveryMethod, setDeliveryMethod] = useState<"delivery" | "pickup">("delivery");
  const [selectedCollectionPoint, setSelectedCollectionPoint] = useState<string>("");
  const [collectionPoints, setCollectionPoints] = useState<any[]>([]);
  const [deliveryFee, setDeliveryFee] = useState(5.99);
  const [deliveryZone, setDeliveryZone] = useState<any>(null);
  const [userPostcode, setUserPostcode] = useState<string>("");
  const [manualPostcode, setManualPostcode] = useState<string>("");
  const [postcodeChecked, setPostcodeChecked] = useState<boolean>(false);

  // Fetch collection points
  useEffect(() => {
    const fetchCollectionPoints = async () => {
      try {
        const { data, error } = await supabase
          .from('collection_points')
          .select('*')
          .eq('is_active', true)
          .order('point_name', { ascending: true });
        
        if (error) throw error;
        setCollectionPoints(data || []);
        
        // Auto-select first collection point if available
        if (data && data.length > 0) {
          setSelectedCollectionPoint(data[0].id);
        }
      } catch (error) {
        console.error('Failed to fetch collection points:', error);
      }
    };

    fetchCollectionPoints();
  }, []);

  // Memoized function to fetch delivery zone by postcode with priority-based matching
  const fetchDeliveryZoneByPostcode = useCallback(async (postcode: string) => {
    if (!postcode) return;
    
    try {
      // Use the new prioritized delivery zone function
      const { data: zones, error: zonesError } = await supabase
        .rpc('get_delivery_zone_for_postcode_prioritized', {
          customer_postcode: postcode
        });

      if (zonesError) throw zonesError;

      // Get the highest priority zone (first in the sorted results)
      const prioritizedZone = zones?.[0];

      if (prioritizedZone) {
        // Fetch full zone details
        const { data: fullZone, error: fullZoneError } = await supabase
          .from('delivery_zones')
          .select('*')
          .eq('id', prioritizedZone.zone_id)
          .single();

        if (fullZoneError) throw fullZoneError;

        console.log(`Postcode ${postcode} matched to zone: ${prioritizedZone.zone_name} (priority: ${prioritizedZone.priority}, match: ${prioritizedZone.match_type})`);
        
        setDeliveryZone({ ...fullZone, match_type: prioritizedZone.match_type, priority: prioritizedZone.priority });
        setPostcodeChecked(true);
        if (prioritizedZone.delivery_fee) setDeliveryFee(prioritizedZone.delivery_fee);
      } else {
        console.log(`No delivery zone found for postcode: ${postcode}`);
        setDeliveryZone(null);
        setPostcodeChecked(true);
      }
    } catch (error) {
      console.error('Failed to fetch delivery zone:', error);
      setPostcodeChecked(true);
    }
  }, []);

  // Fetch user profile and delivery zone
  useEffect(() => {
    const fetchUserDeliveryZone = async () => {
      if (!user) return;
      
      try {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('postal_code')
          .eq('user_id', user.id)
          .single();

        if (profileError) throw profileError;
        
        const postcode = profile?.postal_code || user.user_metadata?.postal_code;
        if (postcode) {
          setUserPostcode(postcode);
          setManualPostcode(postcode);
          await fetchDeliveryZoneByPostcode(postcode);
        }
      } catch (error) {
        console.error('Failed to fetch user delivery zone:', error);
      }
    };

    fetchUserDeliveryZone();
  }, [user]);

  // Fetch delivery fee from settings
  useEffect(() => {
    const fetchDeliveryFee = async () => {
      try {
        const { data: generalRow } = await supabase
          .from('fulfillment_settings')
          .select('setting_value')
          .eq('setting_type', 'general')
          .eq('setting_key', 'default_delivery_fee')
          .single();

        if (generalRow?.setting_value !== undefined) {
          const possible = (generalRow as any).setting_value as any;
          const val = typeof possible === 'object' && possible !== null && 'value' in possible
            ? possible.value
            : possible;
          const num = typeof val === 'number' ? val : parseFloat(String(val));
          if (!Number.isNaN(num)) {
            setDeliveryFee(num);
            return;
          }
        }

        // Legacy fallback
        const { data: legacyRow } = await supabase
          .from('fulfillment_settings')
          .select('setting_value')
          .eq('setting_type', 'fees')
          .eq('setting_key', 'delivery_fee')
          .single();

        if (legacyRow?.setting_value !== undefined) {
          const num = typeof legacyRow.setting_value === 'number'
            ? legacyRow.setting_value
            : parseFloat(String(legacyRow.setting_value));
          if (!Number.isNaN(num)) setDeliveryFee(num);
        }
      } catch (e) {
        // leave default on error
      }
    };

    fetchDeliveryFee();
  }, []);

  // Memoized handle manual postcode input
  const handlePostcodeChange = useCallback(async (postcode: string) => {
    setManualPostcode(postcode);
    setPostcodeChecked(false);
    if (postcode.length >= 4) {
      await fetchDeliveryZoneByPostcode(postcode);
    }
  }, [fetchDeliveryZoneByPostcode]);

  const getCollectionFee = useCallback(() => {
    const collectionPoint = collectionPoints.find(cp => cp.id === selectedCollectionPoint);
    return collectionPoint?.collection_fee || 0;
  }, [collectionPoints, selectedCollectionPoint]);

  return {
    deliveryMethod,
    setDeliveryMethod,
    selectedCollectionPoint,
    setSelectedCollectionPoint,
    collectionPoints,
    deliveryFee,
    deliveryZone,
    userPostcode,
    manualPostcode,
    postcodeChecked,
    handlePostcodeChange,
    getCollectionFee,
  };
};