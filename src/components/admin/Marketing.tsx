import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import ReferralSettingsAdmin from "@/components/admin/ReferralSettingsAdmin";
import { 
  Users, 
  Percent, 
  Gift, 
  Tag, 
  CreditCard, 
  TrendingUp, 
  ShoppingCart, 
  MessageSquare, 
  Mail,
  Clock,
  DollarSign
} from "lucide-react";

const Marketing = () => {
  const [activeTab, setActiveTab] = useState("leads");

  const LeadsSection = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Lead Management
        </CardTitle>
        <CardDescription>
          Track and manage potential customers
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Total Leads</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Converted</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Conversion Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0%</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const PromotionsSection = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Percent className="h-5 w-5" />
          Promotions
        </CardTitle>
        <CardDescription>
          Create and manage promotional campaigns
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Button>Create New Promotion</Button>
          <div className="text-sm text-muted-foreground">
            No active promotions
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const ReferralsSection = () => (
    <ReferralSettingsAdmin />
  );

  const CouponsSection = () => {
    const [coupons, setCoupons] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [searchFilter, setSearchFilter] = useState("");
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    // Fetch coupons on component load
    useEffect(() => {
      fetchCoupons();
    }, []);

    const fetchCoupons = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const { data, error: fetchError } = await supabase
          .from('coupons')
          .select('*')
          .order('created_at', { ascending: sortOrder === 'asc' });

        if (fetchError) throw fetchError;
        
        setCoupons(data || []);
      } catch (err) {
        console.error('Error fetching coupons:', err);
        setError('Failed to load coupons');
      } finally {
        setLoading(false);
      }
    };

    // Filter and sort coupons
    const filteredCoupons = coupons
      .filter(coupon => 
        coupon.code.toLowerCase().includes(searchFilter.toLowerCase())
      )
      .sort((a, b) => {
        const aDate = new Date(a.created_at).getTime();
        const bDate = new Date(b.created_at).getTime();
        return sortOrder === 'asc' ? aDate - bDate : bDate - aDate;
      });

    const toggleSort = () => {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    };

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Coupons
          </CardTitle>
          <CardDescription>
            Create and manage discount coupons
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <Button onClick={() => setShowCreateModal(true)}>
                Create New Coupon
              </Button>
              
              {/* Search Filter */}
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Search by code..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="w-48"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleSort}
                  className="whitespace-nowrap"
                >
                  Date {sortOrder === 'asc' ? '↑' : '↓'}
                </Button>
              </div>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="text-center py-8">
                <div className="text-sm text-muted-foreground">Loading coupons...</div>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="text-center py-8">
                <div className="text-sm text-destructive">{error}</div>
                <Button variant="outline" size="sm" onClick={fetchCoupons} className="mt-2">
                  Try Again
                </Button>
              </div>
            )}

            {/* Coupons Table */}
            {!loading && !error && (
              <div className="rounded-lg border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr className="border-b">
                        <th className="text-left p-3 font-medium">Code</th>
                        <th className="text-left p-3 font-medium">Discount %</th>
                        <th className="text-left p-3 font-medium">Active</th>
                        <th className="text-left p-3 font-medium">Created At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCoupons.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="text-center p-8 text-muted-foreground">
                            {searchFilter ? 'No coupons match your search' : 'No coupons created yet'}
                          </td>
                        </tr>
                      ) : (
                        filteredCoupons.map((coupon) => (
                          <tr key={coupon.id} className="border-b hover:bg-muted/20">
                            <td className="p-3">
                              <code className="px-2 py-1 bg-muted rounded text-sm font-mono">
                                {coupon.code}
                              </code>
                            </td>
                            <td className="p-3">
                              <span className="font-medium">{coupon.discount_percentage}%</span>
                            </td>
                            <td className="p-3">
                              <Badge 
                                variant={coupon.active ? "default" : "secondary"}
                                className={coupon.active ? "bg-green-100 text-green-800" : ""}
                              >
                                {coupon.active ? 'Active' : 'Inactive'}
                              </Badge>
                            </td>
                            <td className="p-3 text-sm text-muted-foreground">
                              {new Date(coupon.created_at).toLocaleDateString('en-GB', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Results Count */}
            {!loading && !error && filteredCoupons.length > 0 && (
              <div className="text-sm text-muted-foreground">
                Showing {filteredCoupons.length} of {coupons.length} coupons
              </div>
            )}
          </div>

          {/* Create Modal Placeholder */}
          {showCreateModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-96 max-w-[90vw]">
                <h3 className="text-lg font-semibold mb-4">Create New Coupon</h3>
                <p className="text-muted-foreground mb-4">
                  Coupon creation form will be implemented here.
                </p>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                    Cancel
                  </Button>
                  <Button disabled>
                    Create (Coming Soon)
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const GiftCardsSection = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Purchased Gift Cards
        </CardTitle>
        <CardDescription>
          View and manage gift card purchases
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Total Sold</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$0</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Active Cards</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Redeemed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const UpsalesSection = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Upsales
        </CardTitle>
        <CardDescription>
          Configure upselling opportunities
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch id="upsales-enabled" />
            <Label htmlFor="upsales-enabled">Enable Upsales</Label>
          </div>
          <Button>Configure Upsale Rules</Button>
        </div>
      </CardContent>
    </Card>
  );

  const AbandonedCartsSection = () => {
    const { toast } = useToast();
    const [settings, setSettings] = useState({
      email_enabled: "true",
      first_email_delay_hours: "1",
      second_email_delay_hours: "24", 
      third_email_delay_hours: "72"
    });
    const [stats, setStats] = useState({
      abandoned_carts_24h: 0,
      potential_revenue: 0,
      recovery_rate: 0
    });
    const [emailTemplates, setEmailTemplates] = useState<{
      first: { subject: string; html_content: string };
      second: { subject: string; html_content: string };
      third: { subject: string; html_content: string };
    }>({
      first: { subject: "", html_content: "" },
      second: { subject: "", html_content: "" },
      third: { subject: "", html_content: "" }
    });
    const [activeEmailTab, setActiveEmailTab] = useState("first");
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Load settings, stats, and templates
    useEffect(() => {
      loadSettings();
      loadStats();
      loadEmailTemplates();
    }, []);

    const loadSettings = async () => {
      try {
        const { data } = await supabase
          .from("abandoned_cart_settings")
          .select("*");

        if (data) {
          const settingsMap = data.reduce((acc, setting) => {
            acc[setting.setting_name] = setting.setting_value;
            return acc;
          }, {} as Record<string, string>);
          
          setSettings(prev => ({ ...prev, ...settingsMap }));
        }
      } catch (error) {
        console.error("Error loading settings:", error);
      }
    };

    const loadEmailTemplates = async () => {
      try {
        const { data } = await supabase
          .from("abandoned_cart_email_templates")
          .select("*");

        if (data) {
          const templatesMap = data.reduce((acc, template) => {
            acc[template.email_type] = {
              subject: template.subject,
              html_content: template.html_content
            };
            return acc;
          }, {} as Record<string, { subject: string; html_content: string }>);
          
          setEmailTemplates(prev => ({ ...prev, ...templatesMap }));
        }
      } catch (error) {
        console.error("Error loading email templates:", error);
      }
    };

    const loadStats = async () => {
      try {
        // Get abandoned carts from last 24h
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        const { data: carts } = await supabase
          .from("abandoned_carts")
          .select("total_amount, recovered_at")
          .gte("abandoned_at", yesterday.toISOString());

        if (carts) {
          const totalCarts = carts.length;
          const recoveredCarts = carts.filter(c => c.recovered_at).length;
          const potentialRevenue = carts.reduce((sum, cart) => sum + cart.total_amount, 0);
          const recoveryRate = totalCarts > 0 ? (recoveredCarts / totalCarts) * 100 : 0;

          setStats({
            abandoned_carts_24h: totalCarts,
            potential_revenue: potentialRevenue,
            recovery_rate: recoveryRate
          });
        }
      } catch (error) {
        console.error("Error loading stats:", error);
      }
    };

    const saveSettings = async () => {
      setIsSaving(true);
      try {
        // Update or insert settings
        for (const [key, value] of Object.entries(settings)) {
          const { error } = await supabase
            .from("abandoned_cart_settings")
            .upsert({
              setting_name: key,
              setting_value: value.toString(),
              description: getSettingDescription(key)
            }, {
              onConflict: "setting_name"
            });

          if (error) throw error;
        }

        toast({
          title: "Settings saved",
          description: "Abandoned cart settings have been updated successfully.",
        });
      } catch (error) {
        console.error("Error saving settings:", error);
        toast({
          title: "Error",
          description: "Failed to save settings. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsSaving(false);
      }
    };

    const saveEmailTemplate = async (emailType: string) => {
      setIsSaving(true);
      try {
        const template = emailTemplates[emailType as keyof typeof emailTemplates];
        
        const { error } = await supabase
          .from("abandoned_cart_email_templates")
          .upsert({
            email_type: emailType,
            subject: template.subject,
            html_content: template.html_content
          }, {
            onConflict: "email_type"
          });

        if (error) throw error;

        toast({
          title: "Email template saved",
          description: `${emailType} email template has been updated successfully.`,
        });
      } catch (error) {
        console.error("Error saving email template:", error);
        toast({
          title: "Error",
          description: "Failed to save email template. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsSaving(false);
      }
    };

    const testEmailSequence = async () => {
      setIsLoading(true);
      try {
        const { error } = await supabase.functions.invoke("abandoned-cart-recovery");
        
        if (error) throw error;

        toast({
          title: "Test initiated",
          description: "Email sequence test has been started. Check the logs for results.",
        });
      } catch (error) {
        console.error("Error testing emails:", error);
        toast({
          title: "Error",
          description: "Failed to test email sequence. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    const getSettingDescription = (key: string) => {
      const descriptions = {
        email_enabled: "Enable or disable abandoned cart email recovery",
        first_email_delay_hours: "Hours to wait before sending first recovery email",
        second_email_delay_hours: "Hours to wait before sending second recovery email", 
        third_email_delay_hours: "Hours to wait before sending final recovery email"
      };
      return descriptions[key as keyof typeof descriptions] || "";
    };

    const updateEmailTemplate = (emailType: string, field: string, value: string) => {
      setEmailTemplates(prev => ({
        ...prev,
        [emailType]: {
          ...prev[emailType as keyof typeof prev],
          [field]: value
        }
      }));
    };

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Abandoned Cart Recovery
          </CardTitle>
          <CardDescription>
            Recover lost sales with automated email campaigns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4" />
                    Abandoned (24h)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.abandoned_carts_24h}</div>
                  <div className="text-xs text-muted-foreground">Last 24 hours</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Potential Revenue
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">£{stats.potential_revenue.toFixed(0)}</div>
                  <div className="text-xs text-muted-foreground">Recovery opportunity</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Recovery Rate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.recovery_rate.toFixed(0)}%</div>
                  <div className="text-xs text-muted-foreground">Success rate</div>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="settings" className="space-y-4">
              <TabsList>
                <TabsTrigger value="settings">Settings</TabsTrigger>
                <TabsTrigger value="emails">Email Templates</TabsTrigger>
              </TabsList>

              <TabsContent value="settings" className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">Email Recovery System</h4>
                    <p className="text-sm text-muted-foreground">Automatically send recovery emails to abandoned carts</p>
                  </div>
                  <Switch 
                    checked={settings.email_enabled === "true"}
                    onCheckedChange={(checked) => 
                      setSettings(prev => ({ ...prev, email_enabled: checked.toString() }))
                    }
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first-email-delay">First Email (hours)</Label>
                    <Input
                      id="first-email-delay"
                      type="number"
                      value={settings.first_email_delay_hours}
                      onChange={(e) => setSettings(prev => ({ 
                        ...prev, 
                        first_email_delay_hours: e.target.value 
                      }))}
                      min="0.5"
                      step="0.5"
                    />
                    <p className="text-xs text-muted-foreground">Gentle reminder with cart contents</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="second-email-delay">Second Email (hours)</Label>
                    <Input
                      id="second-email-delay"
                      type="number"
                      value={settings.second_email_delay_hours}
                      onChange={(e) => setSettings(prev => ({ 
                        ...prev, 
                        second_email_delay_hours: e.target.value 
                      }))}
                      min="1"
                    />
                    <p className="text-xs text-muted-foreground">Social proof and benefits</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="third-email-delay">Final Email (hours)</Label>
                    <Input
                      id="third-email-delay"
                      type="number"
                      value={settings.third_email_delay_hours}
                      onChange={(e) => setSettings(prev => ({ 
                        ...prev, 
                        third_email_delay_hours: e.target.value 
                      }))}
                      min="1"
                    />
                    <p className="text-xs text-muted-foreground">Last chance with urgency</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={saveSettings}
                    disabled={isSaving}
                  >
                    {isSaving ? "Saving..." : "Save Settings"}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={testEmailSequence}
                    disabled={isLoading}
                  >
                    {isLoading ? "Testing..." : "Test Email Sequence"}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="emails" className="space-y-4">
                <div className="space-y-4">
                  <h4 className="font-semibold">Email Templates</h4>
                  <p className="text-sm text-muted-foreground">
                    Customize your email templates. Use <code>{"{{customer_name}}"}</code>, <code>{"{{cart_items}}"}</code>, and <code>{"{{total_amount}}"}</code> for dynamic content.
                  </p>
                  
                  <Tabs value={activeEmailTab} onValueChange={setActiveEmailTab}>
                    <TabsList>
                      <TabsTrigger value="first">First Email</TabsTrigger>
                      <TabsTrigger value="second">Second Email</TabsTrigger>
                      <TabsTrigger value="third">Third Email</TabsTrigger>
                    </TabsList>

                    {(['first', 'second', 'third'] as const).map((emailType) => (
                      <TabsContent key={emailType} value={emailType} className="space-y-4">
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor={`${emailType}-subject`}>Subject Line</Label>
                            <Input
                              id={`${emailType}-subject`}
                              value={emailTemplates[emailType].subject}
                              onChange={(e) => updateEmailTemplate(emailType, 'subject', e.target.value)}
                              placeholder="Enter email subject..."
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor={`${emailType}-content`}>Email Content (HTML)</Label>
                            <Textarea
                              id={`${emailType}-content`}
                              value={emailTemplates[emailType].html_content}
                              onChange={(e) => updateEmailTemplate(emailType, 'html_content', e.target.value)}
                              rows={15}
                              placeholder="Enter email HTML content..."
                              className="font-mono text-sm"
                            />
                          </div>
                          
                          <Button 
                            onClick={() => saveEmailTemplate(emailType)}
                            disabled={isSaving}
                          >
                            {isSaving ? "Saving..." : `Save ${emailType} Email`}
                          </Button>
                        </div>
                      </TabsContent>
                    ))}
                  </Tabs>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </CardContent>
      </Card>
    );
  };

  const CustomerSurveySection = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Customer Survey
        </CardTitle>
        <CardDescription>
          Collect customer feedback and insights
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch id="survey-enabled" />
            <Label htmlFor="survey-enabled">Enable Post-Order Surveys</Label>
          </div>
          <Button>Create Survey</Button>
        </div>
      </CardContent>
    </Card>
  );

  const FlodeskSection = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Flodesk Integration
        </CardTitle>
        <CardDescription>
          Connect your Flodesk account for email marketing and automation
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="flodesk-api">Flodesk API Key</Label>
            <Input id="flodesk-api" type="password" placeholder="Enter your Flodesk API key" />
            <div className="text-xs text-muted-foreground">
              Find your API key in Flodesk Settings → Integrations → API
            </div>
          </div>
          <Button>Connect Flodesk</Button>
          <div className="text-sm text-muted-foreground">
            Status: Not connected
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case "leads": return <LeadsSection />;
      case "promotions": return <PromotionsSection />;
      case "referrals": return <ReferralsSection />;
      case "coupons": return <CouponsSection />;
      case "gift-cards": return <GiftCardsSection />;
      case "upsales": return <UpsalesSection />;
      case "abandoned-carts": return <AbandonedCartsSection />;
      case "customer-survey": return <CustomerSurveySection />;
      case "flodesk": return <FlodeskSection />;
      default: return <LeadsSection />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <TrendingUp className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Marketing</h1>
          <p className="text-muted-foreground">Manage your marketing campaigns and customer engagement</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="relative bg-gradient-to-r from-background via-background/95 to-background backdrop-blur-sm border border-border/50 rounded-xl p-2 shadow-lg">
          <TabsList className="grid w-full grid-cols-9 bg-transparent gap-1 p-0 h-auto">
            <TabsTrigger 
              value="leads" 
              className="flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-300 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-md data-[state=active]:shadow-primary/20 hover:bg-muted/50 text-xs font-medium"
            >
              <Users className="h-3 w-3" />
              <span>Leads</span>
            </TabsTrigger>
            <TabsTrigger 
              value="promotions" 
              className="flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-300 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-md data-[state=active]:shadow-primary/20 hover:bg-muted/50 text-xs font-medium"
            >
              <Percent className="h-3 w-3" />
              <span>Promotions</span>
            </TabsTrigger>
            <TabsTrigger 
              value="referrals" 
              className="flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-300 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-md data-[state=active]:shadow-primary/20 hover:bg-muted/50 text-xs font-medium"
            >
              <Gift className="h-3 w-3" />
              <span>Referrals</span>
            </TabsTrigger>
            <TabsTrigger 
              value="coupons" 
              className="flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-300 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-md data-[state=active]:shadow-primary/20 hover:bg-muted/50 text-xs font-medium"
            >
              <Tag className="h-3 w-3" />
              <span>Coupons</span>
            </TabsTrigger>
            <TabsTrigger 
              value="gift-cards" 
              className="flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-300 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-md data-[state=active]:shadow-primary/20 hover:bg-muted/50 text-xs font-medium"
            >
              <CreditCard className="h-3 w-3" />
              <span>Gift Cards</span>
            </TabsTrigger>
            <TabsTrigger 
              value="upsales" 
              className="flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-300 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-md data-[state=active]:shadow-primary/20 hover:bg-muted/50 text-xs font-medium"
            >
              <TrendingUp className="h-3 w-3" />
              <span>Upsales</span>
            </TabsTrigger>
            <TabsTrigger 
              value="abandoned-carts" 
              className="flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-300 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-md data-[state=active]:shadow-primary/20 hover:bg-muted/50 text-xs font-medium"
            >
              <ShoppingCart className="h-3 w-3" />
              <span>Abandoned Carts</span>
            </TabsTrigger>
            <TabsTrigger 
              value="customer-survey" 
              className="flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-300 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-md data-[state=active]:shadow-primary/20 hover:bg-muted/50 text-xs font-medium"
            >
              <MessageSquare className="h-3 w-3" />
              <span>Survey</span>
            </TabsTrigger>
            <TabsTrigger 
              value="flodesk" 
              className="flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-300 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-md data-[state=active]:shadow-primary/20 hover:bg-muted/50 text-xs font-medium"
            >
              <Mail className="h-3 w-3" />
              <span>Flodesk</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="mt-6">
          {renderTabContent()}
        </div>
      </Tabs>
    </div>
  );
};

export default Marketing;