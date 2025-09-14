import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DeliveryZone, GlobalSchedule } from "@/types/fulfillment";
import { DAYS_OF_WEEK } from "@/types/fulfillment";

interface DeliveryZoneFormProps {
  zone: DeliveryZone | null;
  globalSchedule: GlobalSchedule[];
  onSubmit: (data: any) => void;
  onClose: () => void;
}

export function DeliveryZoneForm({ zone, globalSchedule, onSubmit, onClose }: DeliveryZoneFormProps) {
  const [formData, setFormData] = useState({
    zone_name: zone?.zone_name || '',
    postcodes: zone?.postcodes?.join(', ') || '',
    postcode_prefixes: zone?.postcode_prefixes?.join(', ') || '',
    delivery_days: zone?.delivery_days || [],
    delivery_fee: zone?.delivery_fee || 0,
    minimum_order: zone?.minimum_order || 0,
    maximum_distance_km: zone?.maximum_distance_km || null,
    production_lead_days: zone?.production_lead_days || 2,
    production_same_day: zone?.production_same_day || false,
    production_notes: zone?.production_notes || '',
    business_hours_override: zone?.business_hours_override || {},
    is_active: zone?.is_active ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData = {
      ...formData,
      postcodes: formData.postcodes.split(',').map(p => p.trim()).filter(p => p),
      postcode_prefixes: formData.postcode_prefixes.split(',').map(p => p.trim()).filter(p => p),
    };
    
    onSubmit(submitData);
  };

  const handleDayToggle = (day: string) => {
    setFormData(prev => ({
      ...prev,
      delivery_days: prev.delivery_days.includes(day)
        ? prev.delivery_days.filter(d => d !== day)
        : [...prev.delivery_days, day]
    }));
  };

  const handleBusinessHourOverride = (day: string, isOpen: boolean, reason?: string) => {
    setFormData(prev => ({
      ...prev,
      business_hours_override: {
        ...prev.business_hours_override,
        [day]: { is_open: isOpen, override_reason: reason || 'Custom override' }
      }
    }));
  };

  const removeBusinessHourOverride = (day: string) => {
    setFormData(prev => {
      const newOverrides = { ...prev.business_hours_override };
      delete newOverrides[day];
      return { ...prev, business_hours_override: newOverrides };
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Zone Name</Label>
          <Input
            value={formData.zone_name}
            onChange={(e) => setFormData(prev => ({ ...prev, zone_name: e.target.value }))}
            placeholder="Zone Name"
            required
          />
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            checked={formData.is_active}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
          />
          <Label>Active</Label>
        </div>
      </div>

      <div className="space-y-4">
        <Label>Delivery Days</Label>
        <div className="flex flex-wrap gap-2">
          {DAYS_OF_WEEK.map(day => (
            <div key={day.value} className="flex items-center space-x-2">
              <Checkbox
                checked={formData.delivery_days.includes(day.value)}
                onCheckedChange={() => handleDayToggle(day.value)}
              />
              <Label className="text-sm">{day.label}</Label>
            </div>
          ))}
        </div>
      </div>

      {/* Business Hours Overrides */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Business Hours Override</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {DAYS_OF_WEEK.map((day) => {
            const globalDay = globalSchedule.find(g => g.day_of_week === day.value);
            const isGlobalOpen = globalDay?.is_business_open ?? true;
            const hasOverride = formData.business_hours_override[day.value];

            return (
              <div key={day.value} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-4">
                  <span className="font-medium capitalize w-20">{day.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Global:</span>
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
            onChange={(e) => setFormData(prev => ({ ...prev, delivery_fee: e.target.value === '' ? 0 : parseFloat(e.target.value) }))}
            placeholder="0.00"
          />
        </div>

        <div className="space-y-2">
          <Label>Minimum Order (£)</Label>
          <Input
            type="number"
            step="0.01"
            value={formData.minimum_order}
            onChange={(e) => setFormData(prev => ({ ...prev, minimum_order: e.target.value === '' ? 0 : parseFloat(e.target.value) }))}
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