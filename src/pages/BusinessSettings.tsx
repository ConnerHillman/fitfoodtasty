import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { CalendarIcon, Building2, Truck, ChefHat, CreditCard, Bell, Users } from 'lucide-react';

const businessProfileSchema = z.object({
  business_name: z.string().min(1, 'Business name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(1, 'Phone number is required'),
  address: z.string().min(1, 'Address is required'),
  operating_hours_start: z.string(),
  operating_hours_end: z.string(),
  description: z.string().optional(),
});

const deliverySettingsSchema = z.object({
  delivery_fee: z.string().min(0, 'Delivery fee must be 0 or greater'),
  max_delivery_distance: z.string().min(1),
  minimum_order_value: z.string().min(0),
});

const kitchenSettingsSchema = z.object({
  prep_lead_time_hours: z.string().min(1),
  daily_meal_capacity: z.string().min(1),
  prep_start_time: z.string(),
  cutoff_time: z.string(),
  kitchen_notes: z.string().optional(),
});

type BusinessProfileData = z.infer<typeof businessProfileSchema>;
type DeliverySettingsData = z.infer<typeof deliverySettingsSchema>;
type KitchenSettingsData = z.infer<typeof kitchenSettingsSchema>;

const BusinessSettings = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<any>(null);

  const businessForm = useForm<BusinessProfileData>({
    resolver: zodResolver(businessProfileSchema),
    defaultValues: {
      business_name: '',
      email: '',
      phone: '',
      address: '',
      operating_hours_start: '09:00',
      operating_hours_end: '18:00',
      description: '',
    },
  });

  const deliveryForm = useForm<DeliverySettingsData>({
    resolver: zodResolver(deliverySettingsSchema),
    defaultValues: {
      max_delivery_distance: '15',
      minimum_order_value: '25.00',
    },
  });

  const kitchenForm = useForm<KitchenSettingsData>({
    resolver: zodResolver(kitchenSettingsSchema),
    defaultValues: {
      prep_lead_time_hours: '24',
      daily_meal_capacity: '100',
      prep_start_time: '06:00',
      cutoff_time: '20:00',
      kitchen_notes: '',
    },
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      // Since we don't have a business_settings table, we'll use localStorage for now
      const saved = localStorage.getItem('business_settings');
      if (saved) {
        const data = JSON.parse(saved);
        businessForm.reset(data.business || {});
        deliveryForm.reset(data.delivery || {});
        kitchenForm.reset(data.kitchen || {});
        setSettings(data);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const saveSettings = async (section: string, data: any) => {
    setLoading(true);
    try {
      const current = settings || {};
      const updated = { ...current, [section]: data };
      
      // Save to localStorage for now
      localStorage.setItem('business_settings', JSON.stringify(updated));
      setSettings(updated);
      
      toast({
        title: "Settings Saved",
        description: `${section.charAt(0).toUpperCase() + section.slice(1)} settings have been updated successfully.`,
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center space-x-4">
        <Building2 className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Business Settings</h1>
          <p className="text-muted-foreground">Configure your meal prep business settings</p>
        </div>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="profile" className="flex items-center space-x-2">
            <Building2 className="h-4 w-4" />
            <span>Profile</span>
          </TabsTrigger>
          <TabsTrigger value="delivery" className="flex items-center space-x-2">
            <Truck className="h-4 w-4" />
            <span>Delivery</span>
          </TabsTrigger>
          <TabsTrigger value="kitchen" className="flex items-center space-x-2">
            <ChefHat className="h-4 w-4" />
            <span>Kitchen</span>
          </TabsTrigger>
          <TabsTrigger value="payment" className="flex items-center space-x-2">
            <CreditCard className="h-4 w-4" />
            <span>Payment</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center space-x-2">
            <Bell className="h-4 w-4" />
            <span>Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>Users</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Business Profile</CardTitle>
              <CardDescription>
                Update your business information and operating hours
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...businessForm}>
                <form onSubmit={businessForm.handleSubmit((data) => saveSettings('business', data))} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={businessForm.control}
                      name="business_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Business Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Fit Food Tasty" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={businessForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="info@fitfoodtasty.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={businessForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone</FormLabel>
                          <FormControl>
                            <Input placeholder="+44 20 1234 5678" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={businessForm.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Business Address</FormLabel>
                          <FormControl>
                            <Input placeholder="123 Kitchen Street, London" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <FormField
                      control={deliveryForm.control}
                      name="max_delivery_distance"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Max Delivery Distance (miles)</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Button type="submit" disabled={loading}>
                    Save Delivery Settings
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="kitchen">
          <Card>
            <CardHeader>
              <CardTitle>Kitchen Operations</CardTitle>
              <CardDescription>
                Configure prep schedules, capacity, and operational settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...kitchenForm}>
                <form onSubmit={kitchenForm.handleSubmit((data) => saveSettings('kitchen', data))} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={kitchenForm.control}
                      name="prep_lead_time_hours"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Prep Lead Time (hours)</FormLabel>
                          <FormControl>
                            <Input type="number" min="1" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={kitchenForm.control}
                      name="daily_meal_capacity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Daily Meal Capacity</FormLabel>
                          <FormControl>
                            <Input type="number" min="1" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={kitchenForm.control}
                      name="prep_start_time"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Kitchen Prep Start Time</FormLabel>
                          <FormControl>
                            <Input type="time" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={kitchenForm.control}
                      name="cutoff_time"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Order Cutoff Time</FormLabel>
                          <FormControl>
                            <Input type="time" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={kitchenForm.control}
                    name="kitchen_notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Kitchen Notes</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Any special notes for kitchen operations..."
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" disabled={loading}>
                    Save Kitchen Settings
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payment">
          <Card>
            <CardHeader>
              <CardTitle>Payment & Pricing</CardTitle>
              <CardDescription>
                Configure payment methods and pricing rules
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="text-lg font-medium">Payment Methods</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Stripe Payments</label>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Cash on Delivery</label>
                    <Switch />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Bank Transfer</label>
                    <Switch />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-lg font-medium">Tax Settings</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">VAT Rate (%)</label>
                    <Input type="number" step="0.01" defaultValue="20" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Service Charge (%)</label>
                    <Input type="number" step="0.01" defaultValue="0" />
                  </div>
                </div>
              </div>

              <Button>Save Payment Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>
                Configure email and SMS notifications for orders and operations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="text-lg font-medium">Order Notifications</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">New Order Email</label>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Order Status Updates SMS</label>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Low Inventory Alerts</label>
                    <Switch defaultChecked />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-lg font-medium">Customer Notifications</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Order Confirmation</label>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Delivery Updates</label>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Marketing Emails</label>
                    <Switch />
                  </div>
                </div>
              </div>

              <Button>Save Notification Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                Manage staff accounts and permissions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex justify-between items-center">
                <h4 className="text-lg font-medium">Staff Accounts</h4>
                <Button>Add New User</Button>
              </div>
              
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No staff accounts configured yet.</p>
                <p className="text-sm">Add team members to help manage your business.</p>
              </div>

              <div className="space-y-4">
                <h4 className="text-lg font-medium">Default Permissions</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">View Orders</label>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Manage Meals</label>
                    <Switch />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">View Reports</label>
                    <Switch />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Manage Settings</label>
                    <Switch />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BusinessSettings;