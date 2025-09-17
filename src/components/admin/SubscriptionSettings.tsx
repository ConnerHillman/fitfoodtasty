import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Settings, Save } from "lucide-react";

interface SubscriptionSetting {
  id: string;
  setting_name: string;
  setting_value: string;
  description: string;
  is_active: boolean;
}

const SubscriptionSettings = () => {
  const [settings, setSettings] = useState<SubscriptionSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const [discountEnabled, setDiscountEnabled] = useState(false);
  const [discountPercentage, setDiscountPercentage] = useState(10);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("subscription_settings")
        .select("*")
        .order("setting_name");

      if (error) throw error;

      setSettings(data || []);
      
      // Update local state
      const enabledSetting = data?.find(s => s.setting_name === 'subscription_discount_enabled');
      const percentageSetting = data?.find(s => s.setting_name === 'subscription_discount_percentage');
      
      setDiscountEnabled(enabledSetting?.setting_value === 'true');
      setDiscountPercentage(parseInt(percentageSetting?.setting_value || '10'));
    } catch (error) {
      console.error("Error fetching subscription settings:", error);
      toast({
        title: "Error",
        description: "Failed to load subscription settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      console.log('Saving subscription settings:', { discountEnabled, discountPercentage });

      const updates = [
        {
          setting_name: 'subscription_discount_enabled',
          setting_value: discountEnabled.toString(),
          description: 'Enable subscription discount',
          is_active: true
        },
        {
          setting_name: 'subscription_discount_percentage',
          setting_value: discountPercentage.toString(),
          description: 'Subscription discount percentage (0-100)',
          is_active: true
        }
      ];

      for (const update of updates) {
        const { error } = await supabase
          .from("subscription_settings")
          .upsert(update, { onConflict: 'setting_name' });

        if (error) throw error;
      }

      console.log('Subscription settings saved successfully');

      toast({
        title: "Settings saved", 
        description: "Subscription discount settings have been updated successfully.",
      });

      // Wait a moment for database to update, then refetch
      await new Promise(resolve => setTimeout(resolve, 500));
      await fetchSettings();
    } catch (error) {
      console.error("Error saving subscription settings:", error);
      toast({
        title: "Error",
        description: "Failed to save subscription settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading subscription settings...</div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Subscription Discount Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="discount-enabled"
              checked={discountEnabled}
              onCheckedChange={setDiscountEnabled}
            />
            <Label htmlFor="discount-enabled">
              Enable subscription discount
            </Label>
          </div>
          
          {discountEnabled && (
            <div className="space-y-2">
              <Label htmlFor="discount-percentage">
                Discount percentage (%)
              </Label>
              <Input
                id="discount-percentage"
                type="number"
                min="0"
                max="100"
                value={discountPercentage}
                onChange={(e) => setDiscountPercentage(parseInt(e.target.value) || 0)}
                className="max-w-xs"
              />
              <p className="text-sm text-muted-foreground">
                Enter a percentage between 0 and 100
              </p>
            </div>
          )}
        </div>

        <div className="border-t pt-4">
          <h4 className="font-medium mb-2">Preview</h4>
          <div className="bg-muted p-4 rounded-lg">
            {discountEnabled && discountPercentage > 0 ? (
              <div className="text-center">
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-lg font-semibold">
                  Subscribe & SAVE {discountPercentage}%!
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  This message will appear at checkout when subscription is selected
                </p>
              </div>
            ) : (
              <p className="text-muted-foreground text-center">
                No discount message will be shown
              </p>
            )}
          </div>
        </div>

        <Button onClick={saveSettings} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Saving..." : "Save Settings"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default SubscriptionSettings;