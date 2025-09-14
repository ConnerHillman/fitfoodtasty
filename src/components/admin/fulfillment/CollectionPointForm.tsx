import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import type { CollectionPoint, GlobalSchedule } from "@/types/fulfillment";
import { DAYS_OF_WEEK } from "@/types/fulfillment";

interface CollectionPointFormProps {
  collectionPoint: CollectionPoint | null;
  globalSchedule: GlobalSchedule[];
  onSubmit: (data: any) => void;
  onClose: () => void;
}

export function CollectionPointForm({ 
  collectionPoint, 
  globalSchedule, 
  onSubmit, 
  onClose 
}: CollectionPointFormProps) {
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
    is_active: collectionPoint?.is_active ?? true,
  });

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

        <div className="flex items-center space-x-2">
          <Switch
            checked={formData.is_active}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
          />
          <Label>Active</Label>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Address</Label>
          <Input
            value={formData.address}
            onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
            placeholder="Street Address"
            required
          />
        </div>

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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Phone</Label>
          <Input
            value={formData.phone}
            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            placeholder="Phone Number"
          />
        </div>

        <div className="space-y-2">
          <Label>Email</Label>
          <Input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            placeholder="Email Address"
          />
        </div>
      </div>

      <div className="space-y-4">
        <Label>Collection Days</Label>
        <div className="flex flex-wrap gap-2">
          {DAYS_OF_WEEK.map(day => (
            <div key={day.value} className="flex items-center space-x-2">
              <Checkbox
                checked={formData.collection_days.includes(day.value)}
                onCheckedChange={() => handleDayToggle(day.value)}
              />
              <Label className="text-sm">{day.label}</Label>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

        <div className="space-y-2">
          <Label>Maximum Capacity</Label>
          <Input
            type="number"
            value={formData.maximum_capacity}
            onChange={(e) => setFormData(prev => ({ ...prev, maximum_capacity: parseInt(e.target.value) || 50 }))}
            placeholder="50"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Special Instructions</Label>
        <Textarea
          value={formData.special_instructions}
          onChange={(e) => setFormData(prev => ({ ...prev, special_instructions: e.target.value }))}
          placeholder="Any special instructions for collection"
          rows={3}
        />
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit">
          {collectionPoint ? 'Update' : 'Create'} Collection Point
        </Button>
      </div>
    </form>
  );
}