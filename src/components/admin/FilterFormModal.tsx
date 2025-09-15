import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { GenericModal } from "@/components/common";
import { useFiltersData } from "@/hooks/useFiltersData";
import type { Filter, FilterFormData } from "@/types/filter";

interface FilterFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filter?: Filter | null;
}

const FilterFormModal = ({ open, onOpenChange, filter }: FilterFormModalProps) => {
  const { createFilter, updateFilter } = useFiltersData();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState<FilterFormData>({
    name: '',
    type: 'dietary',
    category: 'Dietary',
    threshold: null,
    is_active: true,
  });

  // Dynamic threshold fields based on type
  const [thresholdFields, setThresholdFields] = useState<Record<string, any>>({});

  useEffect(() => {
    if (filter) {
      setFormData({
        name: filter.name,
        type: filter.type,
        category: filter.category || 'Dietary',
        threshold: filter.threshold,
        is_active: filter.is_active,
      });
      setThresholdFields(filter.threshold || {});
    } else {
      setFormData({
        name: '',
        type: 'dietary',
        category: 'Dietary',
        threshold: null,
        is_active: true,
      });
      setThresholdFields({});
    }
  }, [filter, open]);

  const handleTypeChange = (type: FilterFormData['type']) => {
    setFormData(prev => ({ ...prev, type }));
    
    // Reset threshold fields when type changes
    let defaultFields = {};
    
    switch (type) {
      case 'nutrition':
        defaultFields = { min_protein: '', max_carbs: '', max_fat: '', min_fiber: '' };
        break;
      case 'calorie':
        defaultFields = { min_calories: '', max_calories: '' };
        break;
      case 'sorting':
        defaultFields = { field: 'price', order: 'asc' };
        break;
      default:
        defaultFields = {};
    }
    
    setThresholdFields(defaultFields);
  };

  const handleThresholdFieldChange = (field: string, value: any) => {
    setThresholdFields(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Process threshold data
      let processedThreshold = null;
      
      if (formData.type !== 'dietary') {
        const filteredThreshold = Object.entries(thresholdFields).reduce((acc, [key, value]) => {
          if (value !== '' && value !== null && value !== undefined) {
            // Convert numeric fields to numbers
            if (key.includes('calories') || key.includes('protein') || key.includes('carbs') || key.includes('fat') || key.includes('fiber')) {
              acc[key] = Number(value);
            } else {
              acc[key] = value;
            }
          }
          return acc;
        }, {} as Record<string, any>);
        
        if (Object.keys(filteredThreshold).length > 0) {
          processedThreshold = filteredThreshold;
        }
      }

      const submitData = {
        ...formData,
        threshold: processedThreshold,
      };

      if (filter) {
        await updateFilter(filter.id, submitData);
      } else {
        await createFilter(submitData);
      }

      onOpenChange(false);
    } catch (error) {
      console.error('Error submitting filter:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderThresholdFields = () => {
    switch (formData.type) {
      case 'nutrition':
        return (
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Nutrition Thresholds</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="min_protein">Min Protein (g)</Label>
                <Input
                  id="min_protein"
                  type="number"
                  step="0.1"
                  placeholder="e.g., 20"
                  value={thresholdFields.min_protein || ''}
                  onChange={(e) => handleThresholdFieldChange('min_protein', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="max_carbs">Max Carbs (g)</Label>
                <Input
                  id="max_carbs"
                  type="number"
                  step="0.1"
                  placeholder="e.g., 20"
                  value={thresholdFields.max_carbs || ''}
                  onChange={(e) => handleThresholdFieldChange('max_carbs', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="max_fat">Max Fat (g)</Label>
                <Input
                  id="max_fat"
                  type="number"
                  step="0.1"
                  placeholder="e.g., 10"
                  value={thresholdFields.max_fat || ''}
                  onChange={(e) => handleThresholdFieldChange('max_fat', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="min_fiber">Min Fiber (g)</Label>
                <Input
                  id="min_fiber"
                  type="number"
                  step="0.1"
                  placeholder="e.g., 5"
                  value={thresholdFields.min_fiber || ''}
                  onChange={(e) => handleThresholdFieldChange('min_fiber', e.target.value)}
                />
              </div>
            </div>
          </div>
        );

      case 'calorie':
        return (
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Calorie Range</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="min_calories">Min Calories</Label>
                <Input
                  id="min_calories"
                  type="number"
                  placeholder="e.g., 200"
                  value={thresholdFields.min_calories || ''}
                  onChange={(e) => handleThresholdFieldChange('min_calories', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="max_calories">Max Calories</Label>
                <Input
                  id="max_calories"
                  type="number"
                  placeholder="e.g., 400"
                  value={thresholdFields.max_calories || ''}
                  onChange={(e) => handleThresholdFieldChange('max_calories', e.target.value)}
                />
              </div>
            </div>
          </div>
        );

      case 'sorting':
        return (
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Sort Configuration</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="field">Sort Field</Label>
                <Select
                  value={thresholdFields.field || 'price'}
                  onValueChange={(value) => handleThresholdFieldChange('field', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="price">Price</SelectItem>
                    <SelectItem value="total_calories">Calories</SelectItem>
                    <SelectItem value="total_protein">Protein</SelectItem>
                    <SelectItem value="created_at">Date Created</SelectItem>
                    <SelectItem value="name">Name</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="order">Sort Order</Label>
                <Select
                  value={thresholdFields.order || 'asc'}
                  onValueChange={(value) => handleThresholdFieldChange('order', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asc">Low to High</SelectItem>
                    <SelectItem value="desc">High to Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="text-sm text-muted-foreground">
            Dietary filters don't require threshold values.
          </div>
        );
    }
  };

  return (
    <GenericModal
      open={open}
      onOpenChange={onOpenChange}
      title={filter ? "Edit Filter" : "Create Filter"}
      description="Configure filter settings for the menu page."
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Filter Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., High Protein, Vegan"
              required
            />
          </div>

          <div>
            <Label htmlFor="type">Filter Type</Label>
            <Select
              value={formData.type}
              onValueChange={handleTypeChange}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dietary">Dietary</SelectItem>
                <SelectItem value="nutrition">Nutrition</SelectItem>
                <SelectItem value="calorie">Calorie</SelectItem>
                <SelectItem value="sorting">Sorting</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {renderThresholdFields()}

          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
            />
            <Label htmlFor="is_active">Active</Label>
          </div>
        </div>

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : filter ? "Update" : "Create"}
          </Button>
        </div>
      </form>
    </GenericModal>
  );
};

export default FilterFormModal;