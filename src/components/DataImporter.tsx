import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, CheckCircle, AlertCircle, Loader2, Package, Utensils, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { importGoPrepMenu, importGoPrepIngredients, importGoPrepMealIngredients } from '@/utils/importGoPrep';
import { supabase } from '@/integrations/supabase/client';

// Function to parse pasted recipe data and import meal-ingredient relationships
const importPastedRecipes = async (pasteData: string) => {
  try {
    // Parse the pasted data
    const lines = pasteData.trim().split('\n');
    const mealIngredients: Array<{
      mealName: string;
      ingredientName: string;
      quantity: number;
      unit: string;
    }> = [];

    let currentMeal = '';
    
    for (const line of lines) {
      const parts = line.split('\t').map(p => p.trim()).filter(p => p);
      
      if (parts.length >= 4) {
        // This is a meal with first ingredient
        currentMeal = parts[0];
        const ingredientName = parts[1];
        const quantity = parseFloat(parts[2]);
        const unit = parts[3];
        
        if (!isNaN(quantity)) {
          mealIngredients.push({
            mealName: currentMeal,
            ingredientName,
            quantity,
            unit
          });
        }
      } else if (parts.length >= 3 && currentMeal) {
        // This is an additional ingredient for the current meal
        const ingredientName = parts[0];
        const quantity = parseFloat(parts[1]);
        const unit = parts[2];
        
        if (!isNaN(quantity)) {
          mealIngredients.push({
            mealName: currentMeal,
            ingredientName,
            quantity,
            unit
          });
        }
      }
    }

    if (mealIngredients.length === 0) {
      return { success: false, error: 'No valid meal-ingredient data found in the pasted text' };
    }

    // Get all meals and ingredients from database
    const { data: meals, error: mealsError } = await supabase
      .from('meals')
      .select('id, name');

    const { data: ingredients, error: ingredientsError } = await supabase
      .from('ingredients')
      .select('id, name');

    if (mealsError || ingredientsError) {
      return { success: false, error: 'Failed to fetch meals or ingredients from database' };
    }

    // Create lookup maps
    const mealMap = new Map(meals?.map(m => [m.name, m.id]) || []);
    const ingredientMap = new Map(ingredients?.map(i => [i.name, i.id]) || []);

    // Convert to database format
    const relationshipsToInsert = [];
    const missingMeals = new Set<string>();
    const missingIngredients = new Set<string>();

    for (const item of mealIngredients) {
      const mealId = mealMap.get(item.mealName);
      const ingredientId = ingredientMap.get(item.ingredientName);
      
      if (!mealId) {
        missingMeals.add(item.mealName);
        continue;
      }
      
      if (!ingredientId) {
        missingIngredients.add(item.ingredientName);
        continue;
      }
      
      relationshipsToInsert.push({
        meal_id: mealId,
        ingredient_id: ingredientId,
        quantity: item.quantity,
        unit: item.unit
      });
    }

    // Clear existing meal ingredients first
    const { error: deleteError } = await supabase
      .from('meal_ingredients')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (deleteError) {
      return { success: false, error: 'Failed to clear existing meal ingredients' };
    }

    // Insert new relationships
    if (relationshipsToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from('meal_ingredients')
        .insert(relationshipsToInsert);

      if (insertError) {
        return { success: false, error: `Failed to insert meal ingredients: ${insertError.message}` };
      }
    }

    let warnings = '';
    if (missingMeals.size > 0) {
      warnings += `Missing meals: ${Array.from(missingMeals).slice(0, 3).join(', ')}${missingMeals.size > 3 ? '...' : ''}. `;
    }
    if (missingIngredients.size > 0) {
      warnings += `Missing ingredients: ${Array.from(missingIngredients).slice(0, 3).join(', ')}${missingIngredients.size > 3 ? '...' : ''}.`;
    }

    return {
      success: true,
      imported: relationshipsToInsert.length,
      warning: warnings || undefined
    };
  } catch (error) {
    console.error('Error importing pasted recipes:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

const DataImporter = () => {
  const [importing, setImporting] = useState({ meals: false, ingredients: false, mealIngredients: false, pasteRecipes: false });
  const [pasteData, setPasteData] = useState('');
  const [results, setResults] = useState<{
    meals?: { success: boolean; imported?: number; error?: string };
    ingredients?: { success: boolean; imported?: number; error?: string };
    mealIngredients?: { success: boolean; imported?: number; error?: string };
    pasteRecipes?: { success: boolean; imported?: number; error?: string };
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

  const handlePasteRecipesImport = async () => {
    if (!pasteData.trim()) {
      toast({
        title: "No Data Provided",
        description: "Please paste your recipe data first.",
        variant: "destructive",
      });
      return;
    }

    setImporting(prev => ({ ...prev, pasteRecipes: true }));
    
    try {
      const result = await importPastedRecipes(pasteData);
      setResults(prev => ({ ...prev, pasteRecipes: result }));
      
      if (result.success) {
        toast({
          title: "Recipes Import Successful!",
          description: `Successfully imported ${result.imported} recipe mappings.`,
        });
        setPasteData(''); // Clear the textarea on success
      } else {
        toast({
          title: "Recipes Import Failed",
          description: result.error || "Unknown error occurred",
          variant: "destructive",
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setResults(prev => ({ ...prev, pasteRecipes: { success: false, error: errorMessage } }));
      toast({
        title: "Recipes Import Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setImporting(prev => ({ ...prev, pasteRecipes: false }));
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
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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

      {/* Paste Recipes Import */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5" />
            Paste Recipes
          </CardTitle>
          <CardDescription>
            Paste your spreadsheet data to map all ingredients to meals
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <textarea
            value={pasteData}
            onChange={(e) => setPasteData(e.target.value)}
            placeholder={`Paste your recipe data here. Format:
Bang Bang Chicken	Chicken Breast	150	g
	Spaghetti	80	g
	Mayo (Light)	46	g
Bang Bang Chicken (BIG)	Chicken Breast	200	g
...`}
            className="w-full h-32 p-2 border rounded text-sm font-mono resize-none"
          />
          
          <Button 
            onClick={handlePasteRecipesImport} 
            disabled={importing.pasteRecipes || !pasteData.trim()}
            className="w-full"
          >
            {importing.pasteRecipes ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <FileText className="h-4 w-4 mr-2" />
                Import Pasted Recipes
              </>
            )}
          </Button>
          
          <ResultDisplay result={results.pasteRecipes} type="recipe mappings" />
        </CardContent>
      </Card>
      
      <div className="lg:col-span-4 text-sm text-muted-foreground bg-muted/50 p-4 rounded-lg">
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