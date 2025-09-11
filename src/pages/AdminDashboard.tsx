import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import IngredientsManager from "@/components/admin/IngredientsManager";
import MealsManager from "@/components/admin/MealsManager";
import CategoriesManager from "@/components/admin/CategoriesManager";
import PackagesManager from "@/components/admin/PackagesManager";
import { ChefHat, Package, ShoppingBag, Upload, Tag } from "lucide-react";
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

      <Tabs defaultValue="ingredients" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="ingredients" className="flex items-center space-x-2">
            <Package className="h-4 w-4" />
            <span>Ingredients</span>
          </TabsTrigger>
          <TabsTrigger value="meals" className="flex items-center space-x-2">
            <ChefHat className="h-4 w-4" />
            <span>Meals</span>
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center space-x-2">
            <Tag className="h-4 w-4" />
            <span>Categories</span>
          </TabsTrigger>
          <TabsTrigger value="packages" className="flex items-center space-x-2">
            <ShoppingBag className="h-4 w-4" />
            <span>Packages</span>
          </TabsTrigger>
          <TabsTrigger value="import" className="flex items-center space-x-2">
            <Upload className="h-4 w-4" />
            <span>Import</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ingredients">
          <Card>
            <CardHeader>
              <CardTitle>Ingredients Database</CardTitle>
              <CardDescription>
                Manage your ingredient database with nutritional information per 100g
              </CardDescription>
            </CardHeader>
            <CardContent>
              <IngredientsManager />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="meals">
          <MealsManager />
        </TabsContent>

        <TabsContent value="categories">
          <Card>
            <CardHeader>
              <CardTitle>Categories Manager</CardTitle>
              <CardDescription>
                Create and manage meal categories to organize your menu
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CategoriesManager />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="packages">
          <Card>
            <CardHeader>
              <CardTitle>Package Manager</CardTitle>
              <CardDescription>
                Create and manage meal packages with pricing and promotional images
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PackagesManager />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="import">
          <Card>
            <CardHeader>
              <CardTitle>Data Importer</CardTitle>
              <CardDescription>
                Import meals, ingredients, and meal recipes (links) from GoPrep data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataImporter />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;