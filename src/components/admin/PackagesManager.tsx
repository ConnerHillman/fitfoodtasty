import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Edit, Trash2, Upload, Image, Settings, GripVertical, BarChart3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import PackageAnalytics from "./PackageAnalytics";
import PackageMealsManager from "./packages/PackageMealsManager";
import { useStandardizedPackagesData, type Package } from "@/hooks/useStandardizedPackagesData";
import { logger } from "@/lib/logger";

// Drag and drop imports
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// Sortable row component
interface SortableRowProps {
  pkg: Package;
  onEdit: (pkg: Package) => void;
  onDelete: (id: string) => void;
  onToggleActive: (pkg: Package) => void;
  onManageMeals: (pkg: Package) => void;
}

const SortableRow = ({ pkg, onEdit, onDelete, onToggleActive, onManageMeals }: SortableRowProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: pkg.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      className={`${isDragging ? 'opacity-50 bg-muted' : ''}`}
    >
      <TableCell>
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-2 hover:bg-muted rounded-md transition-colors touch-none"
          title="Drag to reorder"
        >
          <GripVertical size={18} className="text-muted-foreground" />
        </button>
      </TableCell>
      <TableCell>
        {pkg.image_url ? (
          <img
            src={pkg.image_url}
            alt={pkg.name}
            className="w-12 h-12 object-cover rounded-md"
          />
        ) : (
          <div className="w-12 h-12 bg-muted rounded-md flex items-center justify-center">
            <Image size={16} className="text-muted-foreground" />
          </div>
        )}
      </TableCell>
      <TableCell className="font-medium">{pkg.name}</TableCell>
      <TableCell className="max-w-xs truncate">{pkg.description}</TableCell>
      <TableCell>
        <Badge variant="secondary">{pkg.meal_count} meals</Badge>
      </TableCell>
      <TableCell className="font-medium">£{pkg.price.toFixed(2)}</TableCell>
      <TableCell>
        <Button
          variant={pkg.is_active ? "default" : "secondary"}
          size="sm"
          onClick={() => onToggleActive(pkg)}
        >
          {pkg.is_active ? "Active" : "Inactive"}
        </Button>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onManageMeals(pkg)}
            title="Manage Available Meals"
          >
            <Settings size={14} />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(pkg)}
          >
            <Edit size={14} />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(pkg.id)}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 size={14} />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};

// Drag overlay row (what you see while dragging)
const DragOverlayRow = ({ pkg }: { pkg: Package }) => (
  <div className="bg-background border rounded-lg shadow-lg p-4 flex items-center gap-4">
    <GripVertical size={18} className="text-muted-foreground" />
    {pkg.image_url ? (
      <img src={pkg.image_url} alt={pkg.name} className="w-10 h-10 object-cover rounded-md" />
    ) : (
      <div className="w-10 h-10 bg-muted rounded-md flex items-center justify-center">
        <Image size={14} className="text-muted-foreground" />
      </div>
    )}
    <span className="font-medium">{pkg.name}</span>
    <Badge variant="secondary">{pkg.meal_count} meals</Badge>
    <span className="font-medium">£{pkg.price.toFixed(2)}</span>
  </div>
);

