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
      
      const newSettings = {
        discountEnabled: enabledSetting?.setting_value === 'true',
        discountPercentage: parseInt(percentageSetting?.setting_value || '10'),
      };
      
      console.log('Subscription settings fetched:', newSettings);
      setSettings(newSettings);
    } catch (error) {
      console.error("Error fetching subscription settings:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();

    // Set up real-time subscription for settings changes
    const channel = supabase
      .channel('subscription-settings-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'subscription_settings',
          filter: 'setting_name=in.(subscription_discount_enabled,subscription_discount_percentage)'
        },
        (payload) => {
          console.log('Subscription settings changed:', payload);
          fetchSettings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    ...settings,
    loading,
    refetch: fetchSettings,
  };
};