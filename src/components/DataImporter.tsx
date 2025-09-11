import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, CheckCircle, AlertCircle, Loader2, Package, Utensils } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { importGoPrepMenu, importGoPrepIngredients, importGoPrepMealIngredients } from '@/utils/importGoPrep';

const DataImporter = () => {
  const [importing, setImporting] = useState({ meals: false, ingredients: false, mealIngredients: false });
  const [results, setResults] = useState<{
    meals?: { success: boolean; imported?: number; error?: string };
    ingredients?: { success: boolean; imported?: number; error?: string };
    mealIngredients?: { success: boolean; imported?: number; error?: string };
  }>({});
  const { toast } = useToast();

  const handleMealsImport = async () => {
    setImporting(prev => ({ ...prev, meals: true }));
    
    try {
      const result = await importGoPrepMenu();
      setResults(prev => ({ ...prev, meals: result }));
      
      if (result.success) {
        toast({
          title: "Meals Import Successful!",
          description: `Successfully imported ${result.imported} meals from GoPrep data.`,
        });
      } else {
        toast({
          title: "Meals Import Failed",
          description: result.error || "Unknown error occurred",
          variant: "destructive",
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setResults(prev => ({ ...prev, meals: { success: false, error: errorMessage } }));
      toast({
        title: "Meals Import Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setImporting(prev => ({ ...prev, meals: false }));
    }
  };

  const handleIngredientsImport = async () => {
    setImporting(prev => ({ ...prev, ingredients: true }));
    
    try {
      const result = await importGoPrepIngredients();
      setResults(prev => ({ ...prev, ingredients: result }));
      
      if (result.success) {
        toast({
          title: "Ingredients Import Successful!",
          description: `Successfully imported ${result.imported} ingredients.`,
        });
      } else {
        toast({
          title: "Ingredients Import Failed",
          description: result.error || "Unknown error occurred",
          variant: "destructive",
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setResults(prev => ({ ...prev, ingredients: { success: false, error: errorMessage } }));
      toast({
        title: "Ingredients Import Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setImporting(prev => ({ ...prev, ingredients: false }));
    }
  };

  const handleMealIngredientsImport = async () => {
    setImporting(prev => ({ ...prev, mealIngredients: true }));
    
    try {
      const result = await importGoPrepMealIngredients();
      setResults(prev => ({ ...prev, mealIngredients: result }));
      
      if (result.success) {
        toast({
          title: "Meal Ingredients Import Successful!",
          description: `Successfully imported ${result.imported} meal ingredient mappings.`,
        });
      } else {
        toast({
          title: "Meal Ingredients Import Failed",
          description: result.error || "Unknown error occurred",
          variant: "destructive",
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setResults(prev => ({ ...prev, mealIngredients: { success: false, error: errorMessage } }));
      toast({
        title: "Meal Ingredients Import Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setImporting(prev => ({ ...prev, mealIngredients: false }));
    }
  };

  const ResultDisplay = ({ result, type }: { result?: { success: boolean; imported?: number; error?: string }, type: string }) => {
    if (!result) return null;
    
    return (
      <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
        result.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
      }`}>
        {result.success ? (
          <>
            <CheckCircle className="h-4 w-4" />
            <span>Successfully imported {result.imported} {type}!</span>
          </>
        ) : (
          <>
            <AlertCircle className="h-4 w-4" />
            <span>Error: {result.error}</span>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {/* Meals Import */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Upload className="h-5 w-5" />
            Import Meals
          </CardTitle>
          <CardDescription>
            Import 280+ meals from GoPrep
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={handleMealsImport} 
            disabled={importing.meals}
            className="w-full"
          >
            {importing.meals ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Import Meals
              </>
            )}
          </Button>
          
          <ResultDisplay result={results.meals} type="meals" />
        </CardContent>
      </Card>

      {/* Ingredients Import */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Package className="h-5 w-5" />
            Import Ingredients
          </CardTitle>
          <CardDescription>
            Import ingredient database with nutrition
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={handleIngredientsImport} 
            disabled={importing.ingredients}
            className="w-full"
          >
            {importing.ingredients ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Package className="h-4 w-4 mr-2" />
                Import Ingredients
              </>
            )}
          </Button>
          
          <ResultDisplay result={results.ingredients} type="ingredients" />
        </CardContent>
      </Card>

      {/* Meal Ingredients Import */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Utensils className="h-5 w-5" />
            Import Meal Recipes
          </CardTitle>
          <CardDescription>
            Link ingredients to meals for nutrition calculation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={handleMealIngredientsImport} 
            disabled={importing.mealIngredients}
            className="w-full"
          >
            {importing.mealIngredients ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Utensils className="h-4 w-4 mr-2" />
                Import Recipes
              </>
            )}
          </Button>
          
          <ResultDisplay result={results.mealIngredients} type="meal ingredient mappings" />
        </CardContent>
      </Card>
      
      <div className="md:col-span-3 text-sm text-muted-foreground bg-muted/50 p-4 rounded-lg">
        <p><strong>Import Order:</strong></p>
        <ol className="list-decimal list-inside mt-2 space-y-1">
          <li>First import meals (280+ from GoPrep data)</li>
          <li>Then import ingredients (nutrition database)</li>
          <li>Finally import meal recipes (links ingredients to meals for accurate nutrition)</li>
        </ol>
        <p className="mt-2"><strong>Note:</strong> Each import replaces existing data in that category.</p>
      </div>
    </div>
  );
};

export default DataImporter;