import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface SubscriptionSettings {
  discountEnabled: boolean;
  discountPercentage: number;
}

export const useSubscriptionSettings = () => {
  const [settings, setSettings] = useState<SubscriptionSettings>({
    discountEnabled: false,
    discountPercentage: 10,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("subscription_settings")
        .select("setting_name, setting_value")
        .in("setting_name", ["subscription_discount_enabled", "subscription_discount_percentage"]);

      if (error) throw error;

      const enabledSetting = data?.find(s => s.setting_name === 'subscription_discount_enabled');
      const percentageSetting = data?.find(s => s.setting_name === 'subscription_discount_percentage');
      
      setSettings({
        discountEnabled: enabledSetting?.setting_value === 'true',
        discountPercentage: parseInt(percentageSetting?.setting_value || '10'),
      });
    } catch (error) {
      console.error("Error fetching subscription settings:", error);
    } finally {
      setLoading(false);
    }
  };

  return {
    ...settings,
    loading,
    refetch: fetchSettings,
  };
};