import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Edit, Trash2, Upload, Image, Settings, ChevronUp, ChevronDown, BarChart3, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import PackageAnalytics from "./PackageAnalytics";

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

const PackagesManager = () => {
  const [packages, setPackages] = useState<Package[]>([]);
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
  const { toast } = useToast();

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    const { data, error } = await supabase
      .from("packages")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) {
      toast({ title: "Error", description: "Failed to fetch packages", variant: "destructive" });
    } else {
      setPackages(data || []);
    }
  };

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

    let error;
    if (editingPackage) {
      ({ error } = await supabase
        .from("packages")
        .update(packageData)
        .eq("id", editingPackage.id));
    } else {
      ({ error } = await supabase
        .from("packages")
        .insert([packageData]));
    }

    if (error) {
      toast({ title: "Error", description: "Failed to save package", variant: "destructive" });
    } else {
      toast({ title: "Success", description: `Package ${editingPackage ? "updated" : "created"} successfully` });
      setIsDialogOpen(false);
      resetForm();
      fetchPackages();
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

    const { error } = await supabase
      .from("packages")
      .delete()
      .eq("id", id);

    if (error) {
      toast({ title: "Error", description: "Failed to delete package", variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Package deleted successfully" });
      fetchPackages();
    }
  };

  const toggleActive = async (pkg: Package) => {
    const { error } = await supabase
      .from("packages")
      .update({ is_active: !pkg.is_active })
      .eq("id", pkg.id);

    if (error) {
      toast({ title: "Error", description: "Failed to update package status", variant: "destructive" });
    } else {
      toast({ title: "Success", description: `Package ${!pkg.is_active ? "activated" : "deactivated"}` });
      fetchPackages();
    }
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
      console.error("Error saving meal selections:", error);
      toast({ 
        title: "Error", 
        description: "Failed to save meal selections", 
        variant: "destructive" 
      });
    }
  };

  const movePackage = async (packageId: string, direction: 'up' | 'down') => {
    const currentIndex = packages.findIndex(p => p.id === packageId);
    if (currentIndex === -1) return;
    
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= packages.length) return;

    const currentPackage = packages[currentIndex];
    const targetPackage = packages[newIndex];

    // Swap sort_order values
    const { error: error1 } = await supabase
      .from("packages")
      .update({ sort_order: targetPackage.sort_order })
      .eq("id", currentPackage.id);

    const { error: error2 } = await supabase
      .from("packages")
      .update({ sort_order: currentPackage.sort_order })
      .eq("id", targetPackage.id);

    if (error1 || error2) {
      toast({ title: "Error", description: "Failed to reorder packages", variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Package order updated" });
      fetchPackages();
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
          <CardTitle className="text-lg">Packages ({packages.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
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
              {packages.map((pkg, index) => (
                <TableRow key={pkg.id}>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => movePackage(pkg.id, 'up')}
                        disabled={index === 0}
                        className="h-8 w-8 p-0"
                      >
                        <ChevronUp size={14} />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => movePackage(pkg.id, 'down')}
                        disabled={index === packages.length - 1}
                        className="h-8 w-8 p-0"
                      >
                        <ChevronDown size={14} />
                      </Button>
                    </div>
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
                      onClick={() => toggleActive(pkg)}
                    >
                      {pkg.is_active ? "Active" : "Inactive"}
                    </Button>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleManageMeals(pkg)}
                        title="Manage Available Meals"
                      >
                        <Settings size={14} />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(pkg)}
                      >
                        <Edit size={14} />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(pkg.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Meal Selection Dialog */}
      <Dialog open={isMealsDialogOpen} onOpenChange={setIsMealsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Manage Meals for {selectedPackageForMeals?.name}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Select which meals customers can choose from when purchasing this package.
              Selected: {packageMeals.length} meals
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableMeals.map((meal) => {
                const isSelected = packageMeals.includes(meal.id);
                return (
                  <Card 
                    key={meal.id} 
                    className={`cursor-pointer transition-colors ${
                      isSelected ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-muted/50'
                    }`}
                    onClick={() => handleMealToggle(meal.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{meal.name}</h4>
                          <Badge variant="outline" className="mt-1">
                            {meal.category}
                          </Badge>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          isSelected 
                            ? 'bg-primary border-primary' 
                            : 'border-muted-foreground'
                        }`}>
                          {isSelected && (
                            <div className="w-2 h-2 bg-white rounded-full" />
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setIsMealsDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={saveMealSelections}>
                Save Meal Selection
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Package Analytics & Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PackageAnalytics />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PackagesManager;