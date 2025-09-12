import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { LabelReport } from '@/components/admin/LabelReport';
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
  const [showLabelReport, setShowLabelReport] = useState(false);
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

  const CompactReportCard = ({ title, description, icon: Icon, children, variant = "default", className = "" }) => (
    <Card className={`transition-all duration-200 hover:shadow-md ${
      variant === "primary" ? "border-primary bg-primary/5" : ""
    } ${className}`}>
      <CardHeader className="pb-2">
        <div className="flex items-start gap-2">
          <div className={`p-1.5 rounded-md ${
            variant === "primary" ? "bg-primary text-primary-foreground" : "bg-muted"
          }`}>
            <Icon className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <CardTitle className="text-base leading-tight">{title}</CardTitle>
            <CardDescription className="text-xs mt-0.5">{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
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
    <div className="space-y-6">
      {/* Compact Header with Date Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-4 border">
        <div>
          <h2 className="text-xl font-bold">Kitchen Reports</h2>
          <p className="text-sm text-muted-foreground">Production planning and order management</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <Dialog open={showDatePicker} onOpenChange={setShowDatePicker}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="bg-background/80">
                <CalendarIcon className="h-4 w-4 mr-2" />
                {formatDate(dateRange.from, 'MMM d')} - {formatDate(dateRange.to, 'MMM d')}
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
                      className="w-full justify-start text-sm"
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
          
          <div className="flex gap-1">
            {quickDateOptions.slice(0, 3).map((option, index) => (
              <Button
                key={index}
                variant="ghost"
                size="sm"
                className="text-xs px-2"
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
      </div>

      {/* Main Production Report */}
      <CompactReportCard
        title="Item Production Report"
        description="Order quantities and export options"
        icon={Calculator}
        variant="primary"
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">Production Summary</div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowFullReport(!showFullReport)}
              >
                <FileText className="h-4 w-4 mr-1" />
                {showFullReport ? 'Collapse' : 'Expand'}
              </Button>
              
              <Dialog open={showExportOptions} onOpenChange={setShowExportOptions}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Download className="h-4 w-4 mr-1" />
                    Export
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Export Kitchen Report</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-2">
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
          </div>
          
          {/* Compact Production List */}
          <div className="space-y-1">
            {getItemProduction().slice(0, showFullReport ? undefined : 5).map((item, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-background rounded border text-sm">
                <span className="font-medium">{item.name}</span>
                <Badge variant="secondary" className="text-xs">{item.quantity} units</Badge>
              </div>
            ))}
            {!showFullReport && getItemProduction().length > 5 && (
              <div className="text-center py-2">
                <Button variant="ghost" size="sm" onClick={() => setShowFullReport(true)}>
                  +{getItemProduction().length - 5} more items
                </Button>
              </div>
            )}
          </div>
        </div>
      </CompactReportCard>

      {/* Orders Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CompactReportCard
          title="Individual Orders"
          description={`${orders.length} orders for selected period`}
          icon={FileText}
        >
          <div className="space-y-2">
            {orders.slice(0, 3).map((order, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-background rounded border text-sm">
                <div>
                  <span className="font-medium">#{order.id.slice(-6)}</span>
                  <span className="text-muted-foreground ml-2">{order.order_items?.length || 0} items</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm">£{order.total_amount}</span>
                  <Badge variant={order.status === 'confirmed' ? 'default' : 'secondary'} className="text-xs">
                    {order.status}
                  </Badge>
                </div>
              </div>
            ))}
            {orders.length > 3 && (
              <div className="text-center py-1">
                <span className="text-xs text-muted-foreground">+{orders.length - 3} more orders</span>
              </div>
            )}
            <Button variant="outline" size="sm" className="w-full">
              <FileText className="h-4 w-4 mr-1" />
              View All Orders
            </Button>
          </div>
        </CompactReportCard>

        <CompactReportCard
          title="Package Orders"
          description={`${packageOrders.length} package orders`}
          icon={Package2}
        >
          <div className="space-y-2">
            {packageOrders.length > 0 ? (
              <>
                {packageOrders.slice(0, 3).map((order, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded text-sm">
                    <span className="font-medium">#{order.id.slice(-6)}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">£{order.total_amount}</span>
                      <Badge variant="outline" className="text-xs">{order.status}</Badge>
                    </div>
                  </div>
                ))}
                {packageOrders.length > 3 && (
                  <div className="text-center py-1">
                    <span className="text-xs text-muted-foreground">+{packageOrders.length - 3} more</span>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                <Package2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-xs">No package orders</p>
              </div>
            )}
          </div>
        </CompactReportCard>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <CompactReportCard
          title="Ingredients"
          description={`${ingredients.length} ingredients`}
          icon={Clipboard}
        >
          <Button variant="outline" size="sm" className="w-full">
            <Calculator className="h-4 w-4 mr-1" />
            Calculate
          </Button>
        </CompactReportCard>

        <CompactReportCard
          title="Recipes"
          description={`${meals.length} recipes`}
          icon={List}
        >
          <Button variant="outline" size="sm" className="w-full">
            View All
          </Button>
        </CompactReportCard>

        <CompactReportCard
          title="Inventory"
          description="Track usage"
          icon={Package2}
        >
          <Button variant="outline" size="sm" className="w-full">
            View Report
          </Button>
        </CompactReportCard>

        <CompactReportCard
          title="Menu Items"
          description={`${meals.length} active`}
          icon={ChefHat}
        >
          <Button variant="outline" size="sm" className="w-full">
            Manage
          </Button>
        </CompactReportCard>
      </div>

      {/* Printing & Labels */}
      <CompactReportCard
        title="Printing & Labels"
        description="Quick actions for order fulfillment"
        icon={Printer}
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <Button variant="outline" size="sm">
            <Printer className="h-4 w-4 mr-1" />
            Packing Slips
          </Button>
          <Button variant="outline" size="sm">
            <Package2 className="h-4 w-4 mr-1" />
            Package Slips
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowLabelReport(true)}
          >
            <Tags className="h-4 w-4 mr-1" />
            Item Labels
          </Button>
          <Button variant="outline" size="sm">
            <MapPin className="h-4 w-4 mr-1" />
            Order Labels
          </Button>
        </div>
      </CompactReportCard>

      {/* Data Import & Management */}
      <CompactReportCard
        title="Data Import & Management"
        description="Import meals, ingredients, and recipe data"
        icon={Upload}
      >
        <DataImporter />
      </CompactReportCard>

      {/* Label Report Dialog */}
      <LabelReport 
        isOpen={showLabelReport}
        onClose={() => setShowLabelReport(false)}
      />
    </div>
  );
};

export default Reports;