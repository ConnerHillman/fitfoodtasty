import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import IngredientsManager from "@/components/admin/IngredientsManager";
import MealsManager from "@/components/admin/MealsManager";
import CategoriesManager from "@/components/admin/CategoriesManager";
import PackagesManager from "@/components/admin/PackagesManager";
import ReferralSettingsAdmin from "@/components/admin/ReferralSettingsAdmin";
import BusinessDashboard from "@/components/admin/BusinessDashboard";
import Reports from "@/components/admin/Reports";
import { ChefHat, Package, ShoppingBag, Upload, Tag, Gift, BarChart3, FileText, TrendingUp } from "lucide-react";
import DataImporter from "@/components/DataImporter";
const AdminDashboard = () => {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center space-x-4">
        <ChefHat className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage your meal prep business</p>
        </div>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-8">
        <div className="relative bg-gradient-to-r from-background via-background/95 to-background backdrop-blur-sm border border-border/50 rounded-xl p-2 shadow-lg">
          <TabsList className="grid w-full grid-cols-8 bg-transparent gap-1 p-0 h-auto">
            <TabsTrigger 
              value="dashboard" 
              className="flex items-center space-x-2 px-4 py-3 rounded-lg transition-all duration-300 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-md data-[state=active]:shadow-primary/20 hover:bg-muted/50 text-sm font-medium"
            >
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger 
              value="reports" 
              className="flex items-center space-x-2 px-4 py-3 rounded-lg transition-all duration-300 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-md data-[state=active]:shadow-primary/20 hover:bg-muted/50 text-sm font-medium"
            >
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Reports</span>
            </TabsTrigger>
            <TabsTrigger 
              value="ingredients" 
              className="flex items-center space-x-2 px-4 py-3 rounded-lg transition-all duration-300 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-md data-[state=active]:shadow-primary/20 hover:bg-muted/50 text-sm font-medium"
            >
              <Package className="h-4 w-4" />
              <span className="hidden sm:inline">Ingredients</span>
            </TabsTrigger>
            <TabsTrigger 
              value="meals" 
              className="flex items-center space-x-2 px-4 py-3 rounded-lg transition-all duration-300 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-md data-[state=active]:shadow-primary/20 hover:bg-muted/50 text-sm font-medium"
            >
              <ChefHat className="h-4 w-4" />
              <span className="hidden sm:inline">Meals</span>
            </TabsTrigger>
            <TabsTrigger 
              value="categories" 
              className="flex items-center space-x-2 px-4 py-3 rounded-lg transition-all duration-300 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-md data-[state=active]:shadow-primary/20 hover:bg-muted/50 text-sm font-medium"
            >
              <Tag className="h-4 w-4" />
              <span className="hidden sm:inline">Categories</span>
            </TabsTrigger>
            <TabsTrigger 
              value="packages" 
              className="flex items-center space-x-2 px-4 py-3 rounded-lg transition-all duration-300 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-md data-[state=active]:shadow-primary/20 hover:bg-muted/50 text-sm font-medium"
            >
              <ShoppingBag className="h-4 w-4" />
              <span className="hidden sm:inline">Packages</span>
            </TabsTrigger>
            <TabsTrigger 
              value="import" 
              className="flex items-center space-x-2 px-4 py-3 rounded-lg transition-all duration-300 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-md data-[state=active]:shadow-primary/20 hover:bg-muted/50 text-sm font-medium"
            >
              <Upload className="h-4 w-4" />
              <span className="hidden sm:inline">Import</span>
            </TabsTrigger>
            <TabsTrigger 
              value="referrals" 
              className="flex items-center space-x-2 px-4 py-3 rounded-lg transition-all duration-300 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-md data-[state=active]:shadow-primary/20 hover:bg-muted/50 text-sm font-medium"
            >
              <Gift className="h-4 w-4" />
              <span className="hidden sm:inline">Referrals</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="dashboard">
          <BusinessDashboard />
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

        <TabsContent value="referrals">
          <ReferralSettingsAdmin />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;