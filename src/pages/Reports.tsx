import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  Calendar, 
  ChefHat, 
  Package2, 
  List, 
  FileText, 
  Printer, 
  Download,
  Clock,
  Users,
  MapPin,
  Calculator,
  Clipboard,
  Tags
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const Reports = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [packageOrders, setPackageOrders] = useState<any[]>([]);
  const [meals, setMeals] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [ingredients, setIngredients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchReportsData();
  }, []);

  const fetchReportsData = async () => {
    try {
      // Fetch all data needed for reports
      const [ordersRes, packageOrdersRes, mealsRes, packagesRes, ingredientsRes] = await Promise.all([
        supabase.from("orders").select(`
          *,
          order_items (
            id,
            meal_name,
            quantity,
            unit_price,
            total_price,
            meal_id
          )
        `).order("created_at", { ascending: false }),
        
        supabase.from("package_orders").select(`
          *,
          package_meal_selections (
            id,
            quantity,
            meal_id
          )
        `).order("created_at", { ascending: false }),
        
        supabase.from("meals").select("*").eq("is_active", true),
        supabase.from("packages").select("*").eq("is_active", true),
        supabase.from("ingredients").select("*")
      ]);

      if (ordersRes.error) throw ordersRes.error;
      if (packageOrdersRes.error) throw packageOrdersRes.error;
      if (mealsRes.error) throw mealsRes.error;
      if (packagesRes.error) throw packagesRes.error;
      if (ingredientsRes.error) throw ingredientsRes.error;

      setOrders(ordersRes.data || []);
      setPackageOrders(packageOrdersRes.data || []);
      setMeals(mealsRes.data || []);
      setPackages(packagesRes.data || []);
      setIngredients(ingredientsRes.data || []);
    } catch (error) {
      console.error("Error fetching reports data:", error);
      toast({
        title: "Error",
        description: "Failed to fetch reports data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Calculate production data
  const getItemProduction = () => {
    const production = new Map();
    orders.forEach(order => {
      order.order_items?.forEach(item => {
        const current = production.get(item.meal_name) || 0;
        production.set(item.meal_name, current + item.quantity);
      });
    });
    return Array.from(production.entries()).map(([name, quantity]) => ({ name, quantity }));
  };

  const getIngredientsProduction = () => {
    // This would require meal_ingredients data to calculate properly
    return ingredients.map(ing => ({ name: ing.name, quantity: 0 }));
  };

  const ReportCard = ({ title, description, icon: Icon, children, variant = "default" }) => (
    <Card className={`transition-all duration-200 hover:shadow-lg ${
      variant === "primary" ? "border-primary bg-primary/5" : ""
    }`}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${
            variant === "primary" ? "bg-primary text-primary-foreground" : "bg-muted"
          }`}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            <CardDescription className="text-sm">{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2 flex items-center gap-3">
            <ChefHat className="h-8 w-8 text-primary" />
            Kitchen Reports
          </h1>
          <p className="text-muted-foreground text-lg">Production planning and order management</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="px-3 py-1">
            <Calendar className="h-4 w-4 mr-2" />
            {new Date().toLocaleDateString('en-GB', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </Badge>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export All
          </Button>
        </div>
      </div>

      <Tabs defaultValue="kitchen" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="kitchen" className="flex items-center gap-2">
            <ChefHat className="h-4 w-4" />
            Kitchen Preparation
          </TabsTrigger>
          <TabsTrigger value="orders" className="flex items-center gap-2">
            <Package2 className="h-4 w-4" />
            Order Preparation
          </TabsTrigger>
        </TabsList>

        {/* Kitchen Preparation Tab */}
        <TabsContent value="kitchen" className="space-y-6">
          {/* Top Row - Featured Reports */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ReportCard
              title="Item Production"
              description="Summarizes the quantity of each item needed to fulfill orders"
              icon={Calculator}
              variant="primary"
            >
              <div className="space-y-3">
                {getItemProduction().slice(0, 5).map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-background rounded-lg border">
                    <span className="font-medium">{item.name}</span>
                    <Badge variant="secondary">{item.quantity} units</Badge>
                  </div>
                ))}
                <Button variant="outline" className="w-full mt-3">
                  <FileText className="h-4 w-4 mr-2" />
                  View Full Report
                </Button>
              </div>
            </ReportCard>

            <ReportCard
              title="Ingredients Production"
              description="Summarizes the quantity of each ingredient needed to fulfill orders"
              icon={Clipboard}
            >
              <div className="space-y-3">
                {ingredients.slice(0, 5).map((ingredient, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="font-medium">{ingredient.name}</span>
                    <Badge variant="outline">Calculate needed</Badge>
                  </div>
                ))}
                <Button variant="outline" className="w-full mt-3">
                  <Calculator className="h-4 w-4 mr-2" />
                  Calculate Requirements
                </Button>
              </div>
            </ReportCard>
          </div>

          {/* Second Row - Additional Reports */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <ReportCard
              title="Item Ingredient Recipes"
              description="Displays the specific ingredients needed for each item"
              icon={List}
            >
              <div className="text-center py-6">
                <List className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground mb-4">
                  {meals.length} recipes available
                </p>
                <Button variant="outline" size="sm">
                  View Recipes
                </Button>
              </div>
            </ReportCard>

            <ReportCard
              title="Production Inventory"
              description="Ingredients & supply production report broken down by menu items"
              icon={Package2}
            >
              <div className="text-center py-6">
                <Package2 className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground mb-4">
                  Track ingredient usage
                </p>
                <Button variant="outline" size="sm">
                  View Inventory
                </Button>
              </div>
            </ReportCard>

            <ReportCard
              title="Items"
              description="List of all items on your menu"
              icon={ChefHat}
            >
              <div className="text-center py-6">
                <ChefHat className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground mb-4">
                  {meals.length} active meals
                </p>
                <Button variant="outline" size="sm">
                  View Menu Items
                </Button>
              </div>
            </ReportCard>
          </div>
        </TabsContent>

        {/* Order Preparation Tab */}
        <TabsContent value="orders" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ReportCard
              title="Order Item Summary"
              description="List of orders and their corresponding items"
              icon={FileText}
              variant="primary"
            >
              <div className="space-y-3">
                {orders.slice(0, 3).map((order, index) => (
                  <div key={index} className="p-3 bg-background rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Order #{order.id.slice(-8)}</span>
                      <Badge variant={order.status === 'confirmed' ? 'default' : 'secondary'}>
                        {order.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {order.order_items?.length || 0} items • £{order.total_amount}
                    </p>
                  </div>
                ))}
                <Button variant="outline" className="w-full mt-3">
                  <FileText className="h-4 w-4 mr-2" />
                  View All Orders
                </Button>
              </div>
            </ReportCard>

            <ReportCard
              title="Order Package Summary"
              description="List of orders and their corresponding packages only"
              icon={Package2}
            >
              <div className="space-y-3">
                {packageOrders.length > 0 ? (
                  packageOrders.slice(0, 3).map((order, index) => (
                    <div key={index} className="p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">Package Order #{order.id.slice(-8)}</span>
                        <Badge variant="outline">{order.status}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Package • £{order.total_amount}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6">
                    <Package2 className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                    <p className="text-sm text-muted-foreground">No package orders yet</p>
                  </div>
                )}
              </div>
            </ReportCard>
          </div>

          {/* Print & Label Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <ReportCard
              title="Packing Slips"
              description="Order summaries designed to be printed for customers"
              icon={Printer}
            >
              <div className="text-center py-4">
                <Button variant="outline" size="sm" className="w-full">
                  <Printer className="h-4 w-4 mr-2" />
                  Print Slips
                </Button>
              </div>
            </ReportCard>

            <ReportCard
              title="Package Packing Slips"
              description="Packing slips exclusively for package orders"
              icon={Package2}
            >
              <div className="text-center py-4">
                <Button variant="outline" size="sm" className="w-full">
                  <Package2 className="h-4 w-4 mr-2" />
                  Print Package Slips
                </Button>
              </div>
            </ReportCard>

            <ReportCard
              title="Item Labels"
              description="Printed labels for your items to put on containers"
              icon={Tags}
            >
              <div className="text-center py-4">
                <Button variant="outline" size="sm" className="w-full">
                  <Tags className="h-4 w-4 mr-2" />
                  Print Item Labels
                </Button>
              </div>
            </ReportCard>

            <ReportCard
              title="Order Labels"
              description="Printed labels for your orders to put on order bags"
              icon={MapPin}
            >
              <div className="text-center py-4">
                <Button variant="outline" size="sm" className="w-full">
                  <MapPin className="h-4 w-4 mr-2" />
                  Print Order Labels
                </Button>
              </div>
            </ReportCard>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reports;