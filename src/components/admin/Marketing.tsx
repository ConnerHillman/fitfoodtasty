import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

  const CouponsSection = () => (
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
          <Button>Create New Coupon</Button>
          <div className="text-sm text-muted-foreground">
            No active coupons
          </div>
        </div>
      </CardContent>
    </Card>
  );

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

  const AbandonedCartsSection = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" />
          Abandoned Carts
        </CardTitle>
        <CardDescription>
          Recover lost sales with automated campaigns
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="flex items-center space-x-2">
            <Switch id="abandoned-cart-enabled" />
            <Label htmlFor="abandoned-cart-enabled">Enable Abandoned Cart Recovery</Label>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4" />
                  Total Abandoned
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <div className="text-xs text-muted-foreground">Last 30 days</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Recovery Value
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$0</div>
                <div className="text-xs text-muted-foreground">Potential revenue</div>
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
                <div className="text-2xl font-bold">0%</div>
                <div className="text-xs text-muted-foreground">Success rate</div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold">Email Campaign Settings</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first-email-delay">First Email Delay (hours)</Label>
                <Input id="first-email-delay" type="number" placeholder="1" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="second-email-delay">Second Email Delay (hours)</Label>
                <Input id="second-email-delay" type="number" placeholder="24" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="discount-offer">Discount Offer (%)</Label>
              <Input id="discount-offer" type="number" placeholder="10" />
              <div className="text-xs text-muted-foreground">
                Optional discount to include in recovery emails
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email-subject">Email Subject Line</Label>
              <Input id="email-subject" placeholder="Don't forget your items!" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email-template">Email Template</Label>
              <Textarea 
                id="email-template" 
                placeholder="Hi {customer_name}, you left some items in your cart..."
                rows={4}
              />
            </div>

            <Button>Save Settings</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

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