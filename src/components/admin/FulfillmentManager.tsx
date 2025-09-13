import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  default_cutoff_day?: string;
  default_production_lead_days: number;
  default_production_same_day: boolean;
  is_business_open: boolean;
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
  business_hours_override?: Record<string, { is_open: boolean; override_reason?: string }> | null;
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
  const [showZoneDialog, setShowZoneDialog] = useState(false);
  const [showCollectionPointDialog, setShowCollectionPointDialog] = useState(false);
  const [editingZone, setEditingZone] = useState<DeliveryZone | null>(null);
  const [editingCollectionPoint, setEditingCollectionPoint] = useState<CollectionPoint | null>(null);
  const [activeTab, setActiveTab] = useState("schedule");
  const { toast } = useToast();

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

  const handleZoneSubmit = async (data: any) => {
    try {
      if (editingZone?.id) {
        const { error } = await supabase
          .from("delivery_zones")
          .update(data)
          .eq("id", editingZone.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("delivery_zones")
          .insert([data]);
        if (error) throw error;
      }

      toast({
        title: "Success",
        description: `Delivery zone ${editingZone ? 'updated' : 'created'} successfully`,
      });

      setShowZoneDialog(false);
      setEditingZone(null);
      fetchDeliveryZones();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleCollectionPointSubmit = async (data: any) => {
    try {
      if (editingCollectionPoint?.id) {
        const { error } = await supabase
          .from("collection_points")
          .update(data)
          .eq("id", editingCollectionPoint.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("collection_points")
          .insert([data]);
        if (error) throw error;
      }

      toast({
        title: "Success",
        description: `Collection point ${editingCollectionPoint ? 'updated' : 'created'} successfully`,
      });

      setShowCollectionPointDialog(false);
      setEditingCollectionPoint(null);
      fetchCollectionPoints();
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
              <CardTitle>Time Slots</CardTitle>
              <CardDescription>
                Configure delivery time slot options
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {["morning", "afternoon", "evening"].map((slot) => (
                  <div key={slot} className="space-y-2">
                    <Label className="capitalize">{slot}</Label>
                    <Input
                      placeholder="09:00-12:00"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="zones" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Delivery Zones</CardTitle>
                <CardDescription>
                  Configure different delivery areas with custom schedules and fees
                </CardDescription>
              </div>
              <Button onClick={() => {
                setEditingZone(null);
                setShowZoneDialog(true);
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Add Zone
              </Button>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Zone Name</TableHead>
                      <TableHead>Delivery Days</TableHead>
                      <TableHead>Fee</TableHead>
                      <TableHead>Min Order</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deliveryZones.map((zone) => (
                      <TableRow key={zone.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {zone.zone_name}
                            {zone.business_hours_override && Object.keys(zone.business_hours_override).length > 0 && (
                              <Badge variant="outline" className="text-xs">Override</Badge>
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
                              onClick={() => {
                                setEditingZone(zone);
                                setShowZoneDialog(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="collection" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Collection Points</CardTitle>
                <CardDescription>
                  Manage locations where customers can collect their orders
                </CardDescription>
              </div>
              <Button onClick={() => {
                setEditingCollectionPoint(null);
                setShowCollectionPointDialog(true);
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Add Collection Point
              </Button>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Collection Days</TableHead>
                      <TableHead>Fee</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {collectionPoints.map((point) => (
                      <TableRow key={point.id}>
                        <TableCell>{point.point_name}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{point.address}</div>
                            <div className="text-muted-foreground">{point.city}, {point.postcode}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {point.collection_days.map((day, index) => (
                              <Badge key={index} variant="secondary" className="text-xs capitalize">
                                {day.substring(0, 3)}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>£{point.collection_fee.toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge variant={point.is_active ? "default" : "secondary"}>
                            {point.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingCollectionPoint(point);
                                setShowCollectionPointDialog(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Zone Dialog */}
      <Dialog open={showZoneDialog} onOpenChange={setShowZoneDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingZone ? 'Edit' : 'Add'} Delivery Zone
            </DialogTitle>
          </DialogHeader>
          <DeliveryZoneForm
            zone={editingZone}
            globalSchedule={globalSchedule}
            onSubmit={handleZoneSubmit}
            onClose={() => {
              setShowZoneDialog(false);
              setEditingZone(null);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Collection Point Dialog */}
      <Dialog open={showCollectionPointDialog} onOpenChange={setShowCollectionPointDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCollectionPoint ? 'Edit' : 'Add'} Collection Point
            </DialogTitle>
          </DialogHeader>
          <CollectionPointForm
            collectionPoint={editingCollectionPoint}
            globalSchedule={globalSchedule}
            onSubmit={handleCollectionPointSubmit}
            onClose={() => {
              setShowCollectionPointDialog(false);
              setEditingCollectionPoint(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Zone Form Component
function DeliveryZoneForm({ 
  zone, 
  globalSchedule,
  onSubmit, 
  onClose 
}: {
  zone: DeliveryZone | null;
  globalSchedule: GlobalSchedule[];
  onSubmit: (data: any) => void;
  onClose: () => void;
}) {
  const [formData, setFormData] = useState({
    zone_name: zone?.zone_name || "",
    postcodes: zone?.postcodes?.join(", ") || "",
    postcode_prefixes: zone?.postcode_prefixes?.join(", ") || "",
    delivery_days: zone?.delivery_days || [],
    delivery_fee: zone?.delivery_fee || 0,
    minimum_order: zone?.minimum_order || 0,
    maximum_distance_km: zone?.maximum_distance_km || null,
    business_hours_override: zone?.business_hours_override || {},
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
      business_hours_override: Object.keys(formData.business_hours_override).length > 0 ? formData.business_hours_override : null,
    };

    onSubmit(processedData);
  };

  const handleDayToggle = (day: string) => {
    setFormData(prev => ({
      ...prev,
      delivery_days: prev.delivery_days.includes(day)
        ? prev.delivery_days.filter(d => d !== day)
        : [...prev.delivery_days, day]
    }));
  };

  const getGlobalScheduleForDay = (day: string) => {
    return globalSchedule?.find(s => s.day_of_week === day);
  };

  const handleBusinessHourOverride = (day: string, isOpen: boolean, reason?: string) => {
    setFormData(prev => ({
      ...prev,
      business_hours_override: {
        ...prev.business_hours_override,
        [day]: { is_open: isOpen, override_reason: reason || '' }
      }
    }));
  };

  const removeBusinessHourOverride = (day: string) => {
    setFormData(prev => {
      const newOverrides = { ...prev.business_hours_override };
      delete newOverrides[day];
      return {
        ...prev,
        business_hours_override: newOverrides
      };
    });
  };

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

      {/* Business Hours Override Section */}
      <Card className="border-orange-200 bg-orange-50/30 dark:bg-orange-950/30">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Business Hours Override
            <Badge variant="outline" className="text-xs">Optional</Badge>
          </CardTitle>
          <CardDescription className="text-xs">
            Override global business hours for this specific zone. Useful when a zone operates on different days 
            (e.g., Nationwide delivers on Tuesday even when kitchen is closed)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {daysOfWeek.map((day) => {
            const globalDay = getGlobalScheduleForDay(day.value);
            const hasOverride = formData.business_hours_override[day.value];
            const isGlobalOpen = globalDay?.is_business_open ?? true;
            
            return (
              <div key={day.value} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="font-medium w-20">{day.label}</span>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Global:</span>
                    <Badge variant={isGlobalOpen ? "default" : "destructive"} className="text-xs">
                      {isGlobalOpen ? "Open" : "Closed"}
                    </Badge>
                  </div>
                  {hasOverride && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-orange-600">→ Override:</span>
                      <Badge variant={hasOverride.is_open ? "default" : "destructive"} className="text-xs">
                        {hasOverride.is_open ? "Open" : "Closed"}
                      </Badge>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {hasOverride ? (
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleBusinessHourOverride(
                          day.value, 
                          !hasOverride.is_open, 
                          hasOverride.override_reason
                        )}
                      >
                        {hasOverride.is_open ? "Set Closed" : "Set Open"}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeBusinessHourOverride(day.value)}
                      >
                        Remove Override
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleBusinessHourOverride(day.value, true, "Custom override")}
                        disabled={isGlobalOpen}
                      >
                        Override Open
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleBusinessHourOverride(day.value, false, "Custom override")}
                        disabled={!isGlobalOpen}
                      >
                        Override Closed
                      </Button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

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
            placeholder="0.00"
          />
        </div>

        <div className="space-y-2">
          <Label>Minimum Order (£)</Label>
          <Input
            type="number"
            step="0.01"
            value={formData.minimum_order}
            onChange={(e) => setFormData(prev => ({ ...prev, minimum_order: parseFloat(e.target.value) || 0 }))}
            placeholder="0.00"
          />
        </div>

        <div className="space-y-2">
          <Label>Max Distance (km)</Label>
          <Input
            type="number"
            step="0.1"
            value={formData.maximum_distance_km || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, maximum_distance_km: e.target.value ? parseFloat(e.target.value) : null }))}
            placeholder="Optional"
          />
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit">
          {zone ? 'Update' : 'Create'} Zone
        </Button>
      </div>
    </form>
  );
}

// Collection Point Form Component
function CollectionPointForm({ 
  collectionPoint, 
  globalSchedule,
  onSubmit, 
  onClose 
}: {
  collectionPoint: CollectionPoint | null;
  globalSchedule: GlobalSchedule[];
  onSubmit: (data: any) => void;
  onClose: () => void;
}) {
  const [formData, setFormData] = useState({
    point_name: collectionPoint?.point_name || '',
    address: collectionPoint?.address || '',
    city: collectionPoint?.city || '',
    postcode: collectionPoint?.postcode || '',
    phone: collectionPoint?.phone || '',
    email: collectionPoint?.email || '',
    collection_days: collectionPoint?.collection_days || [],
    collection_fee: collectionPoint?.collection_fee || 0,
    maximum_capacity: collectionPoint?.maximum_capacity || 50,
    special_instructions: collectionPoint?.special_instructions || '',
    order_cutoffs: collectionPoint?.order_cutoffs || {},
    production_lead_days: collectionPoint?.production_lead_days || 2,
    production_same_day: collectionPoint?.production_same_day || false,
    production_notes: collectionPoint?.production_notes || '',
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
    onSubmit(formData);
  };

  const handleDayToggle = (day: string) => {
    setFormData(prev => ({
      ...prev,
      collection_days: prev.collection_days.includes(day)
        ? prev.collection_days.filter(d => d !== day)
        : [...prev.collection_days, day]
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Point Name</Label>
          <Input
            value={formData.point_name}
            onChange={(e) => setFormData(prev => ({ ...prev, point_name: e.target.value }))}
            placeholder="Collection Point Name"
            required
          />
        </div>

        <div className="space-y-2">
          <Label>Collection Fee (£)</Label>
          <Input
            type="number"
            step="0.01"
            value={formData.collection_fee}
            onChange={(e) => setFormData(prev => ({ ...prev, collection_fee: parseFloat(e.target.value) || 0 }))}
            placeholder="0.00"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Address</Label>
        <Textarea
          value={formData.address}
          onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
          placeholder="Full address"
          rows={2}
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>City</Label>
          <Input
            value={formData.city}
            onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
            placeholder="City"
            required
          />
        </div>

        <div className="space-y-2">
          <Label>Postcode</Label>
          <Input
            value={formData.postcode}
            onChange={(e) => setFormData(prev => ({ ...prev, postcode: e.target.value }))}
            placeholder="Postcode"
            required
          />
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <Label>Collection Days</Label>
          <p className="text-sm text-muted-foreground mb-2">
            Select which days customers can collect from this point
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {daysOfWeek.map((day) => (
              <div key={day.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`collection-day-${day.value}`}
                  checked={formData.collection_days.includes(day.value)}
                  onCheckedChange={() => handleDayToggle(day.value)}
                />
                <Label htmlFor={`collection-day-${day.value}`} className="text-sm">
                  {day.label}
                </Label>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit">
          {collectionPoint ? 'Update' : 'Create'} Point
        </Button>
      </div>
    </form>
  );
}

export default FulfillmentManager;