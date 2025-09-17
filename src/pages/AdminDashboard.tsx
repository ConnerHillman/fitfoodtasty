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
import FulfillmentManager from "@/components/admin/FulfillmentManager";
import UserManager from "@/components/admin/UserManager";
import { ChefHat, Package, ShoppingBag, Upload, Tag, Gift, BarChart3, FileText, TrendingUp, ListOrdered, Users, Tags, Truck, Home, Target, UserCog, Utensils, Calendar } from "lucide-react";
import DataImporter from "@/components/DataImporter";
import { LabelGenerator as LabelGeneratorComponent } from "@/components/LabelGenerator";
import { KitchenDashboard } from "@/components/admin/KitchenDashboard";
import { useSearchParams } from "react-router-dom";
import { CustomerDetailProvider } from "@/contexts/ModalContext";
import SubscriptionsManager from "@/components/admin/SubscriptionsManager";

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
      <div className="container mx-auto p-6 space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <ChefHat className="h-10 w-10 text-primary" />
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-primary to-primary/80 rounded-full animate-pulse"></div>
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                Admin Dashboard
              </h1>
              <p className="text-muted-foreground text-lg">Manage your premium meal prep business</p>
            </div>
          </div>
          <div className="hidden md:flex items-center space-x-4 px-6 py-3 bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/10 rounded-xl backdrop-blur-sm">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">Online</span>
            </div>
            <div className="w-px h-6 bg-border"></div>
            <span className="text-sm text-muted-foreground">Premium Access</span>
          </div>
        </div>

        <Tabs value={tab} onValueChange={(v) => { setTab(v); setSearchParams({ tab: v }); }} className="space-y-8">
          <div className="relative bg-gradient-to-br from-background via-background/98 to-background/95 backdrop-blur-xl border border-primary/10 rounded-2xl p-6 shadow-2xl shadow-primary/5">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5 rounded-2xl"></div>
            <div className="relative">
              <TabsList className="w-full bg-transparent h-auto p-0 flex flex-wrap gap-3 justify-center">
                <TabsTrigger 
                  value="dashboard" 
                  className="group flex flex-col items-center space-y-2 px-6 py-4 rounded-xl transition-all duration-300 data-[state=active]:bg-gradient-to-b data-[state=active]:from-primary/10 data-[state=active]:to-primary/5 data-[state=active]:text-primary data-[state=active]:shadow-lg data-[state=active]:shadow-primary/20 data-[state=active]:border data-[state=active]:border-primary/20 hover:bg-muted/30 hover:scale-105 text-sm font-medium min-h-[80px] bg-transparent border-0 flex-1 min-w-[120px] max-w-[180px]"
                >
                  <BarChart3 className="w-5 h-5 group-data-[state=active]:text-primary transition-colors" />
                  <span className="text-sm font-bold">Dashboard</span>
                </TabsTrigger>
                
                <TabsTrigger 
                  value="kitchen" 
                  className="group flex flex-col items-center space-y-2 px-6 py-4 rounded-xl transition-all duration-300 data-[state=active]:bg-gradient-to-b data-[state=active]:from-primary/10 data-[state=active]:to-primary/5 data-[state=active]:text-primary data-[state=active]:shadow-lg data-[state=active]:shadow-primary/20 data-[state=active]:border data-[state=active]:border-primary/20 hover:bg-muted/30 hover:scale-105 text-sm font-medium min-h-[80px] bg-transparent border-0 flex-1 min-w-[120px] max-w-[180px]"
                >
                  <Utensils className="w-5 h-5 group-data-[state=active]:text-primary transition-colors" />
                  <span className="text-sm font-bold">Kitchen</span>
                </TabsTrigger>
                
                <TabsTrigger 
                  value="orders" 
                  className="group flex flex-col items-center space-y-2 px-6 py-4 rounded-xl transition-all duration-300 data-[state=active]:bg-gradient-to-b data-[state=active]:from-primary/10 data-[state=active]:to-primary/5 data-[state=active]:text-primary data-[state=active]:shadow-lg data-[state=active]:shadow-primary/20 data-[state=active]:border data-[state=active]:border-primary/20 hover:bg-muted/30 hover:scale-105 text-sm font-medium min-h-[80px] bg-transparent border-0 flex-1 min-w-[120px] max-w-[180px]"
                >
                  <ListOrdered className="w-5 h-5 group-data-[state=active]:text-primary transition-colors" />
                  <span className="text-sm font-bold">Orders</span>
                </TabsTrigger>
                
                <TabsTrigger 
                  value="subscriptions" 
                  className="group flex flex-col items-center space-y-2 px-6 py-4 rounded-xl transition-all duration-300 data-[state=active]:bg-gradient-to-b data-[state=active]:from-primary/10 data-[state=active]:to-primary/5 data-[state=active]:text-primary data-[state=active]:shadow-lg data-[state=active]:shadow-primary/20 data-[state=active]:border data-[state=active]:border-primary/20 hover:bg-muted/30 hover:scale-105 text-sm font-medium min-h-[80px] bg-transparent border-0 flex-1 min-w-[120px] max-w-[180px]"
                >
                  <Calendar className="w-5 h-5 group-data-[state=active]:text-primary transition-colors" />
                  <span className="text-sm font-bold">Subscriptions</span>
                </TabsTrigger>
                
                <TabsTrigger 
                  value="customers" 
                  className="group flex flex-col items-center space-y-2 px-6 py-4 rounded-xl transition-all duration-300 data-[state=active]:bg-gradient-to-b data-[state=active]:from-primary/10 data-[state=active]:to-primary/5 data-[state=active]:text-primary data-[state=active]:shadow-lg data-[state=active]:shadow-primary/20 data-[state=active]:border data-[state=active]:border-primary/20 hover:bg-muted/30 hover:scale-105 text-sm font-medium min-h-[80px] bg-transparent border-0 flex-1 min-w-[120px] max-w-[180px]"
                >
                  <Users className="w-5 h-5 group-data-[state=active]:text-primary transition-colors" />
                  <span className="text-sm font-bold">Customers</span>
                </TabsTrigger>
                
                <TabsTrigger 
                  value="reports" 
                  className="group flex flex-col items-center space-y-2 px-6 py-4 rounded-xl transition-all duration-300 data-[state=active]:bg-gradient-to-b data-[state=active]:from-primary/10 data-[state=active]:to-primary/5 data-[state=active]:text-primary data-[state=active]:shadow-lg data-[state=active]:shadow-primary/20 data-[state=active]:border data-[state=active]:border-primary/20 hover:bg-muted/30 hover:scale-105 text-sm font-medium min-h-[80px] bg-transparent border-0 flex-1 min-w-[120px] max-w-[180px]"
                >
                  <FileText className="w-5 h-5 group-data-[state=active]:text-primary transition-colors" />
                  <span className="text-sm font-bold">Reports</span>
                </TabsTrigger>
                
                <TabsTrigger 
                  value="marketing" 
                  className="group flex flex-col items-center space-y-2 px-6 py-4 rounded-xl transition-all duration-300 data-[state=active]:bg-gradient-to-b data-[state=active]:from-primary/10 data-[state=active]:to-primary/5 data-[state=active]:text-primary data-[state=active]:shadow-lg data-[state=active]:shadow-primary/20 data-[state=active]:border data-[state=active]:border-primary/20 hover:bg-muted/30 hover:scale-105 text-sm font-medium min-h-[80px] bg-transparent border-0 flex-1 min-w-[120px] max-w-[180px]"
                >
                  <Target className="w-5 h-5 group-data-[state=active]:text-primary transition-colors" />
                  <span className="text-sm font-bold">Marketing</span>
                </TabsTrigger>
                
                <TabsTrigger 
                  value="fulfillment" 
                  className="group flex flex-col items-center space-y-2 px-6 py-4 rounded-xl transition-all duration-300 data-[state=active]:bg-gradient-to-b data-[state=active]:from-primary/10 data-[state=active]:to-primary/5 data-[state=active]:text-primary data-[state=active]:shadow-lg data-[state=active]:shadow-primary/20 data-[state=active]:border data-[state=active]:border-primary/20 hover:bg-muted/30 hover:scale-105 text-sm font-medium min-h-[80px] bg-transparent border-0 flex-1 min-w-[120px] max-w-[180px]"
                >
                  <Truck className="w-5 h-5 group-data-[state=active]:text-primary transition-colors" />
                  <span className="text-sm font-bold">Fulfillment</span>
                </TabsTrigger>
                
                <TabsTrigger 
                  value="ingredients" 
                  className="group flex flex-col items-center space-y-2 px-6 py-4 rounded-xl transition-all duration-300 data-[state=active]:bg-gradient-to-b data-[state=active]:from-primary/10 data-[state=active]:to-primary/5 data-[state=active]:text-primary data-[state=active]:shadow-lg data-[state=active]:shadow-primary/20 data-[state=active]:border data-[state=active]:border-primary/20 hover:bg-muted/30 hover:scale-105 text-sm font-medium min-h-[80px] bg-transparent border-0 flex-1 min-w-[120px] max-w-[180px]"
                >
                  <ShoppingBag className="w-5 h-5 group-data-[state=active]:text-primary transition-colors" />
                  <span className="text-sm font-bold">Ingredients</span>
                </TabsTrigger>
                
                <TabsTrigger 
                  value="meals" 
                  className="group flex flex-col items-center space-y-2 px-6 py-4 rounded-xl transition-all duration-300 data-[state=active]:bg-gradient-to-b data-[state=active]:from-primary/10 data-[state=active]:to-primary/5 data-[state=active]:text-primary data-[state=active]:shadow-lg data-[state=active]:shadow-primary/20 data-[state=active]:border data-[state=active]:border-primary/20 hover:bg-muted/30 hover:scale-105 text-sm font-medium min-h-[80px] bg-transparent border-0 flex-1 min-w-[120px] max-w-[180px]"
                >
                  <ChefHat className="w-5 h-5 group-data-[state=active]:text-primary transition-colors" />
                  <span className="text-sm font-bold">Meals</span>
                </TabsTrigger>
                
                <TabsTrigger 
                  value="categories" 
                  className="group flex flex-col items-center space-y-2 px-6 py-4 rounded-xl transition-all duration-300 data-[state=active]:bg-gradient-to-b data-[state=active]:from-primary/10 data-[state=active]:to-primary/5 data-[state=active]:text-primary data-[state=active]:shadow-lg data-[state=active]:shadow-primary/20 data-[state=active]:border data-[state=active]:border-primary/20 hover:bg-muted/30 hover:scale-105 text-sm font-medium min-h-[80px] bg-transparent border-0 flex-1 min-w-[120px] max-w-[180px]"
                >
                  <Tags className="w-5 h-5 group-data-[state=active]:text-primary transition-colors" />
                  <span className="text-sm font-bold">Categories</span>
                </TabsTrigger>
                
                <TabsTrigger 
                  value="packages" 
                  className="group flex flex-col items-center space-y-2 px-6 py-4 rounded-xl transition-all duration-300 data-[state=active]:bg-gradient-to-b data-[state=active]:from-primary/10 data-[state=active]:to-primary/5 data-[state=active]:text-primary data-[state=active]:shadow-lg data-[state=active]:shadow-primary/20 data-[state=active]:border data-[state=active]:border-primary/20 hover:bg-muted/30 hover:scale-105 text-sm font-medium min-h-[80px] bg-transparent border-0 flex-1 min-w-[120px] max-w-[180px]"
                >
                  <Package className="w-5 h-5 group-data-[state=active]:text-primary transition-colors" />
                  <span className="text-sm font-bold">Packages</span>
                </TabsTrigger>
                
                <TabsTrigger 
                  value="labels" 
                  className="group flex flex-col items-center space-y-2 px-6 py-4 rounded-xl transition-all duration-300 data-[state=active]:bg-gradient-to-b data-[state=active]:from-primary/10 data-[state=active]:to-primary/5 data-[state=active]:text-primary data-[state=active]:shadow-lg data-[state=active]:shadow-primary/20 data-[state=active]:border data-[state=active]:border-primary/20 hover:bg-muted/30 hover:scale-105 text-sm font-medium min-h-[80px] bg-transparent border-0 flex-1 min-w-[120px] max-w-[180px]"
                >
                  <Tag className="w-5 h-5 group-data-[state=active]:text-primary transition-colors" />
                  <span className="text-sm font-bold">Labels</span>
                </TabsTrigger>
                
                <TabsTrigger 
                  value="import" 
                  className="group flex flex-col items-center space-y-2 px-6 py-4 rounded-xl transition-all duration-300 data-[state=active]:bg-gradient-to-b data-[state=active]:from-primary/10 data-[state=active]:to-primary/5 data-[state=active]:text-primary data-[state=active]:shadow-lg data-[state=active]:shadow-primary/20 data-[state=active]:border data-[state=active]:border-primary/20 hover:bg-muted/30 hover:scale-105 text-sm font-medium min-h-[80px] bg-transparent border-0 flex-1 min-w-[120px] max-w-[180px]"
                >
                  <Upload className="w-5 h-5 group-data-[state=active]:text-primary transition-colors" />
                  <span className="text-sm font-bold">Import</span>
                </TabsTrigger>
                
                <TabsTrigger 
                  value="users" 
                  className="group flex flex-col items-center space-y-2 px-6 py-4 rounded-xl transition-all duration-300 data-[state=active]:bg-gradient-to-b data-[state=active]:from-primary/10 data-[state=active]:to-primary/5 data-[state=active]:text-primary data-[state=active]:shadow-lg data-[state=active]:shadow-primary/20 data-[state=active]:border data-[state=active]:border-primary/20 hover:bg-muted/30 hover:scale-105 text-sm font-medium min-h-[80px] bg-transparent border-0 flex-1 min-w-[120px] max-w-[180px]"
                >
                  <UserCog className="w-5 h-5 group-data-[state=active]:text-primary transition-colors" />
                  <span className="text-sm font-bold">User Management</span>
                </TabsTrigger>
              </TabsList>
            </div>
          </div>

          <TabsContent value="dashboard">
            <BusinessDashboard />
          </TabsContent>

          <TabsContent value="kitchen">
            <KitchenDashboard />
          </TabsContent>

          <TabsContent value="orders">
            <AllOrders />
          </TabsContent>

          <TabsContent value="subscriptions">
            <SubscriptionsManager />
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

          <TabsContent value="fulfillment">
            <FulfillmentManager />
          </TabsContent>

          <TabsContent value="users">
            <UserManager />
          </TabsContent>
        </Tabs>
        
        <CustomerDetailModal />
      </div>
    </CustomerDetailProvider>
  );
};

export default AdminDashboard;