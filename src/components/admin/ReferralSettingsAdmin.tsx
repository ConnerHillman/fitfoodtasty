import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Settings, Percent, Users, DollarSign, Calendar, Shield } from "lucide-react";

interface ReferralSetting {
  id: string;
  setting_name: string;
  setting_value: string;
  description: string;
}

const settingsSchema = z.object({
  referee_discount_percentage: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0 && Number(val) <= 100, {
    message: "Must be a number between 0 and 100"
  }),
  referrer_credit_percentage: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0 && Number(val) <= 100, {
    message: "Must be a number between 0 and 100"
  }),
  max_uses_per_code: z.string().refine((val) => !isNaN(Number(val)) && (Number(val) >= 1 || Number(val) === -1), {
    message: "Must be 1 or higher, or -1 for unlimited"
  }),
  max_credit_per_referrer: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
    message: "Must be a positive number"
  }),
  minimum_order_amount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
    message: "Must be a positive number"
  }),
  referral_system_active: z.boolean(),
  referral_expiry_days: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
    message: "Must be 0 or higher (0 = never expire)"
  }),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

const ReferralSettingsAdmin = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<ReferralSetting[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
  });

  const referralSystemActive = watch("referral_system_active");

  // Fetch current settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('referral_settings')
          .select('*')
          .order('setting_name');

        if (error) throw error;

        setSettings(data || []);

        // Set form values
        data?.forEach((setting) => {
          if (setting.setting_name === 'referral_system_active') {
            setValue(setting.setting_name as keyof SettingsFormData, setting.setting_value === 'true');
          } else {
            setValue(setting.setting_name as keyof SettingsFormData, setting.setting_value);
          }
        });
      } catch (error: any) {
        console.error('Error fetching settings:', error);
        toast.error("Failed to load settings");
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [setValue]);

  const onSubmit = async (data: SettingsFormData) => {
    setSaving(true);
    try {
      // Update each setting
      const updates = Object.entries(data).map(([key, value]) => ({
        setting_name: key,
        setting_value: typeof value === 'boolean' ? value.toString() : value.toString(),
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from('referral_settings')
          .update({ setting_value: update.setting_value })
          .eq('setting_name', update.setting_name);

        if (error) throw error;
      }

      toast.success("Referral settings updated successfully!");
    } catch (error: any) {
      console.error('Error updating settings:', error);
      toast.error("Failed to update settings. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Settings className="h-6 w-6" />
        <h2 className="text-2xl font-bold">Referral System Settings</h2>
        <Badge variant={referralSystemActive ? "default" : "secondary"}>
          {referralSystemActive ? "Active" : "Inactive"}
        </Badge>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* System Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>System Control</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Switch
                checked={referralSystemActive}
                onCheckedChange={(checked) => setValue("referral_system_active", checked)}
              />
              <Label htmlFor="referral_system_active">Enable Referral System</Label>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Turn the entire referral system on or off
            </p>
          </CardContent>
        </Card>

        {/* Discount & Credit Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Percent className="h-5 w-5" />
              <span>Reward Percentages</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="referee_discount_percentage">New Customer Discount (%)</Label>
                <Input
                  id="referee_discount_percentage"
                  {...register("referee_discount_percentage")}
                  placeholder="15"
                />
                {errors.referee_discount_percentage && (
                  <p className="text-sm text-destructive">{errors.referee_discount_percentage.message}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Discount percentage for customers using referral codes
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="referrer_credit_percentage">Referrer Credit (%)</Label>
                <Input
                  id="referrer_credit_percentage"
                  {...register("referrer_credit_percentage")}
                  placeholder="15"
                />
                {errors.referrer_credit_percentage && (
                  <p className="text-sm text-destructive">{errors.referrer_credit_percentage.message}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Store credit percentage referrers earn
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Usage & Limits */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Usage Limits</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="max_uses_per_code">Max Uses Per Customer</Label>
                <Input
                  id="max_uses_per_code"
                  {...register("max_uses_per_code")}
                  placeholder="1"
                />
                {errors.max_uses_per_code && (
                  <p className="text-sm text-destructive">{errors.max_uses_per_code.message}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  1 = first order only, -1 = unlimited
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="max_credit_per_referrer">Max Credit Per Referrer (£)</Label>
                <Input
                  id="max_credit_per_referrer"
                  {...register("max_credit_per_referrer")}
                  placeholder="500"
                />
                {errors.max_credit_per_referrer && (
                  <p className="text-sm text-destructive">{errors.max_credit_per_referrer.message}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Maximum total earnings per referrer
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Order & Timing Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5" />
              <span>Order Requirements</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minimum_order_amount">Minimum Order Amount (£)</Label>
                <Input
                  id="minimum_order_amount"
                  {...register("minimum_order_amount")}
                  placeholder="25"
                />
                {errors.minimum_order_amount && (
                  <p className="text-sm text-destructive">{errors.minimum_order_amount.message}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Minimum order value for referral benefits
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="referral_expiry_days">Code Expiry (Days)</Label>
                <Input
                  id="referral_expiry_days"
                  {...register("referral_expiry_days")}
                  placeholder="30"
                />
                {errors.referral_expiry_days && (
                  <p className="text-sm text-destructive">{errors.referral_expiry_days.message}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Days until codes expire (0 = never)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving Settings...
              </>
            ) : (
              "Save Settings"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ReferralSettingsAdmin;