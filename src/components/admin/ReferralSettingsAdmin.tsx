import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Settings, Percent, Users, DollarSign, Calendar, Shield, BarChart3, Search, Download } from "lucide-react";
import { format } from "date-fns";

interface ReferralSetting {
  id: string;
  setting_name: string;
  setting_value: string;
  description: string;
}

interface ReferralData {
  id: string;
  referrer_user_id: string;
  referee_user_id: string;
  order_id: string;
  referral_code_used: string;
  referrer_credit_earned: number;
  referee_discount_given: number;
  order_total: number;
  created_at: string;
  referrer_email: string;
  referee_email: string;
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
  
  // Reports state
  const [referrals, setReferrals] = useState<ReferralData[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPeriod, setFilterPeriod] = useState("all");

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

  useEffect(() => {
    fetchReferralData();
  }, [filterPeriod]);

  const fetchReferralData = async () => {
    setReportsLoading(true);
    try {
      let query = supabase
        .from('referral_transactions')
        .select('*')
        .order('created_at', { ascending: false });

      if (filterPeriod !== "all") {
        const now = new Date();
        let startDate = new Date();
        
        switch (filterPeriod) {
          case "7days":
            startDate.setDate(now.getDate() - 7);
            break;
          case "30days":
            startDate.setDate(now.getDate() - 30);
            break;
          case "90days":
            startDate.setDate(now.getDate() - 90);
            break;
        }
        
        query = query.gte('created_at', startDate.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;

      const referralData = data || [];
      const userIds = [...new Set([
        ...referralData.map(r => r.referrer_user_id),
        ...referralData.map(r => r.referee_user_id)
      ])];

      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', userIds);

      const transformedData = referralData.map(item => ({
        ...item,
        referrer_email: profiles?.find(p => p.user_id === item.referrer_user_id)?.full_name || `User ${item.referrer_user_id.slice(0, 8)}`,
        referee_email: profiles?.find(p => p.user_id === item.referee_user_id)?.full_name || `User ${item.referee_user_id.slice(0, 8)}`
      }));

      setReferrals(transformedData);
    } catch (error) {
      console.error('Error fetching referral data:', error);
    } finally {
      setReportsLoading(false);
    }
  };

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

  const filteredReferrals = referrals.filter(referral =>
    referral.referral_code_used.toLowerCase().includes(searchTerm.toLowerCase()) ||
    referral.referrer_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    referral.referee_email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalStats = {
    totalReferrals: filteredReferrals.length,
    totalRevenue: filteredReferrals.reduce((sum, r) => sum + Number(r.order_total), 0),
    totalCreditsEarned: filteredReferrals.reduce((sum, r) => sum + Number(r.referrer_credit_earned), 0),
    totalDiscountsGiven: filteredReferrals.reduce((sum, r) => sum + Number(r.referee_discount_given), 0)
  };

  const exportToCSV = () => {
    const headers = [
      'Date',
      'Referral Code',
      'Referrer Email',
      'Referee Email',
      'Order Total',
      'Credit Earned',
      'Discount Given'
    ];

    const csvData = filteredReferrals.map(referral => [
      format(new Date(referral.created_at), 'yyyy-MM-dd'),
      referral.referral_code_used,
      referral.referrer_email,
      referral.referee_email,
      referral.order_total,
      referral.referrer_credit_earned,
      referral.referee_discount_given
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `referral-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Tabs defaultValue="settings" className="space-y-6">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="settings" className="flex items-center space-x-2">
          <Settings className="h-4 w-4" />
          <span>Settings</span>
        </TabsTrigger>
        <TabsTrigger value="reports" className="flex items-center space-x-2">
          <BarChart3 className="h-4 w-4" />
          <span>Reports</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="settings">
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
      </TabsContent>

      <TabsContent value="reports">
        <div className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="text-2xl font-bold">{totalStats.totalReferrals}</div>
                <p className="text-sm text-muted-foreground">Total Referrals</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="text-2xl font-bold">£{totalStats.totalRevenue.toFixed(2)}</div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="text-2xl font-bold">£{totalStats.totalCreditsEarned.toFixed(2)}</div>
                <p className="text-sm text-muted-foreground">Credits Earned</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="text-2xl font-bold">£{totalStats.totalDiscountsGiven.toFixed(2)}</div>
                <p className="text-sm text-muted-foreground">Discounts Given</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters and Controls */}
          <Card>
            <CardHeader>
              <CardTitle>Referral Transactions</CardTitle>
              <CardDescription>Track and analyze referral program performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4 mb-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search by code, referrer, or referee..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <Select value={filterPeriod} onValueChange={setFilterPeriod}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="7days">Last 7 Days</SelectItem>
                    <SelectItem value="30days">Last 30 Days</SelectItem>
                    <SelectItem value="90days">Last 90 Days</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button onClick={exportToCSV} variant="outline" disabled={reportsLoading}>
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </div>

              {/* Referrals Table */}
              <div className="rounded-md border">
                {reportsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                      <p>Loading referral data...</p>
                    </div>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Referral Code</TableHead>
                        <TableHead>Referrer</TableHead>
                        <TableHead>Referee</TableHead>
                        <TableHead>Order Total</TableHead>
                        <TableHead>Credit Earned</TableHead>
                        <TableHead>Discount Given</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredReferrals.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8">
                            No referral transactions found
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredReferrals.map((referral) => (
                          <TableRow key={referral.id}>
                            <TableCell>
                              {format(new Date(referral.created_at), 'MMM dd, yyyy')}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{referral.referral_code_used}</Badge>
                            </TableCell>
                            <TableCell className="font-medium">
                              {referral.referrer_email}
                            </TableCell>
                            <TableCell>{referral.referee_email}</TableCell>
                            <TableCell>£{Number(referral.order_total).toFixed(2)}</TableCell>
                            <TableCell className="text-green-600">
                              £{Number(referral.referrer_credit_earned).toFixed(2)}
                            </TableCell>
                            <TableCell className="text-blue-600">
                              £{Number(referral.referee_discount_given).toFixed(2)}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>
    </Tabs>
  );
};

export default ReferralSettingsAdmin;