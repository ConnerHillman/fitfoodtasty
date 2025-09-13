import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  Map,
  Store,
  TimerIcon
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface FulfillmentSetting {
  id: string;
  setting_type: string;
  setting_key: string;
  setting_value: any;
  is_active: boolean;
}

interface DeliveryZone {
  id: string;
  zone_name: string;
  postcodes: string[];
  delivery_days: string[];
  delivery_fee: number;
  minimum_order: number;
  maximum_distance_km: number | null;
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
  is_active: boolean;
}

const FulfillmentManager = () => {
  const [settings, setSettings] = useState<FulfillmentSetting[]>([]);
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
    await Promise.all([
      fetchSettings(),
      fetchDeliveryZones(),
      fetchCollectionPoints()
    ]);
    setLoading(false);
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

  const fetchDeliveryZones = async () => {
    try {
      const { data, error } = await supabase
        .from("delivery_zones")
        .select("*")
        .order("zone_name", { ascending: true });

      if (error) throw error;
      setDeliveryZones(data || []);
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
      if (editingItem) {
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
      if (editingItem) {
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
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="delivery-days" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Delivery Days
          </TabsTrigger>
          <TabsTrigger value="zones" className="flex items-center gap-2">
            <Map className="h-4 w-4" />
            Delivery Zones
          </TabsTrigger>
          <TabsTrigger value="collection" className="flex items-center gap-2">
            <Store className="h-4 w-4" />
            Collection Points
          </TabsTrigger>
          <TabsTrigger value="fees" className="flex items-center gap-2">
            <PoundSterling className="h-4 w-4" />
            Fees & Limits
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TimerIcon className="h-5 w-5" />
                Delivery Time Slots
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {["morning", "afternoon", "evening"].map((slot) => {
                  const slots = getSetting("general", "delivery_slots");
                  return (
                    <div key={slot} className="space-y-2">
                      <Label className="capitalize">{slot}</Label>
                      <Input
                        defaultValue={slots?.[slot] || ""}
                        placeholder="09:00-12:00"
                        onBlur={(e) => {
                          const newSlots = { ...slots, [slot]: e.target.value };
                          updateSetting("general", "delivery_slots", newSlots);
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Other Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Maximum Delivery Radius (km)</Label>
                  <Input
                    type="number"
                    defaultValue={getSetting("general", "max_delivery_radius_km")?.value || 25}
                    onBlur={(e) => {
                      updateSetting("general", "max_delivery_radius_km", { value: parseFloat(e.target.value) || 25 });
                    }}
                  />
                </div>
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
              <CardTitle>Delivery Zones</CardTitle>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => setEditingItem(null)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Zone
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Zone Name</TableHead>
                    <TableHead>Postcodes</TableHead>
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
                      <TableCell className="font-medium">{zone.zone_name}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {zone.postcodes.slice(0, 3).map((postcode, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {postcode}
                            </Badge>
                          ))}
                          {zone.postcodes.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{zone.postcodes.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {zone.delivery_days.map((day, index) => (
                            <Badge key={index} variant="outline" className="text-xs capitalize">
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
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingItem(zone);
                              setIsDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete("delivery_zones", zone.id)}
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
                <DialogContent className="max-w-2xl">
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
    delivery_days: zone?.delivery_days || [],
    delivery_fee: zone?.delivery_fee || 0,
    minimum_order: zone?.minimum_order || 0,
    maximum_distance_km: zone?.maximum_distance_km || null,
    is_active: zone?.is_active ?? true,
  });

  const daysOfWeek = [
    "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      postcodes: formData.postcodes.split(",").map(p => p.trim()).filter(p => p),
      delivery_fee: parseFloat(formData.delivery_fee.toString()),
      minimum_order: parseFloat(formData.minimum_order.toString()),
      maximum_distance_km: formData.maximum_distance_km ? parseFloat(formData.maximum_distance_km.toString()) : null,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Zone Name</Label>
        <Input
          value={formData.zone_name}
          onChange={(e) => setFormData({...formData, zone_name: e.target.value})}
          required
        />
      </div>

      <div className="space-y-2">
        <Label>Postcodes (comma separated)</Label>
        <Textarea
          value={formData.postcodes}
          onChange={(e) => setFormData({...formData, postcodes: e.target.value})}
          placeholder="SW1A, W1A, NW1"
          required
        />
      </div>

      <div className="space-y-2">
        <Label>Delivery Days</Label>
        <div className="grid grid-cols-2 gap-2">
          {daysOfWeek.map((day) => (
            <div key={day} className="flex items-center space-x-2">
              <Switch
                checked={formData.delivery_days.includes(day)}
                onCheckedChange={(checked) => {
                  const newDays = checked 
                    ? [...formData.delivery_days, day]
                    : formData.delivery_days.filter(d => d !== day);
                  setFormData({...formData, delivery_days: newDays});
                }}
              />
              <Label className="capitalize text-sm">{day}</Label>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Delivery Fee (£)</Label>
          <Input
            type="number"
            step="0.01"
            value={formData.delivery_fee}
            onChange={(e) => setFormData({...formData, delivery_fee: parseFloat(e.target.value) || 0})}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Minimum Order (£)</Label>
          <Input
            type="number"
            step="0.01"
            value={formData.minimum_order}
            onChange={(e) => setFormData({...formData, minimum_order: parseFloat(e.target.value) || 0})}
            required
          />
        </div>
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
          {zone ? "Update" : "Create"} Zone
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

export default FulfillmentManager;