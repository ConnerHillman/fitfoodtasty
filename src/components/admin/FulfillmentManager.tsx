import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Truck, 
  MapPin, 
  Clock, 
  Settings, 
  Plus, 
  Edit, 
  Trash2, 
  Calendar,
  PoundSterling,
  Store,
  Timer
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import WeeklyScheduleManager from "./WeeklyScheduleManager";

interface FulfillmentSetting {
  id: string;
  setting_type: string;
  setting_key: string;
  setting_value: any;
  is_active: boolean;
}

interface GlobalSchedule {
  id: string;
  day_of_week: string;
  default_cutoff_time: string;
  default_production_lead_days: number;
  default_production_same_day: boolean;
  is_active: boolean;
}

interface DeliveryZone {
  id: string;
  zone_name: string;
  postcodes: string[];
  postcode_prefixes?: string[];
  delivery_days: string[];
  delivery_fee: number;
  minimum_order: number;
  maximum_distance_km: number | null;
  production_day_offset?: number;
  production_lead_days?: number;
  production_same_day?: boolean;
  allow_custom_dates?: boolean;
  production_notes?: string | null;
  order_cutoffs?: Record<string, { cutoff_day: string; cutoff_time: string }> | any;
  is_active: boolean;
}

interface CollectionPoint {
  id: string;
  point_name: string;
  address: string;
  city: string;
  postcode: string;
  phone: string | null;
  email: string | null;
  collection_days: string[];
  opening_hours: any;
  collection_fee: number;
  maximum_capacity: number;
  special_instructions: string | null;
  order_cutoffs?: any;
  production_lead_days?: number;
  production_same_day?: boolean;
  production_notes?: string;
  is_active: boolean;
}

