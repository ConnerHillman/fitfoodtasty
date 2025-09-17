import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Upload, Image } from "lucide-react";

interface Package {
  id: string;
  name: string;
  description?: string;
  meal_count: number;
  price: number;
  image_url?: string;
  is_active: boolean;
  sort_order: number;
}

interface PackageFormProps {
  package?: Package | null;
  onSuccess: (data: Omit<Package, 'id' | 'created_at' | 'updated_at'>) => void;
  onCancel: () => void;
}

const PackageForm = ({ package: editingPackage, onSuccess, onCancel }: PackageFormProps) => {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: editingPackage?.name || "",
    description: editingPackage?.description || "",
    meal_count: editingPackage?.meal_count?.toString() || "",
    price: editingPackage?.price?.toString() || "",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);

  const handleImageUpload = async (file: File): Promise<string | null> => {
    try {
      setIsUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = fileName;

      const { error: uploadError } = await supabase.storage
        .from('meal-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('meal-images')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({ 
        title: "Error", 
        description: "Failed to upload image", 
        variant: "destructive" 
      });
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let imageUrl = editingPackage?.image_url || "";
    
    if (imageFile) {
      const uploadedUrl = await handleImageUpload(imageFile);
      if (uploadedUrl) {
        imageUrl = uploadedUrl;
      }
    }

    const packageData = {
      name: formData.name,
      description: formData.description || undefined,
      meal_count: parseInt(formData.meal_count),
      price: parseFloat(formData.price),
      image_url: imageUrl || undefined,
      is_active: editingPackage?.is_active ?? true,
      sort_order: editingPackage?.sort_order ?? 0
    };

    onSuccess(packageData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Package Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., 5 Meal Package"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Perfect for trying our meals"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="meal_count">Meal Count</Label>
          <Input
            id="meal_count"
            type="number"
            value={formData.meal_count}
            onChange={(e) => setFormData({ ...formData, meal_count: e.target.value })}
            placeholder="5"
            min="1"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="price">Price (£)</Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            placeholder="42.00"
            min="0"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="image">Package Image</Label>
        <div className="flex items-center gap-2">
          <Input
            id="image"
            type="file"
            accept="image/*"
            onChange={(e) => setImageFile(e.target.files?.[0] || null)}
            className="flex-1"
          />
          {editingPackage?.image_url && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Image size={14} />
              <span>Current</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isUploading}>
          {isUploading ? (
            <>
              <Upload size={16} className="mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            editingPackage ? "Update Package" : "Create Package"
          )}
        </Button>
      </div>
    </form>
  );
};

export default PackageForm;