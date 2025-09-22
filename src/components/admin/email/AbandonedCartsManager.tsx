import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ShoppingCart, DollarSign, TrendingUp } from "lucide-react";

export const AbandonedCartsManager = () => {
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
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Abandoned Cart Recovery</h3>
        <p className="text-sm text-muted-foreground">
          Recover lost sales with automated email campaigns
        </p>
      </div>

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
          <Card>
            <CardHeader>
              <CardTitle>Recovery Settings</CardTitle>
              <CardDescription>Configure automated cart recovery behavior</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="emails" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Email Templates</CardTitle>
              <CardDescription>
                Customize your email templates. Use <code>{"{{customer_name}}"}</code>, <code>{"{{cart_items}}"}</code>, and <code>{"{{total_amount}}"}</code> for dynamic content.
              </CardDescription>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};