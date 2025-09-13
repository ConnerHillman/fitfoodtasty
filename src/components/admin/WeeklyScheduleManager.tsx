import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, ChefHat, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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

interface WeeklyScheduleManagerProps {
  globalSchedule: GlobalSchedule[];
  deliveryZones?: any[];
  onScheduleUpdate: () => void;
}

const WeeklyScheduleManager = ({ globalSchedule, deliveryZones = [], onScheduleUpdate }: WeeklyScheduleManagerProps) => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const daysOfWeek = [
    'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
  ];

  const dayLabels = {
    monday: 'Monday',
    tuesday: 'Tuesday', 
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday',
    saturday: 'Saturday',
    sunday: 'Sunday'
  };

  const getScheduleForDay = (day: string) => {
    return globalSchedule.find(s => s.day_of_week === day) || {
      id: '',
      day_of_week: day,
      default_cutoff_time: '23:59',
      default_cutoff_day: day, // Default to same day
      default_production_lead_days: 2,
      default_production_same_day: false,
      is_business_open: true,
      is_active: true
    };
  };

  const updateSchedule = async (day: string, field: string, value: any) => {
    setSaving(true);
    try {
      const schedule = getScheduleForDay(day);
      const updateData = {
        day_of_week: day,
        [field]: value,
        is_active: true
      };

      if (schedule.id) {
        const { error } = await supabase
          .from('global_fulfillment_schedule')
          .update(updateData)
          .eq('id', schedule.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('global_fulfillment_schedule')
          .insert([updateData]);
        if (error) throw error;
      }

      toast({
        title: "Success",
        description: `${day.charAt(0).toUpperCase() + day.slice(1)} schedule updated`,
      });

      onScheduleUpdate();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const formatTimeForInput = (time: string) => {
    // Convert "HH:MM:SS" to "HH:MM"
    return time.split(':').slice(0, 2).join(':');
  };

  const getProductionPreview = (day: string) => {
    const schedule = getScheduleForDay(day);
    const cutoffDay = schedule.default_cutoff_day || day;
    const cutoffTime = formatTimeForInput(schedule.default_cutoff_time);
    
    if (!schedule.is_business_open) {
      return `CLOSED - No deliveries or collections available`;
    }
    
    if (schedule.default_production_same_day) {
      return `Orders close: ${dayLabels[cutoffDay as keyof typeof dayLabels]} ${cutoffTime} • Production: Same day as delivery`;
    } else {
      const dayIndex = daysOfWeek.indexOf(day);
      const today = new Date();
      const targetDay = new Date(today);
      targetDay.setDate(today.getDate() + (dayIndex - today.getDay() + 7) % 7);
      const productionDay = new Date(targetDay);
      productionDay.setDate(targetDay.getDate() - schedule.default_production_lead_days);
      return `Orders close: ${dayLabels[cutoffDay as keyof typeof dayLabels]} ${cutoffTime} • Production: ${productionDay.toLocaleDateString('en-GB', { weekday: 'long' })}`;
    }
  };

  const syncFromDeliveryZones = async () => {
    setSaving(true);
    try {
      // Find the most common cutoff settings from delivery zones
      const zoneCutoffs: { [key: string]: { day: string; time: string; count: number } } = {};
      
      deliveryZones.forEach((zone: any) => {
        if (zone.order_cutoffs) {
          Object.entries(zone.order_cutoffs).forEach(([deliveryDay, cutoff]: [string, any]) => {
            if (cutoff.cutoff_day && cutoff.cutoff_time) {
              const key = deliveryDay;
              if (!zoneCutoffs[key] || zoneCutoffs[key].count < 1) {
                zoneCutoffs[key] = {
                  day: cutoff.cutoff_day,
                  time: cutoff.cutoff_time + ':00', // Ensure seconds
                  count: 1
                };
              }
            }
          });
        }
      });

      // Update global schedule with zone settings
      for (const [deliveryDay, cutoff] of Object.entries(zoneCutoffs)) {
        await updateSchedule(deliveryDay, 'default_cutoff_day', cutoff.day);
        await updateSchedule(deliveryDay, 'default_cutoff_time', cutoff.time);
      }

      toast({
        title: "Success",
        description: `Synced cutoff settings from ${Object.keys(zoneCutoffs).length} delivery zones`,
      });

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Weekly Schedule Defaults
              </CardTitle>
            </div>
            {deliveryZones.length > 0 && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={syncFromDeliveryZones}
                disabled={saving}
              >
                Sync from Delivery Zones
              </Button>
            )}
          </div>
          <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-700 dark:text-blue-300">
              <p className="font-medium mb-1">How this works:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Set global defaults for customer order cutoff times and kitchen production schedules</li>
                <li>Delivery zones and collection points can inherit these defaults or override them</li>
                <li>Customer cutoff = latest time customers can place orders for that delivery day</li>
                <li>Production lead = how many days before delivery the kitchen starts production</li>
              </ul>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {daysOfWeek.map((day) => {
              const schedule = getScheduleForDay(day);
              return (
                <Card key={day} className={`border-l-4 ${schedule.is_business_open ? 'border-l-primary/20' : 'border-l-red-500/50 bg-red-50/30 dark:bg-red-950/30'}`}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-lg capitalize flex items-center gap-2">
                        {day}
                        <Badge variant={schedule.is_business_open ? "default" : "destructive"} className="text-xs">
                          {schedule.is_business_open ? 'Open' : 'Closed'}
                        </Badge>
                      </h3>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={schedule.is_business_open}
                          onCheckedChange={(checked) => updateSchedule(day, 'is_business_open', checked)}
                          disabled={saving}
                        />
                        <Label className="text-sm font-medium">Open for business</Label>
                      </div>
                    </div>
                    
                    <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 ${!schedule.is_business_open ? 'opacity-50 pointer-events-none' : ''}`}>
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-sm font-medium">
                          <Clock className="h-4 w-4" />
                          Customer Order Cutoff
                        </Label>
                        <div className="space-y-2">
                          <div>
                            <Label className="text-xs text-muted-foreground">Cutoff Day</Label>
                            <Select
                              value={schedule.default_cutoff_day || day}
                              onValueChange={(value) => updateSchedule(day, 'default_cutoff_day', value)}
                              disabled={saving || !schedule.is_business_open}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {daysOfWeek.map((d) => (
                                  <SelectItem key={d} value={d}>
                                    {dayLabels[d as keyof typeof dayLabels]}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Cutoff Time</Label>
                            <Input
                              type="time"
                              value={formatTimeForInput(schedule.default_cutoff_time)}
                              onChange={(e) => updateSchedule(day, 'default_cutoff_time', e.target.value + ':00')}
                              disabled={saving || !schedule.is_business_open}
                            />
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Latest time customers can order for {day} delivery
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-sm font-medium">
                          <ChefHat className="h-4 w-4" />
                          Kitchen Production
                        </Label>
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={schedule.default_production_same_day}
                              onCheckedChange={(checked) => updateSchedule(day, 'default_production_same_day', checked)}
                              disabled={saving || !schedule.is_business_open}
                            />
                            <Label className="text-sm">Same day production</Label>
                          </div>
                          {!schedule.default_production_same_day && (
                            <div className="space-y-1">
                              <Label className="text-xs text-muted-foreground">Lead time (days)</Label>
                              <Input
                                type="number"
                                min="1"
                                max="7"
                                value={schedule.default_production_lead_days}
                                onChange={(e) => updateSchedule(day, 'default_production_lead_days', parseInt(e.target.value))}
                                disabled={saving || !schedule.is_business_open}
                                className="w-20"
                              />
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Preview</Label>
                        <div className={`p-3 rounded-md ${schedule.is_business_open ? 'bg-muted' : 'bg-red-100 dark:bg-red-950'}`}>
                          <p className={`text-xs leading-relaxed ${schedule.is_business_open ? 'text-muted-foreground' : 'text-red-700 dark:text-red-300 font-medium'}`}>
                            {getProductionPreview(day)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WeeklyScheduleManager;