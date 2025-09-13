import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, ChefHat, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface GlobalSchedule {
  id: string;
  day_of_week: string;
  default_cutoff_time: string;
  default_production_lead_days: number;
  default_production_same_day: boolean;
  is_active: boolean;
}

interface WeeklyScheduleManagerProps {
  globalSchedule: GlobalSchedule[];
  onScheduleUpdate: () => void;
}

const WeeklyScheduleManager = ({ globalSchedule, onScheduleUpdate }: WeeklyScheduleManagerProps) => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const daysOfWeek = [
    'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
  ];

  const getScheduleForDay = (day: string) => {
    return globalSchedule.find(s => s.day_of_week === day) || {
      id: '',
      day_of_week: day,
      default_cutoff_time: '23:59',
      default_production_lead_days: 2,
      default_production_same_day: false,
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
    const dayIndex = daysOfWeek.indexOf(day);
    const today = new Date();
    const targetDay = new Date(today);
    targetDay.setDate(today.getDate() + (dayIndex - today.getDay() + 7) % 7);
    
    if (schedule.default_production_same_day) {
      return `Production: Same day as delivery`;
    } else {
      const productionDay = new Date(targetDay);
      productionDay.setDate(targetDay.getDate() - schedule.default_production_lead_days);
      return `Production: ${productionDay.toLocaleDateString('en-GB', { weekday: 'long' })}`;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Weekly Schedule Defaults
          </CardTitle>
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
                <Card key={day} className="border-l-4 border-l-primary/20">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-lg capitalize flex items-center gap-2">
                        {day}
                        <Badge variant="secondary" className="text-xs">
                          {schedule.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-sm font-medium">
                          <Clock className="h-4 w-4" />
                          Customer Order Cutoff
                        </Label>
                        <Input
                          type="time"
                          value={formatTimeForInput(schedule.default_cutoff_time)}
                          onChange={(e) => updateSchedule(day, 'default_cutoff_time', e.target.value + ':00')}
                          disabled={saving}
                        />
                        <p className="text-xs text-muted-foreground">
                          Latest time customers can order for {day} delivery
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-sm font-medium">
                          <ChefHat className="h-4 w-4" />
                          Kitchen Production
                        </Label>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={schedule.default_production_same_day}
                            onCheckedChange={(checked) => updateSchedule(day, 'default_production_same_day', checked)}
                            disabled={saving}
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
                              disabled={saving}
                              className="w-20"
                            />
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Preview</Label>
                        <div className="p-3 bg-muted rounded-md">
                          <p className="text-sm font-medium">
                            Cutoff: {schedule.default_cutoff_time.slice(0, 5)}
                          </p>
                          <p className="text-xs text-muted-foreground">
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