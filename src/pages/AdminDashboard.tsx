import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import IngredientsManager from "@/components/admin/IngredientsManager";
import MealsManager from "@/components/admin/MealsManager";
import CategoriesManager from "@/components/admin/CategoriesManager";
import PackagesManager from "@/components/admin/PackagesManager";
import ReferralSettingsAdmin from "@/components/admin/ReferralSettingsAdmin";
import BusinessDashboard from "@/components/admin/BusinessDashboard";
import Reports from "@/components/admin/Reports";
import AllOrders from "@/pages/AllOrders";
import CustomersManager from "@/components/admin/CustomersManager";
import CustomerDetailModal from "@/components/admin/CustomerDetailModal";
import Marketing from "@/components/admin/Marketing";
import { ChefHat, Package, ShoppingBag, Upload, Tag, Gift, BarChart3, FileText, TrendingUp, ListOrdered, Users, Tags } from "lucide-react";
import DataImporter from "@/components/DataImporter";
import { LabelGenerator as LabelGeneratorComponent } from "@/components/LabelGenerator";
import { useSearchParams } from "react-router-dom";
import { CustomerDetailProvider } from "@/contexts/CustomerDetailContext";
const AdminDashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') || 'dashboard') as string;
  const [tab, setTab] = useState<string>(initialTab);
  useEffect(() => {
    const t = (searchParams.get('tab') || 'dashboard') as string;
    setTab(t);
  }, [searchParams]);

  return (
    <CustomerDetailProvider>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center space-x-4">
          <ChefHat className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage your meal prep business</p>
          </div>
        </div>

        <Tabs value={tab} onValueChange={(v) => { setTab(v); setSearchParams({ tab: v }); }} className="space-y-8">
          <div className="relative bg-gradient-to-r from-background via-background/95 to-background backdrop-blur-sm border border-border/50 rounded-xl p-2 shadow-lg">
            <TabsList className="grid w-full grid-cols-11 bg-transparent gap-1 p-0 h-auto">
              <TabsTrigger 
                value="dashboard" 
                className="flex items-center space-x-2 px-4 py-3 rounded-lg transition-all duration-300 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-md data-[state=active]:shadow-primary/20 hover:bg-muted/50 text-sm font-medium"
              >
                <span>Dashboard</span>
              </TabsTrigger>
              <TabsTrigger 
                value="orders" 
                className="flex items-center space-x-2 px-4 py-3 rounded-lg transition-all duration-300 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-md data-[state=active]:shadow-primary/20 hover:bg-muted/50 text-sm font-medium"
              >
                <span>Orders</span>
              </TabsTrigger>
              <TabsTrigger 
                value="customers" 
                className="flex items-center space-x-2 px-4 py-3 rounded-lg transition-all duration-300 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-md data-[state=active]:shadow-primary/20 hover:bg-muted/50 text-sm font-medium"
              >
                <span>Customers</span>
              </TabsTrigger>
              <TabsTrigger 
                value="reports" 
                className="flex items-center space-x-2 px-4 py-3 rounded-lg transition-all duration-300 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-md data-[state=active]:shadow-primary/20 hover:bg-muted/50 text-sm font-medium"
              >
                <span>Reports</span>
              </TabsTrigger>
              <TabsTrigger 
                value="ingredients" 
                className="flex items-center space-x-2 px-4 py-3 rounded-lg transition-all duration-300 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-md data-[state=active]:shadow-primary/20 hover:bg-muted/50 text-sm font-medium"
              >
                <span>Ingredients</span>
              </TabsTrigger>
              <TabsTrigger 
                value="meals" 
                className="flex items-center space-x-2 px-4 py-3 rounded-lg transition-all duration-300 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-md data-[state=active]:shadow-primary/20 hover:bg-muted/50 text-sm font-medium"
              >
                <span>Meals</span>
              </TabsTrigger>
              <TabsTrigger 
                value="categories" 
                className="flex items-center space-x-2 px-4 py-3 rounded-lg transition-all duration-300 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-md data-[state=active]:shadow-primary/20 hover:bg-muted/50 text-sm font-medium"
              >
                <span>Categories</span>
              </TabsTrigger>
              <TabsTrigger 
                value="packages" 
                className="flex items-center space-x-2 px-4 py-3 rounded-lg transition-all duration-300 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-md data-[state=active]:shadow-primary/20 hover:bg-muted/50 text-sm font-medium"
              >
                <span>Packages</span>
              </TabsTrigger>
              <TabsTrigger 
                value="import" 
                className="flex items-center space-x-2 px-4 py-3 rounded-lg transition-all duration-300 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-md data-[state=active]:shadow-primary/20 hover:bg-muted/50 text-sm font-medium"
              >
                <span>Import</span>
              </TabsTrigger>
              <TabsTrigger 
                value="marketing" 
                className="flex items-center space-x-2 px-4 py-3 rounded-lg transition-all duration-300 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-md data-[state=active]:shadow-primary/20 hover:bg-muted/50 text-sm font-medium"
              >
                <span>Marketing</span>
              </TabsTrigger>
              <TabsTrigger 
                value="labels" 
                className="flex items-center space-x-2 px-4 py-3 rounded-lg transition-all duration-300 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-md data-[state=active]:shadow-primary/20 hover:bg-muted/50 text-sm font-medium"
              >
                <span>Labels</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="dashboard">
            <BusinessDashboard />
          </TabsContent>

          <TabsContent value="orders">
            <AllOrders />
          </TabsContent>

          <TabsContent value="customers">
            <CustomersManager />
          </TabsContent>

          <TabsContent value="reports">
            <Reports />
          </TabsContent>

          <TabsContent value="ingredients">
            <IngredientsManager />
          </TabsContent>

          <TabsContent value="meals">
            <MealsManager />
          </TabsContent>

          <TabsContent value="categories">
            <CategoriesManager />
          </TabsContent>

          <TabsContent value="packages">
            <PackagesManager />
          </TabsContent>

          <TabsContent value="import">
            <DataImporter />
          </TabsContent>

          <TabsContent value="marketing">
            <Marketing />
          </TabsContent>

          <TabsContent value="labels">
            <LabelGeneratorComponent />
          </TabsContent>
        </Tabs>
        
        <CustomerDetailModal />
      </div>
    </CustomerDetailProvider>
  );
};

export default AdminDashboard;