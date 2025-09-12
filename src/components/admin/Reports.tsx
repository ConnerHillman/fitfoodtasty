import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Calendar as CalendarIcon, 
  ChefHat, 
  Package2, 
  List, 
  FileText, 
  Printer, 
  Download,
  Clock,
  Users,
  MapPin,
  Calculator,
  Clipboard,
  Tags,
  Upload,
  FileSpreadsheet
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import DataImporter from '@/components/DataImporter';
import { format as formatDate, startOfDay, endOfDay, startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths } from 'date-fns';
import { cn } from '@/lib/utils';
import * as XLSX from 'xlsx';

const Reports = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [packageOrders, setPackageOrders] = useState<any[]>([]);
  const [meals, setMeals] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [ingredients, setIngredients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: startOfDay(new Date()),
    to: endOfDay(new Date())
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [showFullReport, setShowFullReport] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchReportsData();
  }, [dateRange]);

  const fetchReportsData = async () => {
    try {
      // Fetch all data needed for reports with date filtering
      const [ordersRes, packageOrdersRes, mealsRes, packagesRes, ingredientsRes] = await Promise.all([
        supabase.from("orders").select(`
          *,
          order_items (
            id,
            meal_name,
            quantity,
            unit_price,
            total_price,
            meal_id
          )
        `).gte('created_at', dateRange.from.toISOString())
          .lte('created_at', dateRange.to.toISOString())
          .order("created_at", { ascending: false }),
        
        supabase.from("package_orders").select(`
          *,
          package_meal_selections (
            id,
            quantity,
            meal_id
          )
        `).gte('created_at', dateRange.from.toISOString())
          .lte('created_at', dateRange.to.toISOString())
          .order("created_at", { ascending: false }),
        
        supabase.from("meals").select("*").eq("is_active", true),
        supabase.from("packages").select("*").eq("is_active", true),
        supabase.from("ingredients").select("*")
      ]);

      if (ordersRes.error) throw ordersRes.error;
      if (packageOrdersRes.error) throw packageOrdersRes.error;
      if (mealsRes.error) throw mealsRes.error;
      if (packagesRes.error) throw packagesRes.error;
      if (ingredientsRes.error) throw ingredientsRes.error;

      setOrders(ordersRes.data || []);
      setPackageOrders(packageOrdersRes.data || []);
      setMeals(mealsRes.data || []);
      setPackages(packagesRes.data || []);
      setIngredients(ingredientsRes.data || []);
    } catch (error) {
      console.error("Error fetching reports data:", error);
      toast({
        title: "Error",
        description: "Failed to fetch reports data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Calculate production data
  const getItemProduction = () => {
    const production = new Map();
    
    // Process regular orders
    orders.forEach(order => {
      order.order_items?.forEach(item => {
        const key = item.meal_name;
        const current = production.get(key) || { quantity: 0, orders: [], specialInstructions: [] };
        production.set(key, {
          ...current,
          quantity: current.quantity + item.quantity,
          orders: [...current.orders, order.id]
        });
      });
    });

    // Process package orders
    packageOrders.forEach(order => {
      order.package_meal_selections?.forEach(selection => {
        const meal = meals.find(m => m.id === selection.meal_id);
        if (meal) {
          const key = meal.name;
          const current = production.get(key) || { quantity: 0, orders: [], specialInstructions: [] };
          production.set(key, {
            ...current,
            quantity: current.quantity + selection.quantity,
            orders: [...current.orders, order.id]
          });
        }
      });
    });
    
    return Array.from(production.entries())
      .map(([name, data]) => ({ 
        name, 
        quantity: data.quantity,
        orders: data.orders.length,
        specialInstructions: data.specialInstructions || []
      }))
      .sort((a, b) => b.quantity - a.quantity);
  };

  const quickDateOptions = [
    { label: 'Today', value: () => ({ from: startOfDay(new Date()), to: endOfDay(new Date()) }) },
    { label: 'Yesterday', value: () => ({ 
      from: startOfDay(new Date(Date.now() - 24 * 60 * 60 * 1000)), 
      to: endOfDay(new Date(Date.now() - 24 * 60 * 60 * 1000)) 
    }) },
    { label: 'This month', value: () => ({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) }) },
    { label: 'Last month', value: () => ({ 
      from: startOfMonth(subMonths(new Date(), 1)), 
      to: endOfMonth(subMonths(new Date(), 1)) 
    }) },
    { label: 'Year to Date', value: () => ({ from: startOfYear(new Date()), to: endOfDay(new Date()) }) },
    { label: 'This year', value: () => ({ from: startOfYear(new Date()), to: endOfYear(new Date()) }) },
    { label: 'Last year', value: () => ({ 
      from: startOfYear(new Date(new Date().getFullYear() - 1, 0, 1)), 
      to: endOfYear(new Date(new Date().getFullYear() - 1, 11, 31)) 
    }) }
  ];

  const generateKitchenReport = (exportFormat: 'csv' | 'xlsx' | 'print') => {
    const reportData = getItemProduction();
    
    if (exportFormat === 'print') {
      // Create HTML content for printing
      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Kitchen Report - ${formatDate(dateRange.from, 'MMM d, yyyy')} to ${formatDate(dateRange.to, 'MMM d, yyyy')}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              h1 { color: #333; border-bottom: 2px solid #333; padding-bottom: 10px; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; font-weight: bold; }
              tr:nth-child(even) { background-color: #f9f9f9; }
              .date-range { color: #666; margin-bottom: 20px; }
            </style>
          </head>
          <body>
            <h1>Kitchen Production Report</h1>
            <div class="date-range">${formatDate(dateRange.from, 'EEEE, MMMM d, yyyy')} - ${formatDate(dateRange.to, 'EEEE, MMMM d, yyyy')}</div>
            <table>
              <thead>
                <tr>
                  <th>Orders</th>
                  <th>Size</th>
                  <th>Title</th>
                  <th>Variations</th>
                  <th>Special Instructions</th>
                </tr>
              </thead>
              <tbody>
                ${reportData.map(item => `
                  <tr>
                    <td>${item.quantity}</td>
                    <td>-</td>
                    <td>${item.name}</td>
                    <td>-</td>
                    <td>${item.specialInstructions.join('; ') || '-'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </body>
        </html>
      `;
      
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.print();
      }
      
      toast({
        title: "Report Opened",
        description: "Kitchen report opened in new window for printing",
      });
      return;
    }

    const reportDataWithHeaders = [
      ['Orders', 'Size', 'Title', 'Variations', 'Special Instructions'],
      ...reportData.map(item => [
        item.quantity.toString(),
        '', // Size column - empty for now
        item.name,
        '', // Variations column - empty for now  
        item.specialInstructions.join('; ') || ''
      ])
    ];
    
    const dateStr = `${formatDate(dateRange.from, 'yyyy-MM-dd')}_to_${formatDate(dateRange.to, 'yyyy-MM-dd')}`;
    
    if (exportFormat === 'csv') {
      // Generate CSV
      const csvContent = reportDataWithHeaders.map(row => 
        row.map(field => `"${field}"`).join(',')
      ).join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `kitchen-report-${dateStr}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } else if (exportFormat === 'xlsx') {
      // Generate XLSX
      const worksheet = XLSX.utils.aoa_to_sheet(reportDataWithHeaders);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Kitchen Report');
      XLSX.writeFile(workbook, `kitchen-report-${dateStr}.xlsx`);
    }
    
    toast({
      title: "Kitchen Report Generated",
      description: `Your ${exportFormat.toUpperCase()} report has been downloaded`,
    });
  };

  const getIngredientsProduction = () => {
    // This would require meal_ingredients data to calculate properly
    return ingredients.map(ing => ({ name: ing.name, quantity: 0 }));
  };

  const ReportCard = ({ title, description, icon: Icon, children, variant = "default" }) => (
    <Card className={`transition-all duration-200 hover:shadow-lg ${
      variant === "primary" ? "border-primary bg-primary/5" : ""
    }`}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${
            variant === "primary" ? "bg-primary text-primary-foreground" : "bg-muted"
          }`}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            <CardDescription className="text-sm">{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-xl border bg-gradient-to-br from-primary/10 via-primary/5 to-background p-8">
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">Kitchen Reports</h2>
              <p className="text-muted-foreground">Production planning and order management</p>
            </div>
          </div>
        </div>
      </div>
      {/* Date Range Selector */}
      <Card className="border-0 shadow-sm bg-muted/30 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h3 className="font-semibold">Date Range:</h3>
              <Dialog open={showDatePicker} onOpenChange={setShowDatePicker}>
                 <DialogTrigger asChild>
                   <Button variant="outline" className="px-4 py-2 bg-background/80 backdrop-blur-sm">
                     <CalendarIcon className="h-4 w-4 mr-2" />
                     {formatDate(dateRange.from, 'MMM d')} - {formatDate(dateRange.to, 'MMM d, yyyy')}
                   </Button>
                 </DialogTrigger>
                <DialogContent className="max-w-4xl">
                  <DialogHeader>
                    <DialogTitle>Choose Date Range</DialogTitle>
                  </DialogHeader>
                  <div className="flex gap-6">
                    <div className="space-y-2">
                      {quickDateOptions.map((option, index) => (
                        <Button
                          key={index}
                          variant="ghost"
                          className="w-full justify-start"
                          onClick={() => {
                            const newRange = option.value();
                            setDateRange(newRange);
                            setShowDatePicker(false);
                          }}
                        >
                          {option.label}
                        </Button>
                      ))}
                    </div>
                    <div className="flex gap-4">
                      <div>
                        <p className="text-sm font-medium mb-2">From</p>
                        <Calendar
                          mode="single"
                          selected={dateRange.from}
                          onSelect={(date) => date && setDateRange(prev => ({ ...prev, from: startOfDay(date) }))}
                          className="pointer-events-auto"
                        />
                      </div>
                      <div>
                        <p className="text-sm font-medium mb-2">To</p>
                        <Calendar
                          mode="single"
                          selected={dateRange.to}
                          onSelect={(date) => date && setDateRange(prev => ({ ...prev, to: endOfDay(date) }))}
                          className="pointer-events-auto"
                        />
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <div className="flex gap-2">
              {quickDateOptions.slice(0, 3).map((option, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const newRange = option.value();
                    setDateRange(newRange);
                  }}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>
        </Card>

      <Tabs defaultValue="kitchen" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="kitchen" className="flex items-center gap-2">
            <ChefHat className="h-4 w-4" />
            Kitchen Preparation
          </TabsTrigger>
          <TabsTrigger value="orders" className="flex items-center gap-2">
            <Package2 className="h-4 w-4" />
            Order Preparation
          </TabsTrigger>
        </TabsList>

        {/* Kitchen Preparation Tab */}
        <TabsContent value="kitchen" className="space-y-6">
          {/* Top Row - Featured Reports */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ReportCard
              title="Item Production"
              description="Summarizes the quantity of each item needed to fulfill orders"
              icon={Calculator}
              variant="primary"
            >
              <div className="space-y-3">
                {getItemProduction().slice(0, 5).map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-background rounded-lg border">
                    <span className="font-medium">{item.name}</span>
                    <Badge variant="secondary">{item.quantity} units</Badge>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    className="flex-1" 
                    onClick={() => setShowFullReport(!showFullReport)}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    {showFullReport ? 'Hide' : 'View'} Full Report
                  </Button>
                  
                  <Dialog open={showExportOptions} onOpenChange={setShowExportOptions}>
                    <DialogTrigger asChild>
                      <Button>
                        <Download className="h-4 w-4 mr-2" />
                        Generate Report
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Export Kitchen Report</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-3">
                        <Button 
                          variant="outline" 
                          className="w-full justify-start"
                          onClick={() => {
                            generateKitchenReport('xlsx');
                            setShowExportOptions(false);
                          }}
                        >
                          <FileSpreadsheet className="h-4 w-4 mr-2" />
                          Export as Excel (.XLSX)
                        </Button>
                        <Button 
                          variant="outline" 
                          className="w-full justify-start"
                          onClick={() => {
                            generateKitchenReport('csv');
                            setShowExportOptions(false);
                          }}
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Export as CSV
                        </Button>
                        <Button 
                          variant="outline" 
                          className="w-full justify-start"
                          onClick={() => {
                            generateKitchenReport('print');
                            setShowExportOptions(false);
                          }}
                        >
                          <Printer className="h-4 w-4 mr-2" />
                          Print Report
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                
                {showFullReport && (
                  <div className="mt-4 space-y-2 max-h-96 overflow-y-auto">
                    <div className="grid grid-cols-5 gap-2 p-2 bg-muted rounded text-xs font-medium">
                      <span>Orders</span>
                      <span>Size</span>
                      <span>Title</span>
                      <span>Variations</span>
                      <span>Special Instructions</span>
                    </div>
                    {getItemProduction().map((item, index) => (
                      <div key={index} className="grid grid-cols-5 gap-2 p-2 border rounded text-xs">
                        <span className="font-medium">{item.quantity}</span>
                        <span>-</span>
                        <span>{item.name}</span>
                        <span>-</span>
                        <span className="text-muted-foreground">
                          {item.specialInstructions.length > 0 ? item.specialInstructions.join('; ') : '-'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </ReportCard>

            <ReportCard
              title="Ingredients Production"
              description="Summarizes the quantity of each ingredient needed to fulfill orders"
              icon={Clipboard}
            >
              <div className="space-y-3">
                {ingredients.slice(0, 5).map((ingredient, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="font-medium">{ingredient.name}</span>
                    <Badge variant="outline">Calculate needed</Badge>
                  </div>
                ))}
                <Button variant="outline" className="w-full mt-3">
                  <Calculator className="h-4 w-4 mr-2" />
                  Calculate Requirements
                </Button>
              </div>
            </ReportCard>
          </div>

          {/* Second Row - Additional Reports */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <ReportCard
              title="Item Ingredient Recipes"
              description="Displays the specific ingredients needed for each item"
              icon={List}
            >
              <div className="text-center py-6">
                <List className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground mb-4">
                  {meals.length} recipes available
                </p>
                <Button variant="outline" size="sm">
                  View Recipes
                </Button>
              </div>
            </ReportCard>

            <ReportCard
              title="Production Inventory"
              description="Ingredients & supply production report broken down by menu items"
              icon={Package2}
            >
              <div className="text-center py-6">
                <Package2 className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground mb-4">
                  Track ingredient usage
                </p>
                <Button variant="outline" size="sm">
                  View Inventory
                </Button>
              </div>
            </ReportCard>

            <ReportCard
              title="Items"
              description="List of all items on your menu"
              icon={ChefHat}
            >
              <div className="text-center py-6">
                <ChefHat className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground mb-4">
                  {meals.length} active meals
                </p>
                <Button variant="outline" size="sm">
                  View Menu Items
                </Button>
              </div>
            </ReportCard>
          </div>
        </TabsContent>

        {/* Order Preparation Tab */}
        <TabsContent value="orders" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ReportCard
              title="Order Item Summary"
              description="List of orders and their corresponding items"
              icon={FileText}
              variant="primary"
            >
              <div className="space-y-3">
                {orders.slice(0, 3).map((order, index) => (
                  <div key={index} className="p-3 bg-background rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Order #{order.id.slice(-8)}</span>
                      <Badge variant={order.status === 'confirmed' ? 'default' : 'secondary'}>
                        {order.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {order.order_items?.length || 0} items • £{order.total_amount}
                    </p>
                  </div>
                ))}
                <Button variant="outline" className="w-full mt-3">
                  <FileText className="h-4 w-4 mr-2" />
                  View All Orders
                </Button>
              </div>
            </ReportCard>

            <ReportCard
              title="Order Package Summary"
              description="List of orders and their corresponding packages only"
              icon={Package2}
            >
              <div className="space-y-3">
                {packageOrders.length > 0 ? (
                  packageOrders.slice(0, 3).map((order, index) => (
                    <div key={index} className="p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">Package Order #{order.id.slice(-8)}</span>
                        <Badge variant="outline">{order.status}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Package • £{order.total_amount}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6">
                    <Package2 className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                    <p className="text-sm text-muted-foreground">No package orders yet</p>
                  </div>
                )}
              </div>
            </ReportCard>
          </div>

          {/* Print & Label Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <ReportCard
              title="Packing Slips"
              description="Order summaries designed to be printed for customers"
              icon={Printer}
            >
              <div className="text-center py-4">
                <Button variant="outline" size="sm" className="w-full">
                  <Printer className="h-4 w-4 mr-2" />
                  Print Slips
                </Button>
              </div>
            </ReportCard>

            <ReportCard
              title="Package Packing Slips"
              description="Packing slips exclusively for package orders"
              icon={Package2}
            >
              <div className="text-center py-4">
                <Button variant="outline" size="sm" className="w-full">
                  <Package2 className="h-4 w-4 mr-2" />
                  Print Package Slips
                </Button>
              </div>
            </ReportCard>

            <ReportCard
              title="Item Labels"
              description="Printed labels for your items to put on containers"
              icon={Tags}
            >
              <div className="text-center py-4">
                <Button variant="outline" size="sm" className="w-full">
                  <Tags className="h-4 w-4 mr-2" />
                  Print Item Labels
                </Button>
              </div>
            </ReportCard>

            <ReportCard
              title="Order Labels"
              description="Printed labels for your orders to put on order bags"
              icon={MapPin}
            >
              <div className="text-center py-4">
                <Button variant="outline" size="sm" className="w-full">
                  <MapPin className="h-4 w-4 mr-2" />
                  Print Order Labels
                </Button>
              </div>
            </ReportCard>
          </div>
        </TabsContent>
      </Tabs>

      {/* Data Import Section */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Data Import & Management
          </CardTitle>
          <CardDescription>
            Import meals, ingredients, and recipe data to populate your kitchen reports
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataImporter />
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;