const FulfillmentManager = () => {
  const [settings, setSettings] = useState<FulfillmentSetting[]>([]);
  const [globalSchedule, setGlobalSchedule] = useState<GlobalSchedule[]>([]);
  const [deliveryZones, setDeliveryZones] = useState<DeliveryZone[]>([]);
  const [collectionPoints, setCollectionPoints] = useState<CollectionPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("general");
  const { toast } = useToast();

  const daysOfWeek = [
    { value: "monday", label: "Monday" },
    { value: "tuesday", label: "Tuesday" },
    { value: "wednesday", label: "Wednesday" },
    { value: "thursday", label: "Thursday" },
    { value: "friday", label: "Friday" },
    { value: "saturday", label: "Saturday" },
    { value: "sunday", label: "Sunday" }
  ];

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchSettings(),
        fetchGlobalSchedule(),
        fetchDeliveryZones(),
        fetchCollectionPoints()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load fulfillment data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("fulfillment_settings")
        .select("*")
        .order("setting_type", { ascending: true });

      if (error) throw error;
      setSettings(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch fulfillment settings",
        variant: "destructive",
      });
    }
  };

  const fetchGlobalSchedule = async () => {
    try {
      const { data, error } = await supabase
        .from('global_fulfillment_schedule')
        .select('*')
        .eq('is_active', true)
        .order('day_of_week');
      
      if (error) throw error;
      setGlobalSchedule(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch global schedule",
        variant: "destructive",
      });
    }
  };

  const fetchDeliveryZones = async () => {
    try {
      const { data, error } = await supabase
        .from("delivery_zones")
        .select("*")
        .order("zone_name", { ascending: true });

      if (error) throw error;
      setDeliveryZones((data || []).map(zone => ({ ...zone, order_cutoffs: zone.order_cutoffs || {} })) as any);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch delivery zones",
        variant: "destructive",
      });
    }
  };

  const fetchCollectionPoints = async () => {
    try {
      const { data, error } = await supabase
        .from("collection_points")
        .select("*")
        .order("point_name", { ascending: true });

      if (error) throw error;
      setCollectionPoints(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch collection points",
        variant: "destructive",
      });
    }
  };

  const updateSetting = async (settingType: string, settingKey: string, value: any) => {
    try {
      const { error } = await supabase
        .from("fulfillment_settings")
        .upsert({
          setting_type: settingType,
          setting_key: settingKey,
          setting_value: value,
        }, {
          onConflict: 'setting_type,setting_key'
        });

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Setting updated successfully",
      });
      
      fetchSettings();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getSetting = (settingType: string, settingKey: string) => {
    const setting = settings.find(s => s.setting_type === settingType && s.setting_key === settingKey);
    return setting?.setting_value;
  };

  const handleSaveDeliveryZone = async (data: any) => {
    try {
      if (editingItem && editingItem.id) {
        const { error } = await supabase
          .from("delivery_zones")
          .update(data)
          .eq("id", editingItem.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("delivery_zones")
          .insert([data]);
        if (error) throw error;
      }

      toast({
        title: "Success",
        description: `Delivery zone ${editingItem ? 'updated' : 'created'} successfully`,
      });

      setIsDialogOpen(false);
      setEditingItem(null);
      fetchDeliveryZones();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSaveCollectionPoint = async (data: any) => {
    try {
      if (editingItem && editingItem.id) {
        const { error } = await supabase
          .from("collection_points")
          .update(data)
          .eq("id", editingItem.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("collection_points")
          .insert([data]);
        if (error) throw error;
      }

      toast({
        title: "Success",
        description: `Collection point ${editingItem ? 'updated' : 'created'} successfully`,
      });

      setIsDialogOpen(false);
      setEditingItem(null);
      fetchCollectionPoints();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (table: "delivery_zones" | "collection_points", id: string) => {
    try {
      let error;
      if (table === "delivery_zones") {
        const result = await supabase
          .from("delivery_zones")
          .delete()
          .eq("id", id);
        error = result.error;
      } else {
        const result = await supabase
          .from("collection_points")
          .delete()
          .eq("id", id);
        error = result.error;
      }

      if (error) throw error;

      toast({
        title: "Success",
        description: "Item deleted successfully",
      });

      if (table === "delivery_zones") {
        fetchDeliveryZones();
      } else if (table === "collection_points") {
        fetchCollectionPoints();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Truck className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Fulfillment Management</h1>
          <p className="text-muted-foreground">Manage delivery and collection settings</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="schedule" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Weekly Schedule
          </TabsTrigger>
          <TabsTrigger value="zones" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Delivery Zones
          </TabsTrigger>
          <TabsTrigger value="collection" className="flex items-center gap-2">
            <Store className="h-4 w-4" />
            Collection Points
          </TabsTrigger>
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="schedule" className="space-y-6">
          <WeeklyScheduleManager 
            globalSchedule={globalSchedule}
            deliveryZones={deliveryZones}
            onScheduleUpdate={fetchGlobalSchedule}
          />
        </TabsContent>

        <TabsContent value="general" className="space-y-6">

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Timer className="h-5 w-5" />
                Delivery Time Slots
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2 mb-4">
                <Checkbox
                  id="enable-time-slots"
                  checked={getSetting("general", "time_slots_enabled") !== false}
                  onCheckedChange={(checked) => updateSetting("general", "time_slots_enabled", checked)}
                />
                <Label htmlFor="enable-time-slots" className="text-sm font-medium">
                  Enable delivery time slots
                </Label>
              </div>
              <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 ${getSetting("general", "time_slots_enabled") === false ? 'opacity-50 pointer-events-none' : ''}`}>
                {["morning", "afternoon", "evening"].map((slot) => {
                  const slots = getSetting("general", "delivery_slots");
                  const timeSlotsEnabled = getSetting("general", "time_slots_enabled") !== false;
                  return (
                    <div key={slot} className="space-y-2">
                      <Label className="capitalize">{slot}</Label>
                      <Input
                        defaultValue={slots?.[slot] || ""}
                        placeholder="09:00-12:00"
                        disabled={!timeSlotsEnabled}
                        onBlur={(e) => {
                          if (timeSlotsEnabled) {
                            const newSlots = { ...slots, [slot]: e.target.value };
                            updateSetting("general", "delivery_slots", newSlots);
                          }
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="delivery-days" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Available Delivery Days</CardTitle>
              <p className="text-sm text-muted-foreground">Select which days you offer delivery service</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {daysOfWeek.map((day) => {
                  const availableDays = getSetting("delivery_days", "available_days") || [];
                  const isChecked = availableDays.includes(day.value);
                  
                  return (
                    <div key={day.value} className="flex items-center space-x-2">
                      <Switch
                        id={`delivery-${day.value}`}
                        checked={isChecked}
                        onCheckedChange={(checked) => {
                          const newDays = checked 
                            ? [...availableDays, day.value]
                            : availableDays.filter((d: string) => d !== day.value);
                          updateSetting("delivery_days", "available_days", newDays);
                        }}
                      />
                      <Label htmlFor={`delivery-${day.value}`} className="text-sm font-medium">
                        {day.label}
                      </Label>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Available Collection Days</CardTitle>
              <p className="text-sm text-muted-foreground">Select which days customers can collect orders</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {daysOfWeek.map((day) => {
                  const availableDays = getSetting("collection_days", "available_days") || [];
                  const isChecked = availableDays.includes(day.value);
                  
                  return (
                    <div key={day.value} className="flex items-center space-x-2">
                      <Switch
                        id={`collection-${day.value}`}
                        checked={isChecked}
                        onCheckedChange={(checked) => {
                          const newDays = checked 
                            ? [...availableDays, day.value]
                            : availableDays.filter((d: string) => d !== day.value);
                          updateSetting("collection_days", "available_days", newDays);
                        }}
                      />
                      <Label htmlFor={`collection-${day.value}`} className="text-sm font-medium">
                        {day.label}
                      </Label>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="zones" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Delivery Zones</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Configure different delivery areas with custom schedules and fees
                </p>
              </div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => setEditingItem(null)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Zone
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {editingItem ? "Edit" : "Add"} Delivery Zone
                    </DialogTitle>
                  </DialogHeader>
                  <DeliveryZoneForm
                    zone={editingItem}
                    onSave={handleSaveDeliveryZone}
                    onCancel={() => {
                      setIsDialogOpen(false);
                      setEditingItem(null);
                    }}
                  />
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="mb-4 p-4 bg-muted/50 rounded-lg">
                <h4 className="font-medium mb-2">Zone Types:</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span><strong>Local:</strong> Multiple delivery days available</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span><strong>Regional:</strong> Weekly delivery (e.g., Bristol)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                    <span><strong>National:</strong> Shipped nationwide</span>
                  </div>
                </div>
              </div>
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Zone Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Postcodes</TableHead>
                    <TableHead>Delivery Days</TableHead>
                    <TableHead>Fee</TableHead>
                    <TableHead>Min Order</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deliveryZones.map((zone) => {
                    const zoneType = zone.zone_name.toLowerCase().includes('local') ? 'local' : 
                                   zone.zone_name.toLowerCase().includes('bristol') ? 'regional' :
                                   zone.zone_name.toLowerCase().includes('national') || zone.zone_name.toLowerCase().includes('shipping') ? 'national' : 'local';
                    const typeColor = zoneType === 'local' ? 'bg-green-500' : zoneType === 'regional' ? 'bg-blue-500' : 'bg-purple-500';
                    
                    return (
                      <TableRow 
                        key={zone.id} 
                        className="cursor-pointer hover:bg-muted/50" 
                        onClick={() => {
                          setEditingItem(zone);
                          setIsDialogOpen(true);
                        }}
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${typeColor}`}></div>
                            {zone.zone_name}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {zoneType}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {zone.postcodes.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {zone.postcodes.slice(0, 3).map((code, index) => (
                                  <Badge key={index} variant="secondary" className="text-xs">
                                    {code}
                                  </Badge>
                                ))}
                                {zone.postcodes.length > 3 && (
                                  <Badge variant="secondary" className="text-xs">
                                    +{zone.postcodes.length - 3} more
                                  </Badge>
                                )}
                              </div>
                            )}
                            {zone.postcode_prefixes && zone.postcode_prefixes.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {zone.postcode_prefixes.slice(0, 2).map((prefix, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {prefix}*
                                  </Badge>
                                ))}
                                {zone.postcode_prefixes.length > 2 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{zone.postcode_prefixes.length - 2} more
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {zone.delivery_days.map((day, index) => (
                              <Badge key={index} variant="secondary" className="text-xs capitalize">
                                {day.substring(0, 3)}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>£{zone.delivery_fee.toFixed(2)}</TableCell>
                        <TableCell>£{zone.minimum_order.toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge variant={zone.is_active ? "default" : "secondary"}>
                            {zone.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingItem(zone);
                                setIsDialogOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete("delivery_zones", zone.id);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {deliveryZones.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        No delivery zones configured. Add your first zone to get started.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-900 mb-2">Quick Setup Templates:</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setEditingItem({
                        zone_name: "Local Delivery",
                        postcodes: [],
                        postcode_prefixes: [],
                        delivery_days: ["sunday", "monday", "wednesday"],
                        delivery_fee: 4.50,
                        minimum_order: 15.00,
                        maximum_distance_km: 10,
                        production_day_offset: 0,
                        allow_custom_dates: false,
                        production_notes: "Local delivery - same day production and delivery",
                        is_active: true
                      });
                      setIsDialogOpen(true);
                    }}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Local Zone
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setEditingItem({
                        zone_name: "Bristol Weekly",
                        postcodes: [],
                        postcode_prefixes: ["BS"],
                        delivery_days: ["sunday"],
                        delivery_fee: 8.00,
                        minimum_order: 25.00,
                        maximum_distance_km: null,
                        production_day_offset: 0,
                        allow_custom_dates: false,
                        production_notes: "Regional delivery - same day production and delivery",
                        is_active: true
                      });
                      setIsDialogOpen(true);
                    }}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Regional Zone
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setEditingItem({
                        zone_name: "National Shipping",
                        postcodes: [],
                        postcode_prefixes: [],
                        delivery_days: ["tuesday"],
                        delivery_fee: 12.00,
                        minimum_order: 30.00,
                        maximum_distance_km: null,
                        production_day_offset: -2,
                        allow_custom_dates: true,
                        production_notes: "National shipping - cook Sunday, ship Monday, deliver Tuesday",
                        is_active: true
                      });
                      setIsDialogOpen(true);
                    }}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    National Zone
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="collection" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Collection Points</CardTitle>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => setEditingItem(null)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Collection Point
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {editingItem ? "Edit" : "Add"} Collection Point
                    </DialogTitle>
                  </DialogHeader>
                  <CollectionPointForm
                    point={editingItem}
                    onSave={handleSaveCollectionPoint}
                    onCancel={() => {
                      setIsDialogOpen(false);
                      setEditingItem(null);
                    }}
                  />
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Collection Days</TableHead>
                    <TableHead>Fee</TableHead>
                    <TableHead>Capacity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {collectionPoints.map((point) => (
                    <TableRow key={point.id}>
                      <TableCell className="font-medium">{point.point_name}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {point.address}<br />
                          {point.city}, {point.postcode}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {point.collection_days.map((day, index) => (
                            <Badge key={index} variant="outline" className="text-xs capitalize">
                              {day.substring(0, 3)}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>£{point.collection_fee.toFixed(2)}</TableCell>
                      <TableCell>{point.maximum_capacity}</TableCell>
                      <TableCell>
                        <Badge variant={point.is_active ? "default" : "secondary"}>
                          {point.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingItem(point);
                              setIsDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete("collection_points", point.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fees" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Delivery Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Default Delivery Fee (£)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    defaultValue={getSetting("general", "default_delivery_fee")?.value || 2.99}
                    onBlur={(e) => {
                      updateSetting("general", "default_delivery_fee", { 
                        value: parseFloat(e.target.value) || 2.99, 
                        currency: "gbp" 
                      });
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Minimum Order for Delivery (£)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    defaultValue={getSetting("general", "minimum_order_delivery")?.value || 15.00}
                    onBlur={(e) => {
                      updateSetting("general", "minimum_order_delivery", { 
                        value: parseFloat(e.target.value) || 15.00, 
                        currency: "gbp" 
                      });
                    }}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Collection Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Minimum Order for Collection (£)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    defaultValue={getSetting("general", "minimum_order_collection")?.value || 10.00}
                    onBlur={(e) => {
                      updateSetting("general", "minimum_order_collection", { 
                        value: parseFloat(e.target.value) || 10.00, 
                        currency: "gbp" 
                      });
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

      </Tabs>
    </div>
  );
};

// Form components for creating/editing zones and collection points
const DeliveryZoneForm = ({ zone, onSave, onCancel }: any) => {
  const [formData, setFormData] = useState({
    zone_name: zone?.zone_name || "",
    postcodes: zone?.postcodes?.join(", ") || "",
    postcode_prefixes: zone?.postcode_prefixes?.join(", ") || "",
    delivery_days: zone?.delivery_days || [],
    delivery_fee: zone?.delivery_fee || 0,
    minimum_order: zone?.minimum_order || 0,
    maximum_distance_km: zone?.maximum_distance_km || null,
    production_day_offset: zone?.production_day_offset ?? -2,
    production_lead_days: zone?.production_lead_days ?? 2,
    production_same_day: zone?.production_same_day ?? false,
    allow_custom_dates: zone?.allow_custom_dates ?? false,
    production_notes: zone?.production_notes || "",
    order_cutoffs: zone?.order_cutoffs || {},
    is_active: zone?.is_active ?? true,
  });

  const daysOfWeek = [
    { value: "sunday", label: "Sunday" },
    { value: "monday", label: "Monday" },
    { value: "tuesday", label: "Tuesday" },
    { value: "wednesday", label: "Wednesday" },
    { value: "thursday", label: "Thursday" },
    { value: "friday", label: "Friday" },
    { value: "saturday", label: "Saturday" }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const processedData = {
      ...formData,
      postcodes: formData.postcodes
        .split(",")
        .map(code => code.trim().toUpperCase())
        .filter(code => code.length > 0),
      postcode_prefixes: formData.postcode_prefixes
        .split(",")
        .map(prefix => prefix.trim().toUpperCase())
        .filter(prefix => prefix.length > 0),
      delivery_fee: parseFloat(formData.delivery_fee.toString()) || 0,
      minimum_order: parseFloat(formData.minimum_order.toString()) || 0,
      maximum_distance_km: formData.maximum_distance_km ? parseFloat(formData.maximum_distance_km.toString()) : null,
      production_day_offset: formData.production_day_offset === '' ? -2 : parseInt(formData.production_day_offset.toString()),
      production_lead_days: parseInt(formData.production_lead_days.toString()) || 2,
      production_same_day: formData.production_same_day,
      allow_custom_dates: formData.allow_custom_dates,
      production_notes: formData.production_notes.trim() || null,
      order_cutoffs: formData.order_cutoffs || {},
    };

    onSave(processedData);
  };

  const handleDayToggle = (day: string) => {
    setFormData(prev => ({
      ...prev,
      delivery_days: prev.delivery_days.includes(day)
        ? prev.delivery_days.filter(d => d !== day)
        : [...prev.delivery_days, day]
    }));
  };

  const getZoneTypeInfo = () => {
    const name = formData.zone_name.toLowerCase();
    if (name.includes('local')) {
      return {
        type: 'Local Delivery',
        description: 'Multiple cooking/delivery days available',
        suggestedDays: ['sunday', 'monday', 'wednesday'],
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        example: 'For customers within 10km - can deliver on any cooking day'
      };
    } else if (name.includes('bristol') || name.includes('regional')) {
      return {
        type: 'Regional Delivery',
        description: 'Weekly delivery to distant cities',
        suggestedDays: ['sunday'],
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        example: 'For cities like Bristol - weekly delivery due to distance'
      };
    } else if (name.includes('national') || name.includes('shipping')) {
      return {
        type: 'National Shipping',
        description: 'Nationwide courier delivery',
        suggestedDays: ['tuesday'],
        color: 'text-purple-600',
        bgColor: 'bg-purple-50',
        example: 'Anywhere in UK - fixed Tuesday delivery (cook Sun, ship Mon, arrive Tue)'
      };
    }
    return null;
  };

  const zoneInfo = getZoneTypeInfo();

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="zone_name">Zone Name</Label>
          <Input
            id="zone_name"
            value={formData.zone_name}
            onChange={(e) => setFormData(prev => ({ ...prev, zone_name: e.target.value }))}
            placeholder="e.g., Local Delivery, Bristol Weekly, National Shipping"
            required
          />
          {zoneInfo && (
            <div className={`p-3 rounded-lg ${zoneInfo.bgColor} border`}>
              <p className={`text-sm font-medium ${zoneInfo.color}`}>
                <strong>{zoneInfo.type}:</strong> {zoneInfo.description}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{zoneInfo.example}</p>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="is_active">Status</Label>
          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
            />
            <Label htmlFor="is_active">Active</Label>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <Label>Delivery Days</Label>
          <p className="text-sm text-muted-foreground mb-2">
            Select which days this zone receives deliveries
          </p>
          {zoneInfo && (
            <div className="mb-3 p-2 bg-muted rounded text-sm">
              <strong>Suggested for {zoneInfo.type}:</strong> {zoneInfo.suggestedDays.map(d => d.charAt(0).toUpperCase() + d.slice(1)).join(', ')}
              <Button
                type="button"
                variant="link"
                size="sm"
                className="ml-2 h-auto p-0"
                onClick={() => setFormData(prev => ({ ...prev, delivery_days: zoneInfo.suggestedDays }))}
              >
                Use suggested
              </Button>
            </div>
          )}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {daysOfWeek.map((day) => (
              <div key={day.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`day-${day.value}`}
                  checked={formData.delivery_days.includes(day.value)}
                  onCheckedChange={() => handleDayToggle(day.value)}
                />
                <Label htmlFor={`day-${day.value}`} className="text-sm">
                  {day.label}
                </Label>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Exact Postcodes (comma separated)</Label>
          <Textarea
            value={formData.postcodes}
            onChange={(e) => setFormData(prev => ({ ...prev, postcodes: e.target.value }))}
            placeholder="SW1A 1AA, W1A 0AX, NW1 6XE"
            rows={3}
          />
          <p className="text-xs text-muted-foreground">Enter complete postcodes for exact matching</p>
        </div>

        <div className="space-y-2">
          <Label>Postcode Prefixes (comma separated)</Label>
          <Textarea
            value={formData.postcode_prefixes}
            onChange={(e) => setFormData(prev => ({ ...prev, postcode_prefixes: e.target.value }))}
            placeholder="TA, BS, SW1"
            rows={3}
          />
          <p className="text-xs text-muted-foreground">Enter prefixes to match all postcodes starting with these values</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Delivery Fee (£)</Label>
          <Input
            type="number"
            step="0.01"
            value={formData.delivery_fee}
            onChange={(e) => setFormData(prev => ({ ...prev, delivery_fee: parseFloat(e.target.value) || 0 }))}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Minimum Order (£)</Label>
          <Input
            type="number"
            step="0.01"
            value={formData.minimum_order}
            onChange={(e) => setFormData(prev => ({ ...prev, minimum_order: parseFloat(e.target.value) || 0 }))}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Max Distance (km) - Optional</Label>
          <Input
            type="number"
            value={formData.maximum_distance_km || ""}
            onChange={(e) => setFormData(prev => ({ ...prev, maximum_distance_km: e.target.value ? parseFloat(e.target.value) : null }))}
            placeholder="Leave empty for unlimited"
          />
        </div>
      </div>

      <div className="space-y-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div>
          <h4 className="font-medium text-blue-900">Customer Order Deadlines</h4>
          <p className="text-sm text-blue-700">
            Set when customers must place their orders by for each delivery day
          </p>
        </div>
        <div className="space-y-4">
          <div>
            <Label>Order Cut-Off Times</Label>
            <p className="text-sm text-muted-foreground mb-3">
              Set customer order deadlines for each delivery day
              </p>
              {formData.delivery_days?.map((day) => (
                <div key={day} className="space-y-2 p-3 border rounded-lg mb-3">
                  <Label className="text-sm font-medium capitalize">{day} Delivery</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Cut-off Day</Label>
                      <select
                        className="w-full p-2 border rounded text-sm"
                        value={formData.order_cutoffs?.[day]?.cutoff_day || ''}
                        onChange={(e) => {
                          const newCutoffs = { ...formData.order_cutoffs };
                          if (!newCutoffs[day]) newCutoffs[day] = {};
                          newCutoffs[day].cutoff_day = e.target.value;
                          setFormData(prev => ({ ...prev, order_cutoffs: newCutoffs }));
                        }}
                      >
                        <option value="">Select day</option>
                        <option value="sunday">Sunday</option>
                        <option value="monday">Monday</option>
                        <option value="tuesday">Tuesday</option>
                        <option value="wednesday">Wednesday</option>
                        <option value="thursday">Thursday</option>
                        <option value="friday">Friday</option>
                        <option value="saturday">Saturday</option>
                      </select>
                    </div>
                    <div>
                      <Label className="text-xs">Cut-off Time</Label>
                      <Input
                        type="time"
                        value={formData.order_cutoffs?.[day]?.cutoff_time || '23:59'}
                        onChange={(e) => {
                          const newCutoffs = { ...formData.order_cutoffs };
                          if (!newCutoffs[day]) newCutoffs[day] = {};
                          newCutoffs[day].cutoff_time = e.target.value;
                          setFormData(prev => ({ ...prev, order_cutoffs: newCutoffs }));
                        }}
                        className="text-sm"
                      />
                    </div>
                  </div>
                  {formData.order_cutoffs?.[day]?.cutoff_day && (
                    <p className="text-xs text-muted-foreground">
                      For {day} delivery, customers must order by {formData.order_cutoffs[day].cutoff_time || '23:59'} on {formData.order_cutoffs[day].cutoff_day}
                    </p>
                  )}
                </div>
              ))}
          </div>
        </div>

        <div>
          <h4 className="font-medium text-blue-900">Kitchen Production Scheduling</h4>
          <p className="text-sm text-blue-700">
            Configure when the kitchen should start production relative to delivery dates
          </p>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="production_lead_days">Production Lead Time (days)</Label>
              <Input
                id="production_lead_days"
                type="number"
                value={formData.production_lead_days || 2}
                onChange={(e) => setFormData({...formData, production_lead_days: parseInt(e.target.value)})}
                min="0"
                max="7"
              />
              <p className="text-sm text-muted-foreground">
                How many days before delivery the kitchen starts production
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="production_same_day"
                checked={formData.production_same_day || false}
                onChange={(e) => setFormData({...formData, production_same_day: e.target.checked})}
                className="rounded"
              />
              <Label htmlFor="production_same_day">Same-day production</Label>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Kitchen can cook and deliver on the same day (overrides lead time when checked)
          </p>

          <div className="space-y-2">
            <Label>Legacy Production Day Offset (Fallback)</Label>
            <div className="flex items-center space-x-2">
              <Input
                type="number"
                value={formData.production_day_offset}
                onChange={(e) => setFormData(prev => ({ ...prev, production_day_offset: e.target.value === '' ? -2 : parseInt(e.target.value) }))}
                className="w-20"
              />
              <span className="text-sm text-muted-foreground">days before delivery</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Used as fallback when new production settings are not configured
            </p>
          </div>
        </div>
      </div>
          
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="allow_custom_dates"
            checked={formData.allow_custom_dates}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, allow_custom_dates: checked as boolean }))}
          />
          <Label htmlFor="allow_custom_dates" className="text-sm">
            Allow custom date overrides
          </Label>
        </div>
        <p className="text-xs text-muted-foreground">
          Permit manual adjustment of production/delivery dates for this zone
        </p>
      </div>

      <div className="space-y-2">
        <Label>Production Notes (Optional)</Label>
        <Textarea
          value={formData.production_notes}
          onChange={(e) => setFormData(prev => ({ ...prev, production_notes: e.target.value }))}
          placeholder="Special kitchen instructions or notes for this delivery zone..."
          rows={2}
        />
      </div>

      <div className="p-3 bg-white rounded border text-sm">
        <strong>Examples:</strong><br />
        • <strong>Customer deadline:</strong> For Tuesday delivery, customers order by Friday 11:59 PM<br />
        • <strong>Kitchen production:</strong> For Tuesday delivery, kitchen starts cooking on Sunday<br />
        These are separate timelines that can be configured independently.
      </div>

      <div className="flex justify-end space-x-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {zone ? "Update Zone" : "Create Zone"}
        </Button>
      </div>
    </form>
  );
};

const CollectionPointForm = ({ point, onSave, onCancel }: any) => {
  const [formData, setFormData] = useState({
    point_name: point?.point_name || "",
    address: point?.address || "",
    city: point?.city || "",
    postcode: point?.postcode || "",
    phone: point?.phone || "",
    email: point?.email || "",
    collection_days: point?.collection_days || [],
    collection_fee: point?.collection_fee || 0,
    maximum_capacity: point?.maximum_capacity || 50,
    special_instructions: point?.special_instructions || "",
    is_active: point?.is_active ?? true,
  });

  const daysOfWeek = [
    "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      collection_fee: parseFloat(formData.collection_fee.toString()),
      maximum_capacity: parseInt(formData.maximum_capacity.toString()),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Point Name</Label>
          <Input
            value={formData.point_name}
            onChange={(e) => setFormData({...formData, point_name: e.target.value})}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Phone</Label>
          <Input
            value={formData.phone}
            onChange={(e) => setFormData({...formData, phone: e.target.value})}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Address</Label>
        <Input
          value={formData.address}
          onChange={(e) => setFormData({...formData, address: e.target.value})}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>City</Label>
          <Input
            value={formData.city}
            onChange={(e) => setFormData({...formData, city: e.target.value})}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Postcode</Label>
          <Input
            value={formData.postcode}
            onChange={(e) => setFormData({...formData, postcode: e.target.value})}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Collection Days</Label>
        <div className="grid grid-cols-2 gap-2">
          {daysOfWeek.map((day) => (
            <div key={day} className="flex items-center space-x-2">
              <Switch
                checked={formData.collection_days.includes(day)}
                onCheckedChange={(checked) => {
                  const newDays = checked 
                    ? [...formData.collection_days, day]
                    : formData.collection_days.filter(d => d !== day);
                  setFormData({...formData, collection_days: newDays});
                }}
              />
              <Label className="capitalize text-sm">{day}</Label>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Collection Fee (£)</Label>
          <Input
            type="number"
            step="0.01"
            value={formData.collection_fee}
            onChange={(e) => setFormData({...formData, collection_fee: parseFloat(e.target.value) || 0})}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Maximum Capacity</Label>
          <Input
            type="number"
            value={formData.maximum_capacity}
            onChange={(e) => setFormData({...formData, maximum_capacity: parseInt(e.target.value) || 50})}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Special Instructions</Label>
        <Textarea
          value={formData.special_instructions}
          onChange={(e) => setFormData({...formData, special_instructions: e.target.value})}
          placeholder="Any special instructions for collection..."
        />
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          checked={formData.is_active}
          onCheckedChange={(checked) => setFormData({...formData, is_active: checked})}
        />
        <Label>Active</Label>
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {point ? "Update" : "Create"} Collection Point
        </Button>
      </div>
    </form>
  );
};

// Helper function to check if a postcode matches a delivery zone
export const postcodeMatchesZone = (customerPostcode: string, zone: DeliveryZone): boolean => {
  if (!customerPostcode) return false;
  
  const normalizedCustomerPostcode = customerPostcode.trim().toUpperCase();
  
  // Check exact postcodes
  if (zone.postcodes.some(postcode => 
    postcode.trim().toUpperCase() === normalizedCustomerPostcode
  )) {
    return true;
  }
  
  // Check postcode prefixes
  if (zone.postcode_prefixes && zone.postcode_prefixes.some(prefix => 
    normalizedCustomerPostcode.startsWith(prefix.trim().toUpperCase())
  )) {
    return true;
  }
  
  return false;
};

export default FulfillmentManager;