const PackagesManager = () => {
  const { toast } = useToast();
  const {
    allPackages: packages,
    loading,
    refetch,
    updatePackage,
    deletePackage,
    toggleActive: togglePackageActive
  } = useStandardizedPackagesData();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isMealsDialogOpen, setIsMealsDialogOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<Package | null>(null);
  const [selectedPackageForMeals, setSelectedPackageForMeals] = useState<Package | null>(null);
  const [availableMeals, setAvailableMeals] = useState<any[]>([]);
  const [packageMeals, setPackageMeals] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    meal_count: "",
    price: "",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Sort packages by sort_order
  const sortedPackages = useMemo(() => {
    return [...packages].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  }, [packages]);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id) return;

    const oldIndex = sortedPackages.findIndex((p) => p.id === active.id);
    const newIndex = sortedPackages.findIndex((p) => p.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    // Calculate new order
    const newOrder = arrayMove(sortedPackages, oldIndex, newIndex);

    // Update all sort_order values in database
    try {
      const updates = newOrder.map((pkg, index) => ({
        id: pkg.id,
        sort_order: index + 1,
      }));

      // Batch update using Promise.all
      await Promise.all(
        updates.map((update) =>
          supabase
            .from("packages")
            .update({ sort_order: update.sort_order })
            .eq("id", update.id)
        )
      );

      toast({ title: "Success", description: "Package order updated" });
      refetch();
    } catch (error) {
      logger.error("Failed to update package order", error);
      toast({ title: "Error", description: "Failed to update order", variant: "destructive" });
    }
  };

  const activePackage = activeId ? sortedPackages.find((p) => p.id === activeId) : null;

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
      logger.error('Error uploading image', error);
      toast({ title: "Error", description: "Failed to upload image", variant: "destructive" });
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
      description: formData.description || null,
      meal_count: parseInt(formData.meal_count),
      price: parseFloat(formData.price),
      image_url: imageUrl || null,
    };

    try {
      if (editingPackage) {
        await updatePackage(editingPackage.id, packageData);
      } else {
        // Get the max sort_order and add 1
        const maxSortOrder = Math.max(...packages.map(p => p.sort_order ?? 0), 0);
        const { error } = await supabase
          .from("packages")
          .insert([{ ...packageData, sort_order: maxSortOrder + 1 }]);
        if (error) throw error;
        toast({ title: "Success", description: "Package created successfully" });
      }
      
      setIsDialogOpen(false);
      resetForm();
      refetch();
    } catch (error) {
      logger.error('Failed to save package', error);
      toast({ title: "Error", description: "Failed to save package", variant: "destructive" });
    }
  };

  const resetForm = () => {
    setFormData({ name: "", description: "", meal_count: "", price: "" });
    setImageFile(null);
    setEditingPackage(null);
  };

  const handleEdit = (pkg: Package) => {
    setEditingPackage(pkg);
    setFormData({
      name: pkg.name,
      description: pkg.description || "",
      meal_count: pkg.meal_count.toString(),
      price: pkg.price.toString(),
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this package?")) return;
    await deletePackage(id);
  };

  const toggleActive = async (pkg: Package) => {
    await togglePackageActive(pkg.id);
  };

  const handleManageMeals = async (pkg: Package) => {
    setSelectedPackageForMeals(pkg);
    
    // Fetch all available meals
    const { data: meals, error: mealsError } = await supabase
      .from("meals")
      .select("id, name, category, is_active")
      .eq("is_active", true)
      .order("name");

    if (mealsError) {
      toast({ title: "Error", description: "Failed to fetch meals", variant: "destructive" });
      return;
    }

    // Fetch current package meals
    const { data: currentPackageMeals, error: packageMealsError } = await supabase
      .from("package_meals")
      .select("meal_id")
      .eq("package_id", pkg.id);

    if (packageMealsError) {
      toast({ title: "Error", description: "Failed to fetch package meals", variant: "destructive" });
      return;
    }

    setAvailableMeals(meals || []);
    setPackageMeals(currentPackageMeals?.map(pm => pm.meal_id) || []);
    setIsMealsDialogOpen(true);
  };

  const handleMealToggle = (mealId: string) => {
    setPackageMeals(prev => 
      prev.includes(mealId) 
        ? prev.filter(id => id !== mealId)
        : [...prev, mealId]
    );
  };

  const saveMealSelections = async () => {
    if (!selectedPackageForMeals) return;

    try {
      // Delete existing package meals
      await supabase
        .from("package_meals")
        .delete()
        .eq("package_id", selectedPackageForMeals.id);

      // Insert new package meals
      if (packageMeals.length > 0) {
        const packageMealData = packageMeals.map(mealId => ({
          package_id: selectedPackageForMeals.id,
          meal_id: mealId
        }));

        const { error } = await supabase
          .from("package_meals")
          .insert(packageMealData);

        if (error) throw error;
      }

      toast({ 
        title: "Success", 
        description: `Updated meals for ${selectedPackageForMeals.name}` 
      });
      setIsMealsDialogOpen(false);
    } catch (error) {
      logger.error("Error saving meal selections", error);
      toast({ 
        title: "Error", 
        description: "Failed to save meal selections", 
        variant: "destructive" 
      });
    }
  };

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-xl border bg-gradient-to-br from-primary/10 via-primary/5 to-background p-8">
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">Package Management</h2>
              <p className="text-muted-foreground">Create and manage meal packages with pricing and analytics</p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm} className="bg-primary hover:bg-primary/90">
                  <Plus size={16} className="mr-2" />
                  Add Package
                </Button>
              </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold">{editingPackage ? "Edit Package" : "Add New Package"}</DialogTitle>
            </DialogHeader>
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
                  rows={2}
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
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isUploading} className="bg-primary hover:bg-primary/90">
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
          </DialogContent>
        </Dialog>
      </div>

        </div>
      </div>

      <Tabs defaultValue="management" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
          <TabsTrigger value="management" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Package Management
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics & Insights
          </TabsTrigger>
        </TabsList>

        <TabsContent value="management" className="space-y-6">
          <Card className="overflow-hidden border-0 shadow-sm">
            <CardHeader className="bg-muted/30 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Packages ({packages.length})</CardTitle>
                <p className="text-sm text-muted-foreground">Drag rows to reorder</p>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12"></TableHead>
                      <TableHead>Image</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Meals</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <SortableContext
                      items={sortedPackages.map((p) => p.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {sortedPackages.map((pkg) => (
                        <SortableRow
                          key={pkg.id}
                          pkg={pkg}
                          onEdit={handleEdit}
                          onDelete={handleDelete}
                          onToggleActive={toggleActive}
                          onManageMeals={handleManageMeals}
                        />
                      ))}
                    </SortableContext>
                  </TableBody>
                </Table>
                <DragOverlay>
                  {activePackage ? <DragOverlayRow pkg={activePackage} /> : null}
                </DragOverlay>
              </DndContext>
            </CardContent>
          </Card>

      {/* Meal Selection Dialog */}
      <Dialog open={isMealsDialogOpen} onOpenChange={setIsMealsDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              Manage Meals for {selectedPackageForMeals?.name}
            </DialogTitle>
          </DialogHeader>
          
          {selectedPackageForMeals && (
            <PackageMealsManager
              package={{
                id: selectedPackageForMeals.id,
                name: selectedPackageForMeals.name,
                meal_count: selectedPackageForMeals.meal_count
              }}
              onSuccess={() => {
                setIsMealsDialogOpen(false);
                refetch();
              }}
              onCancel={() => setIsMealsDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <PackageAnalytics />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PackagesManager;
