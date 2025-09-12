import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Printer, Download, Save, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { LabelPreview } from './LabelPreview';
import { supabase } from '@/integrations/supabase/client';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface LabelData {
  id?: string;
  mealName: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  ingredients: string;
  allergens: string;
  useByDate: string;
  storageInstructions: string;
  heatingInstructions: string;
  quantity: number;
}

interface SavedMeal {
  id: string;
  name: string;
  data: Omit<LabelData, 'useByDate' | 'quantity'>;
}

export const LabelGenerator: React.FC = () => {
  const [labelData, setLabelData] = useState<LabelData>({
    mealName: '',
    calories: 0,
    protein: 0,
    fat: 0,
    carbs: 0,
    ingredients: '',
    allergens: '',
    useByDate: '',
    storageInstructions: 'Store in a refrigerator below 5°c. Heat in a microwave for 3-4 minutes or until piping hot.',
    heatingInstructions: 'Pierce film and heat for 3-4 minutes or until piping hot.',
    quantity: 10
  });

  const [savedMeals, setSavedMeals] = useState<SavedMeal[]>([]);
  const [showSavedMeals, setShowSavedMeals] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    loadSavedMeals();
  }, []);

  const loadSavedMeals = async () => {
    try {
      const { data, error } = await supabase
        .from('saved_meal_labels')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setSavedMeals(data);
    } catch (error) {
      console.error('Error loading saved meals:', error);
    }
  };

  const handleInputChange = (field: keyof LabelData, value: string | number) => {
    setLabelData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const generateDateFromDays = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toLocaleDateString('en-GB', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const saveMeal = async () => {
    if (!labelData.mealName) {
      toast.error('Please enter a meal name');
      return;
    }

    try {
      const mealToSave = {
        name: labelData.mealName,
        calories: labelData.calories,
        protein: labelData.protein,
        fat: labelData.fat,
        carbs: labelData.carbs,
        ingredients: labelData.ingredients,
        allergens: labelData.allergens,
        storage_instructions: labelData.storageInstructions,
        heating_instructions: labelData.heatingInstructions
      };

      const { data, error } = await supabase
        .from('saved_meal_labels')
        .insert([mealToSave])
        .select()
        .single();

      if (error) throw error;
      
      toast.success('Meal saved successfully');
      loadSavedMeals();
    } catch (error) {
      console.error('Error saving meal:', error);
      toast.error('Failed to save meal');
    }
  };

  const loadMeal = (meal: SavedMeal) => {
    setLabelData(prev => ({
      ...prev,
      mealName: meal.name,
      calories: meal.data.calories,
      protein: meal.data.protein,
      fat: meal.data.fat,
      carbs: meal.data.carbs,
      ingredients: meal.data.ingredients,
      allergens: meal.data.allergens,
      storageInstructions: meal.data.storageInstructions,
      heatingInstructions: meal.data.heatingInstructions
    }));
    setShowSavedMeals(false);
    toast.success('Meal loaded');
  };

  const deleteSavedMeal = async (id: string) => {
    try {
      const { error } = await supabase
        .from('saved_meal_labels')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Meal deleted');
      loadSavedMeals();
    } catch (error) {
      console.error('Error deleting meal:', error);
      toast.error('Failed to delete meal');
    }
  };

  const generatePDF = async () => {
    if (!printRef.current) return;

    setIsGenerating(true);
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pagesNeeded = Math.ceil(labelData.quantity / 10);
      
      for (let page = 0; page < pagesNeeded; page++) {
        if (page > 0) pdf.addPage();
        
        const canvas = await html2canvas(printRef.current, {
          scale: 2,
          useCORS: true,
          allowTaint: true
        });
        
        const imgData = canvas.toDataURL('image/png');
        pdf.addImage(imgData, 'PNG', 0, 0, 210, 297);
      }
      
      pdf.save(`${labelData.mealName.replace(/[^a-zA-Z0-9]/g, '_')}_labels.pdf`);
      toast.success('PDF generated successfully');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-primary">Label Generator</h1>
        <p className="text-muted-foreground">
          Generate professional A4 label sheets for Fit Food Tasty meals
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Form Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Label Information
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSavedMeals(true)}
                >
                  Load Saved
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={saveMeal}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="mealName">Meal Name</Label>
              <Input
                id="mealName"
                value={labelData.mealName}
                onChange={(e) => handleInputChange('mealName', e.target.value)}
                placeholder="e.g. Bang Bang Chicken"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="calories">Calories</Label>
                <Input
                  id="calories"
                  type="number"
                  value={labelData.calories}
                  onChange={(e) => handleInputChange('calories', parseInt(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label htmlFor="protein">Protein (g)</Label>
                <Input
                  id="protein"
                  type="number"
                  value={labelData.protein}
                  onChange={(e) => handleInputChange('protein', parseInt(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label htmlFor="fat">Fat (g)</Label>
                <Input
                  id="fat"
                  type="number"
                  value={labelData.fat}
                  onChange={(e) => handleInputChange('fat', parseInt(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label htmlFor="carbs">Carbs (g)</Label>
                <Input
                  id="carbs"
                  type="number"
                  value={labelData.carbs}
                  onChange={(e) => handleInputChange('carbs', parseInt(e.target.value) || 0)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="ingredients">Ingredients</Label>
              <Textarea
                id="ingredients"
                value={labelData.ingredients}
                onChange={(e) => handleInputChange('ingredients', e.target.value)}
                placeholder="List all ingredients separated by commas"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="allergens">Allergens</Label>
              <Textarea
                id="allergens"
                value={labelData.allergens}
                onChange={(e) => handleInputChange('allergens', e.target.value)}
                placeholder="e.g. Egg, Mustard, Sulphur dioxide, Gluten, Milk"
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="useByDate">Use By Date</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  id="useByDate"
                  type="date"
                  value={labelData.useByDate}
                  onChange={(e) => handleInputChange('useByDate', e.target.value)}
                />
                <Select onValueChange={(value) => handleInputChange('useByDate', generateDateFromDays(parseInt(value)))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Quick dates" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">+3 days</SelectItem>
                    <SelectItem value="5">+5 days</SelectItem>
                    <SelectItem value="7">+1 week</SelectItem>
                    <SelectItem value="14">+2 weeks</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="quantity">Number of Labels</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                max="1000"
                value={labelData.quantity}
                onChange={(e) => handleInputChange('quantity', parseInt(e.target.value) || 1)}
              />
              <p className="text-sm text-muted-foreground mt-1">
                {Math.ceil(labelData.quantity / 10)} A4 page(s) needed
              </p>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                onClick={generatePDF}
                disabled={isGenerating || !labelData.mealName}
                className="flex-1"
              >
                <Download className="w-4 h-4 mr-2" />
                {isGenerating ? 'Generating...' : 'Download PDF'}
              </Button>
              <Button
                variant="outline"
                onClick={handlePrint}
                disabled={!labelData.mealName}
              >
                <Printer className="w-4 h-4 mr-2" />
                Print
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Preview Section */}
        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg p-4 bg-white">
              <LabelPreview data={labelData} showSingle />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Hidden Print Area */}
      <div className="hidden print:block">
        <div ref={printRef}>
          <LabelPreview data={labelData} />
        </div>
      </div>

      {/* Saved Meals Dialog */}
      <Dialog open={showSavedMeals} onOpenChange={setShowSavedMeals}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Saved Meals</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 max-h-96 overflow-y-auto">
            {savedMeals.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No saved meals found
              </p>
            ) : (
              savedMeals.map((meal) => (
                <div
                  key={meal.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent cursor-pointer"
                  onClick={() => loadMeal(meal)}
                >
                  <div>
                    <h3 className="font-medium">{meal.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {meal.data.calories} cal • {meal.data.protein}g protein • {meal.data.fat}g fat • {meal.data.carbs}g carbs
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteSavedMeal(meal.id);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};