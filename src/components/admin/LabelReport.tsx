import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { 
  CalendarIcon, 
  Printer, 
  Download, 
  Tags, 
  Package, 
  Calculator,
  FileText,
  Clock,
  Loader2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { LabelSheet } from '@/components/labels/LabelSheet';
import { LabelPrintPreview } from '@/components/admin/LabelPrintPreview';
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
  const [uniqueOrderIds, setUniqueOrderIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [showLabelPreview, setShowLabelPreview] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStatus, setGenerationStatus] = useState('');
  const { toast } = useToast();
  const printRef = useRef<HTMLDivElement>(null);
  const pdfRef = useRef<HTMLDivElement>(null);

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
      const allOrderIds = new Set<string>();

      // Process regular orders
      orders.forEach(order => {
        allOrderIds.add(order.id); // Track unique order IDs
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
        allOrderIds.add(order.id); // Track unique order IDs
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
      setUniqueOrderIds(allOrderIds);

      if (productionData.length === 0) {
        toast({
          title: "No Orders Found",
          description: `No confirmed orders found for ${formatDate(selectedDate, 'EEEE, MMMM d, yyyy')}`,
        });
      } else {
        toast({
          title: "Labels Generated",
          description: `Found ${productionData.length} meals requiring ${productionData.reduce((sum, meal) => sum + meal.quantity, 0)} total labels from ${allOrderIds.size} orders`,
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
    setGenerationProgress(0);
    setGenerationStatus('Preparing label data...');
    
    try {
      console.log('Starting PDF generation for meals:', mealProduction.length);
      
      // Step 1: Preparing label data (0-20%)
      setGenerationProgress(20);
      setGenerationStatus('Rendering labels preview...');
      
      // Ensure the offscreen renderer is in the DOM and visible for rendering
      const container = pdfRef.current;
      if (!container) {
        console.error('PDF renderer not available');
        throw new Error('PDF renderer not available');
      }

      console.log('Container found, checking content...');
      
      // Make the container positioned for rendering but invisible to users
      container.style.position = 'fixed';
      container.style.left = '0';
      container.style.top = '0';
      container.style.visibility = 'visible'; // Must be visible for html2canvas
      container.style.zIndex = '-9999'; // Behind everything
      container.style.pointerEvents = 'none'; // No interaction
      container.style.opacity = '0'; // Completely transparent to users
      
      // Wait for next render cycle
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Step 2: Rendering complete (20-40%)
      setGenerationProgress(40);
      setGenerationStatus('Loading images and fonts...');

      // Wait for images (logo) to load
      const images = Array.from(container.querySelectorAll('img')) as HTMLImageElement[];
      console.log('Found images:', images.length);
      
      await Promise.all(
        images.map(
          (img) =>
            new Promise<void>((resolve) => {
              if (img.complete) {
                console.log('Image already loaded:', img.src.substring(0, 50) + '...');
                return resolve();
              }
              img.onload = () => {
                console.log('Image loaded successfully');
                resolve();
              };
              img.onerror = () => {
                console.log('Image failed to load');
                resolve();
              };
            })
        )
      );

      // Step 3: Images loaded (40-60%)
      setGenerationProgress(60);
      setGenerationStatus('Converting pages to PDF...');

      const pages = Array.from(container.querySelectorAll('.print-page')) as HTMLElement[];
      console.log('Found pages:', pages.length);
      
      if (pages.length === 0) {
        console.error('No pages found in container');
        console.log('Container HTML:', container.innerHTML.substring(0, 500));
        throw new Error('No pages to export');
      }

      const pdf = new jsPDF('p', 'mm', 'a4');

      for (let i = 0; i < pages.length; i++) {
        const el = pages[i];
        console.log(`Capturing page ${i + 1}/${pages.length}`);
        
        // Update progress per page (60-90%)
        const pageProgress = 60 + ((i / pages.length) * 30);
        setGenerationProgress(pageProgress);
        setGenerationStatus(`Converting page ${i + 1} of ${pages.length}...`);
        
        const canvas = await html2canvas(el, { 
          scale: 2, 
          useCORS: true, 
          backgroundColor: '#ffffff',
          logging: false, // Reduce console noise
          allowTaint: true,
          height: el.offsetHeight,
          width: el.offsetWidth,
          ignoreElements: (element) => {
            // Don't ignore any elements since we're off-screen
            return false;
          }
        });
        
        console.log(`Canvas created: ${canvas.width}x${canvas.height}`);
        
        const imgData = canvas.toDataURL('image/png');
        if (i > 0) pdf.addPage();
        
        // Scale to fit A4 (210x297mm)
        const imgWidth = 210;
        const imgHeight = 297;
        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      }

      // Step 4: Finalizing download (90-100%)
      setGenerationProgress(90);
      setGenerationStatus('Finalizing download...');

      // Reset container to hidden state
      container.style.position = 'absolute';
      container.style.left = '-10000px';
      container.style.visibility = 'hidden';
      container.style.opacity = '1'; // Reset opacity
      container.style.pointerEvents = 'auto'; // Reset pointer events

      const fileName = `Meal_Labels_${formatDate(selectedDate, 'yyyy-MM-dd')}.pdf`;
      pdf.save(fileName);

      setGenerationProgress(100);
      setGenerationStatus('Download complete!');

      const totalLabels = mealProduction.reduce((sum, meal) => sum + meal.quantity, 0);
      const totalPages = Math.ceil(totalLabels / 10);

      toast({
        title: 'PDF Generated Successfully! 🎉',
        description: `Downloaded ${totalLabels} labels across ${totalPages} A4 pages. Ready to print!`,
      });
    } catch (error) {
      console.error('Error generating labels:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate labels. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingPDF(false);
      setGenerationProgress(0);
      setGenerationStatus('');
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
                      {isGeneratingPDF ? (
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4 mr-1" />
                      )}
                      {isGeneratingPDF ? `${Math.round(generationProgress)}%` : 'Generate Labels'}
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Progress indicator during PDF generation */}
                {isGeneratingPDF && (
                  <div className="mb-4 p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3 mb-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm font-medium">Generating PDF Labels...</span>
                    </div>
                    <Progress value={generationProgress} className="mb-2" />
                    <p className="text-xs text-muted-foreground">{generationStatus}</p>
                  </div>
                )}

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
                    <div className="text-2xl font-bold text-primary">{uniqueOrderIds.size}</div>
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

        {/* Offscreen PDF renderer (uses exact label generator design) */}
        <div
          ref={pdfRef}
          style={{ position: 'absolute', left: '-10000px', top: 0, visibility: 'hidden' }}
        >
          {mealProduction.length > 0 && (
            <LabelPrintPreview
              mealProduction={mealProduction}
              useByDate={formatDate(new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd')}
            />
          )}
        </div>

        {/* Label Print Preview Dialog */}
        {showLabelPreview && mealProduction.length > 0 && (
          <Dialog open={showLabelPreview} onOpenChange={setShowLabelPreview}>
            <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto">
            <DialogHeader className="no-print">
              <DialogTitle className="flex items-center justify-between">
                <span>Print Preview - Label Layout</span>
                <Button
                  onClick={() => window.print()}
                  size="sm"
                  className="ml-4"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </Button>
              </DialogTitle>
            </DialogHeader>
              <LabelPrintPreview 
                mealProduction={mealProduction}
                useByDate={formatDate(new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd')}
              />
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  );
};