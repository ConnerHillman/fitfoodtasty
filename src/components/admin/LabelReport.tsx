import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  CalendarIcon, 
  Printer, 
  Download, 
  Tags, 
  Package, 
  Calculator,
  FileText,
  Clock
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { LabelPreview } from '@/components/LabelPreview';
import { format as formatDate, startOfDay, endOfDay } from 'date-fns';
import { cn } from '@/lib/utils';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface MealProduction {
  mealId: string;
  mealName: string;
  quantity: number;
  totalCalories: number;
  totalProtein: number;
  totalFat: number;
  totalCarbs: number;
  ingredients: string;
  allergens: string;
  orderCount: number;
}

interface LabelReportProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LabelReport: React.FC<LabelReportProps> = ({ isOpen, onClose }) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [mealProduction, setMealProduction] = useState<MealProduction[]>([]);
  const [loading, setLoading] = useState(false);
  const [showLabelPreview, setShowLabelPreview] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const { toast } = useToast();
  const printRef = useRef<HTMLDivElement>(null);

  const generateLabelsForDate = async () => {
    if (!selectedDate) {
      toast({
        title: "Date Required",
        description: "Please select a date to generate labels for",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const startDate = startOfDay(selectedDate);
      const endDate = endOfDay(selectedDate);

      // Fetch orders and package orders for the selected date
      const [ordersRes, packageOrdersRes, mealsRes] = await Promise.all([
        supabase.from("orders").select(`
          id,
          status,
          order_items (
            meal_id,
            meal_name,
            quantity
          )
        `).gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString())
          .eq('status', 'confirmed'),
        
        supabase.from("package_orders").select(`
          id,
          status,
          package_meal_selections (
            meal_id,
            quantity
          )
        `).gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString())
          .eq('status', 'confirmed'),
        
        supabase.from("meals").select(`
          id,
          name,
          total_calories,
          total_protein,
          total_fat,
          total_carbs,
          meal_ingredients (
            ingredient_id,
            quantity,
            unit,
            ingredients (
              name
            )
          ),
          meal_allergens (
            allergen_id,
            allergens (
              name
            )
          )
        `).eq("is_active", true)
      ]);

      if (ordersRes.error) throw ordersRes.error;
      if (packageOrdersRes.error) throw packageOrdersRes.error;
      if (mealsRes.error) throw mealsRes.error;

      const orders = ordersRes.data || [];
      const packageOrders = packageOrdersRes.data || [];
      const meals = mealsRes.data || [];

      // Process meal production data
      const mealProductionMap = new Map<string, MealProduction>();

      // Process regular orders
      orders.forEach(order => {
        order.order_items?.forEach(item => {
          const meal = meals.find(m => m.id === item.meal_id);
          if (meal) {
            const key = meal.id;
            const existing = mealProductionMap.get(key);
            
            if (existing) {
              existing.quantity += item.quantity;
              existing.orderCount += 1;
            } else {
              mealProductionMap.set(key, {
                mealId: meal.id,
                mealName: meal.name,
                quantity: item.quantity,
                totalCalories: Math.round(meal.total_calories || 0),
                totalProtein: Math.round(meal.total_protein || 0),
                totalFat: Math.round(meal.total_fat || 0),
                totalCarbs: Math.round(meal.total_carbs || 0),
                ingredients: meal.meal_ingredients?.map(mi => mi.ingredients.name).join(', ') || '',
                allergens: meal.meal_allergens?.map(ma => ma.allergens.name).join(', ') || '',
                orderCount: 1
              });
            }
          }
        });
      });

      // Process package orders
      packageOrders.forEach(order => {
        order.package_meal_selections?.forEach(selection => {
          const meal = meals.find(m => m.id === selection.meal_id);
          if (meal) {
            const key = meal.id;
            const existing = mealProductionMap.get(key);
            
            if (existing) {
              existing.quantity += selection.quantity;
              existing.orderCount += 1;
            } else {
              mealProductionMap.set(key, {
                mealId: meal.id,
                mealName: meal.name,
                quantity: selection.quantity,
                totalCalories: Math.round(meal.total_calories || 0),
                totalProtein: Math.round(meal.total_protein || 0),
                totalFat: Math.round(meal.total_fat || 0),
                totalCarbs: Math.round(meal.total_carbs || 0),
                ingredients: meal.meal_ingredients?.map(mi => mi.ingredients.name).join(', ') || '',
                allergens: meal.meal_allergens?.map(ma => ma.allergens.name).join(', ') || '',
                orderCount: 1
              });
            }
          }
        });
      });

      const productionData = Array.from(mealProductionMap.values())
        .sort((a, b) => b.quantity - a.quantity);

      setMealProduction(productionData);

      if (productionData.length === 0) {
        toast({
          title: "No Orders Found",
          description: `No confirmed orders found for ${formatDate(selectedDate, 'EEEE, MMMM d, yyyy')}`,
        });
      } else {
        toast({
          title: "Labels Generated",
          description: `Found ${productionData.length} meals requiring ${productionData.reduce((sum, meal) => sum + meal.quantity, 0)} total labels`,
        });
      }
    } catch (error) {
      console.error("Error generating label report:", error);
      toast({
        title: "Error",
        description: "Failed to generate label report",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generatePDFForAllMeals = async () => {
    if (mealProduction.length === 0) return;

    setIsGeneratingPDF(true);
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      let isFirstPage = true;

      for (const meal of mealProduction) {
        if (!isFirstPage) pdf.addPage();
        
        // Create label data for this meal
        const labelData = {
          mealName: meal.mealName,
          calories: meal.totalCalories,
          protein: meal.totalProtein,
          fat: meal.totalFat,
          carbs: meal.totalCarbs,
          ingredients: meal.ingredients,
          allergens: meal.allergens,
          useByDate: formatDate(new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'), // 5 days from now
          storageInstructions: 'Store in a refrigerator below 5°c. Heat in a microwave for 3-4 minutes or until piping hot.',
          heatingInstructions: 'Pierce film and heat for 3-4 minutes or until piping hot.',
          quantity: meal.quantity
        };

        // Create a temporary div with the label preview
        const tempDiv = document.createElement('div');
        tempDiv.style.position = 'absolute';
        tempDiv.style.left = '-9999px';
        tempDiv.style.top = '-9999px';
        tempDiv.style.width = '210mm';
        tempDiv.style.height = '297mm';
        document.body.appendChild(tempDiv);

        // Render the LabelPreview component
        const { createRoot } = await import('react-dom/client');
        const root = createRoot(tempDiv);
        root.render(React.createElement(LabelPreview, { data: labelData }));

        // Wait a bit for rendering
        await new Promise(resolve => setTimeout(resolve, 1000));

        const canvas = await html2canvas(tempDiv, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          width: 794, // A4 width in pixels at 96 DPI
          height: 1123 // A4 height in pixels at 96 DPI
        });
        
        const imgData = canvas.toDataURL('image/png');
        pdf.addImage(imgData, 'PNG', 0, 0, 210, 297);

        // Cleanup
        root.unmount();
        document.body.removeChild(tempDiv);
        
        isFirstPage = false;
      }
      
      const fileName = `labels_${formatDate(selectedDate, 'yyyy-MM-dd')}.pdf`;
      pdf.save(fileName);
      
      toast({
        title: "PDF Generated",
        description: `Labels PDF saved as ${fileName}`,
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error",
        description: "Failed to generate PDF",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const totalLabelsNeeded = mealProduction.reduce((sum, meal) => sum + meal.quantity, 0);
  const totalPages = Math.ceil(totalLabelsNeeded / 10);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tags className="h-5 w-5" />
            Label Production Report
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Date Selection */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                Select Production Date
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  className="pointer-events-auto"
                />
                <div className="flex flex-col gap-3">
                  <div className="text-sm text-muted-foreground">
                    Selected: <strong>{formatDate(selectedDate, 'EEEE, MMMM d, yyyy')}</strong>
                  </div>
                  <Button 
                    onClick={generateLabelsForDate}
                    disabled={loading}
                    className="w-full sm:w-auto"
                  >
                    <Calculator className="h-4 w-4 mr-2" />
                    {loading ? 'Calculating...' : 'Generate Label Report'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Production Summary */}
          {mealProduction.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Production Summary
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowLabelPreview(true)}
                    >
                      <FileText className="h-4 w-4 mr-1" />
                      Preview
                    </Button>
                    <Button
                      size="sm"
                      onClick={generatePDFForAllMeals}
                      disabled={isGeneratingPDF}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      {isGeneratingPDF ? 'Generating...' : 'Download PDF'}
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center p-3 bg-muted/50 rounded">
                    <div className="text-2xl font-bold text-primary">{mealProduction.length}</div>
                    <div className="text-xs text-muted-foreground">Unique Meals</div>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded">
                    <div className="text-2xl font-bold text-primary">{totalLabelsNeeded}</div>
                    <div className="text-xs text-muted-foreground">Total Labels</div>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded">
                    <div className="text-2xl font-bold text-primary">{totalPages}</div>
                    <div className="text-xs text-muted-foreground">A4 Pages</div>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded">
                    <div className="text-2xl font-bold text-primary">
                      {mealProduction.reduce((sum, meal) => sum + meal.orderCount, 0)}
                    </div>
                    <div className="text-xs text-muted-foreground">Total Orders</div>
                  </div>
                </div>

                <Separator className="mb-4" />

                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Meal Production List:</h4>
                  {mealProduction.map((meal, index) => (
                    <div
                      key={meal.mealId}
                      className="flex items-center justify-between p-3 bg-background rounded border text-sm"
                    >
                      <div className="flex-1">
                        <div className="font-medium">{meal.mealName}</div>
                        <div className="text-xs text-muted-foreground">
                          {meal.totalCalories} cal • {meal.totalProtein}g protein • 
                          {meal.orderCount} order{meal.orderCount !== 1 ? 's' : ''}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {meal.quantity} labels
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {Math.ceil(meal.quantity / 10)} page{Math.ceil(meal.quantity / 10) !== 1 ? 's' : ''}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Instructions */}
          <Card className="bg-muted/30">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium mb-1">Instructions:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Select the production date you want to generate labels for</li>
                    <li>Only confirmed orders will be included in the label report</li>
                    <li>Each meal will be printed with the correct quantity needed</li>
                    <li>Labels are formatted for A4 sheets with 10 labels per page (EU30009BM)</li>
                    <li>Use by date is automatically set to 5 days from generation</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Label Preview Dialog */}
        {showLabelPreview && mealProduction.length > 0 && (
          <Dialog open={showLabelPreview} onOpenChange={setShowLabelPreview}>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Label Preview</DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                {mealProduction.map((meal) => (
                  <div key={meal.mealId} className="border rounded-lg p-4">
                    <h4 className="font-medium mb-2">{meal.mealName} - {meal.quantity} labels</h4>
                    <div className="border rounded p-2 bg-white" style={{ transform: 'scale(0.5)', transformOrigin: 'top left' }}>
                      <LabelPreview
                        data={{
                          mealName: meal.mealName,
                          calories: meal.totalCalories,
                          protein: meal.totalProtein,
                          fat: meal.totalFat,
                          carbs: meal.totalCarbs,
                          ingredients: meal.ingredients,
                          allergens: meal.allergens,
                          useByDate: formatDate(new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
                          storageInstructions: 'Store in a refrigerator below 5°c. Heat in a microwave for 3-4 minutes or until piping hot.',
                          heatingInstructions: 'Pierce film and heat for 3-4 minutes or until piping hot.',
                          quantity: 1
                        }}
                        showSingle={true}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  );
};