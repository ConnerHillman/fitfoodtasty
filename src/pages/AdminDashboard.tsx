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
      <div className="container mx-auto p-6 space-y-8 pt-6">

        <Tabs value={tab} onValueChange={(v) => { setTab(v); setSearchParams({ tab: v }); }} className="space-y-8">
          <div className="bg-background border-b border-border p-4">
            <div className="relative">
              <TabsList className="w-full bg-muted/50 h-auto p-1 flex flex-wrap gap-2 justify-center">
                <TabsTrigger 
                  value="dashboard" 
                  className="group flex flex-col items-center space-y-1 px-4 py-3 rounded-lg transition-all duration-300 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground hover:bg-muted text-sm font-medium min-h-[60px] flex-1 min-w-[100px] max-w-[140px]"
                >
                  <BarChart3 className="w-4 h-4" />
                  <span className="text-xs font-semibold">Dashboard</span>
                </TabsTrigger>
                
                <TabsTrigger 
                  value="kitchen" 
                  className="group flex flex-col items-center space-y-1 px-4 py-3 rounded-lg transition-all duration-300 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground hover:bg-muted text-sm font-medium min-h-[60px] flex-1 min-w-[100px] max-w-[140px]"
                >
                  <Utensils className="w-4 h-4" />
                  <span className="text-xs font-semibold">Kitchen</span>
                </TabsTrigger>
                
                <TabsTrigger 
                  value="orders" 
                  className="group flex flex-col items-center space-y-1 px-4 py-3 rounded-lg transition-all duration-300 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground hover:bg-muted text-sm font-medium min-h-[60px] flex-1 min-w-[100px] max-w-[140px]"
                >
                  <ListOrdered className="w-4 h-4" />
                  <span className="text-xs font-semibold">Orders</span>
                </TabsTrigger>
                
                <TabsTrigger 
                  value="subscriptions" 
                  className="group flex flex-col items-center space-y-1 px-4 py-3 rounded-lg transition-all duration-300 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground hover:bg-muted text-sm font-medium min-h-[60px] flex-1 min-w-[100px] max-w-[140px]"
                >
                  <Calendar className="w-4 h-4" />
                  <span className="text-xs font-semibold">Subscriptions</span>
                </TabsTrigger>
                
                <TabsTrigger 
                  value="customers" 
                  className="group flex flex-col items-center space-y-1 px-4 py-3 rounded-lg transition-all duration-300 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground hover:bg-muted text-sm font-medium min-h-[60px] flex-1 min-w-[100px] max-w-[140px]"
                >
                  <Users className="w-4 h-4" />
                  <span className="text-xs font-semibold">Customers</span>
                </TabsTrigger>
                
                <TabsTrigger 
                  value="reports" 
                  className="group flex flex-col items-center space-y-1 px-4 py-3 rounded-lg transition-all duration-300 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground hover:bg-muted text-sm font-medium min-h-[60px] flex-1 min-w-[100px] max-w-[140px]"
                >
                  <FileText className="w-4 h-4" />
                  <span className="text-xs font-semibold">Reports</span>
                </TabsTrigger>
                
                <TabsTrigger 
                  value="marketing" 
                  className="group flex flex-col items-center space-y-1 px-4 py-3 rounded-lg transition-all duration-300 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground hover:bg-muted text-sm font-medium min-h-[60px] flex-1 min-w-[100px] max-w-[140px]"
                >
                  <Target className="w-4 h-4" />
                  <span className="text-xs font-semibold">Marketing</span>
                </TabsTrigger>
                
                <TabsTrigger 
                  value="fulfillment" 
                  className="group flex flex-col items-center space-y-1 px-4 py-3 rounded-lg transition-all duration-300 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground hover:bg-muted text-sm font-medium min-h-[60px] flex-1 min-w-[100px] max-w-[140px]"
                >
                  <Truck className="w-4 h-4" />
                  <span className="text-xs font-semibold">Fulfillment</span>
                </TabsTrigger>
                
                <TabsTrigger 
                  value="ingredients" 
                  className="group flex flex-col items-center space-y-1 px-4 py-3 rounded-lg transition-all duration-300 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground hover:bg-muted text-sm font-medium min-h-[60px] flex-1 min-w-[100px] max-w-[140px]"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span className="text-xs font-semibold">Ingredients</span>
                </TabsTrigger>
                
                <TabsTrigger 
                  value="meals" 
                  className="group flex flex-col items-center space-y-1 px-4 py-3 rounded-lg transition-all duration-300 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground hover:bg-muted text-sm font-medium min-h-[60px] flex-1 min-w-[100px] max-w-[140px]"
                >
                  <ChefHat className="w-4 h-4" />
                  <span className="text-xs font-semibold">Meals</span>
                </TabsTrigger>
                
                <TabsTrigger 
                  value="categories" 
                  className="group flex flex-col items-center space-y-1 px-4 py-3 rounded-lg transition-all duration-300 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground hover:bg-muted text-sm font-medium min-h-[60px] flex-1 min-w-[100px] max-w-[140px]"
                >
                  <Tags className="w-4 h-4" />
                  <span className="text-xs font-semibold">Categories</span>
                </TabsTrigger>
                
                <TabsTrigger 
                  value="packages" 
                  className="group flex flex-col items-center space-y-1 px-4 py-3 rounded-lg transition-all duration-300 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground hover:bg-muted text-sm font-medium min-h-[60px] flex-1 min-w-[100px] max-w-[140px]"
                >
                  <Package className="w-4 h-4" />
                  <span className="text-xs font-semibold">Packages</span>
                </TabsTrigger>
                
                <TabsTrigger 
                  value="labels" 
                  className="group flex flex-col items-center space-y-1 px-4 py-3 rounded-lg transition-all duration-300 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground hover:bg-muted text-sm font-medium min-h-[60px] flex-1 min-w-[100px] max-w-[140px]"
                >
                  <Tag className="w-4 h-4" />
                  <span className="text-xs font-semibold">Labels</span>
                </TabsTrigger>
                
                <TabsTrigger 
                  value="import" 
                  className="group flex flex-col items-center space-y-1 px-4 py-3 rounded-lg transition-all duration-300 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground hover:bg-muted text-sm font-medium min-h-[60px] flex-1 min-w-[100px] max-w-[140px]"
                >
                  <Upload className="w-4 h-4" />
                  <span className="text-xs font-semibold">Import</span>
                </TabsTrigger>
                
                <TabsTrigger 
                  value="users" 
                  className="group flex flex-col items-center space-y-1 px-4 py-3 rounded-lg transition-all duration-300 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground hover:bg-muted text-sm font-medium min-h-[60px] flex-1 min-w-[100px] max-w-[140px]"
                >
                  <UserCog className="w-4 h-4" />
                  <span className="text-xs font-semibold">User Management</span>
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