import React, { useState } from 'react';
import { ReportButton } from './ReportButton';
import { SimpleDateRangePicker } from '@/components/ui/simple-date-range-picker';
import { SimpleDatePicker } from '@/components/ui/simple-date-picker';
import { 
  Calculator,
  Package,
  Tag,
  BookOpen,
  Users,
  UserPlus,
  FileText,
  Clock,
  TrendingUp,
  BarChart3,
  PieChart,
  AlertTriangle,
  Route,
  Target
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { startOfDay, endOfDay } from 'date-fns';

export function ReportsGrid() {
  const { toast } = useToast();
  
  // Date states for each report
  const [itemProductionDate, setItemProductionDate] = useState<{ from: Date; to: Date }>({
    from: startOfDay(new Date()),
    to: endOfDay(new Date())
  });
  const [ingredientsProductionDate, setIngredientsProductionDate] = useState<{ from: Date; to: Date }>({
    from: startOfDay(new Date()),
    to: endOfDay(new Date())
  });
  const [labelsDate, setLabelsDate] = useState<Date | undefined>(new Date());
  const [orderSummaryDate, setOrderSummaryDate] = useState<{ from: Date; to: Date }>({
    from: startOfDay(new Date()),
    to: endOfDay(new Date())
  });
  const [orderTimingDate, setOrderTimingDate] = useState<{ from: Date; to: Date }>({
    from: startOfDay(new Date()),
    to: endOfDay(new Date())
  });
  const [newCustomerDate, setNewCustomerDate] = useState<{ from: Date; to: Date }>({
    from: startOfDay(new Date()),
    to: endOfDay(new Date())
  });
  const [mealPerformanceDate, setMealPerformanceDate] = useState<{ from: Date; to: Date }>({
    from: startOfDay(new Date()),
    to: endOfDay(new Date())
  });
  const [retentionDate, setRetentionDate] = useState<{ from: Date; to: Date }>({
    from: startOfDay(new Date()),
    to: endOfDay(new Date())
  });
  const [problemDetectionDate, setProblemDetectionDate] = useState<{ from: Date; to: Date }>({
    from: startOfDay(new Date()),
    to: endOfDay(new Date())
  });
  const [deliveryRoutesDate, setDeliveryRoutesDate] = useState<Date | undefined>(new Date());

  const handleComingSoon = (reportName: string) => {
    toast({
      title: "Coming Soon",
      description: `${reportName} functionality will be available soon.`,
    });
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-background rounded-lg p-6 border">
        <h1 className="text-3xl font-bold mb-2">Reports</h1>
        <p className="text-muted-foreground">
          Generate comprehensive business reports for production, analytics, and insights
        </p>
      </div>

      {/* Production Reports */}
      <section className="space-y-4">
        <div className="border-l-4 border-primary pl-4">
          <h2 className="text-xl font-semibold">Production Reports</h2>
          <p className="text-sm text-muted-foreground">Kitchen and operations management</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <ReportButton
            title="Item/Meal Production"
            description="View meal quantities needed for selected date range"
            icon={Calculator}
            onClick={() => handleComingSoon("Item/Meal Production")}
            datePickerSlot={
              <SimpleDateRangePicker
                date={itemProductionDate}
                onDateChange={(range) => {
                  if (range?.from && range?.to) {
                    setItemProductionDate({ from: startOfDay(range.from), to: endOfDay(range.to) });
                  }
                }}
                placeholder="Select production date range"
              />
            }
          />

          <ReportButton
            title="Ingredients Production"
            description="Calculate ingredient quantities for production"
            icon={Package}
            onClick={() => handleComingSoon("Ingredients Production")}
            datePickerSlot={
              <SimpleDateRangePicker
                date={ingredientsProductionDate}
                onDateChange={(range) => {
                  if (range?.from && range?.to) {
                    setIngredientsProductionDate({ from: startOfDay(range.from), to: endOfDay(range.to) });
                  }
                }}
                placeholder="Select production date range"
              />
            }
          />

          <ReportButton
            title="Labels For Meals"
            description="Generate meal labels for a specific delivery day"
            icon={Tag}
            onClick={() => handleComingSoon("Labels For Meals")}
            requiresDate
            datePickerSlot={
              <SimpleDatePicker
                date={labelsDate}
                onDateChange={setLabelsDate}
                placeholder="Select delivery date"
              />
            }
          />

          <ReportButton
            title="Meal Recipes"
            description="View all meal recipes and preparation instructions"
            icon={BookOpen}
            onClick={() => handleComingSoon("Meal Recipes")}
          />
        </div>
      </section>

      {/* Export Reports */}
      <section className="space-y-4">
        <div className="border-l-4 border-secondary pl-4">
          <h2 className="text-xl font-semibold">Export Reports</h2>
          <p className="text-sm text-muted-foreground">Download customer and lead data</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <ReportButton
            title="Export Customers"
            description="Download complete customer database as CSV/Excel"
            icon={Users}
            onClick={() => handleComingSoon("Export Customers")}
          />

          <ReportButton
            title="Export Leads"
            description="Download leads and prospects for marketing"
            icon={UserPlus}
            onClick={() => handleComingSoon("Export Leads")}
          />
        </div>
      </section>

      {/* Business Analytics */}
      <section className="space-y-4">
        <div className="border-l-4 border-accent pl-4">
          <h2 className="text-xl font-semibold">Business Analytics</h2>
          <p className="text-sm text-muted-foreground">Sales and performance insights</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <ReportButton
            title="Order Item Summary"
            description="See which meals are for which customers"
            icon={FileText}
            onClick={() => handleComingSoon("Order Item Summary")}
            datePickerSlot={
              <SimpleDateRangePicker
                date={orderSummaryDate}
                onDateChange={(range) => {
                  if (range?.from && range?.to) {
                    setOrderSummaryDate({ from: startOfDay(range.from), to: endOfDay(range.to) });
                  }
                }}
                placeholder="Select order date range"
              />
            }
          />

          <ReportButton
            title="New Customer Report"
            description="Track first-time customers and acquisition trends"
            icon={UserPlus}
            onClick={() => handleComingSoon("New Customer Report")}
            datePickerSlot={
              <SimpleDateRangePicker
                date={newCustomerDate}
                onDateChange={(range) => {
                  if (range?.from && range?.to) {
                    setNewCustomerDate({ from: startOfDay(range.from), to: endOfDay(range.to) });
                  }
                }}
                placeholder="Select date range"
              />
            }
          />

          <ReportButton
            title="Meal Performance Analytics"
            description="Analyze meal popularity and revenue contribution"
            icon={TrendingUp}
            onClick={() => handleComingSoon("Meal Performance Analytics")}
            datePickerSlot={
              <SimpleDateRangePicker
                date={mealPerformanceDate}
                onDateChange={(range) => {
                  if (range?.from && range?.to) {
                    setMealPerformanceDate({ from: startOfDay(range.from), to: endOfDay(range.to) });
                  }
                }}
                placeholder="Select analysis period"
              />
            }
          />

          <ReportButton
            title="Menu Optimization Report"
            description="Recommendations for menu improvements"
            icon={Target}
            onClick={() => handleComingSoon("Menu Optimization")}
          />
        </div>
      </section>

      {/* Advanced Analytics */}
      <section className="space-y-4">
        <div className="border-l-4 border-primary pl-4">
          <h2 className="text-xl font-semibold">Advanced Analytics</h2>
          <p className="text-sm text-muted-foreground">Deep insights and pattern analysis</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <ReportButton
            title="Customer Segmentation"
            description="Analyze customer groups and behavioral patterns"
            icon={PieChart}
            onClick={() => handleComingSoon("Customer Segmentation")}
          />

          <ReportButton
            title="Order Timing Patterns"
            description="Discover when customers order and identify trends"
            icon={Clock}
            onClick={() => handleComingSoon("Order Timing Patterns")}
            datePickerSlot={
              <SimpleDateRangePicker
                date={orderTimingDate}
                onDateChange={(range) => {
                  if (range?.from && range?.to) {
                    setOrderTimingDate({ from: startOfDay(range.from), to: endOfDay(range.to) });
                  }
                }}
                placeholder="Select analysis period"
              />
            }
          />

          <ReportButton
            title="Customer Retention Analysis"
            description="Track customer loyalty and churn prediction"
            icon={BarChart3}
            onClick={() => handleComingSoon("Customer Retention Analysis")}
            datePickerSlot={
              <SimpleDateRangePicker
                date={retentionDate}
                onDateChange={(range) => {
                  if (range?.from && range?.to) {
                    setRetentionDate({ from: startOfDay(range.from), to: endOfDay(range.to) });
                  }
                }}
                placeholder="Select analysis period"
              />
            }
          />

          <ReportButton
            title="Problem Detection Dashboard"
            description="Identify operational issues and anomalies"
            icon={AlertTriangle}
            onClick={() => handleComingSoon("Problem Detection Dashboard")}
            datePickerSlot={
              <SimpleDateRangePicker
                date={problemDetectionDate}
                onDateChange={(range) => {
                  if (range?.from && range?.to) {
                    setProblemDetectionDate({ from: startOfDay(range.from), to: endOfDay(range.to) });
                  }
                }}
                placeholder="Select monitoring period"
              />
            }
          />

          <ReportButton
            title="Delivery Routes"
            description="Optimize delivery routes for selected day"
            icon={Route}
            onClick={() => handleComingSoon("Delivery Routes")}
            requiresDate
            datePickerSlot={
              <SimpleDatePicker
                date={deliveryRoutesDate}
                onDateChange={setDeliveryRoutesDate}
                placeholder="Select delivery date"
              />
            }
          />
        </div>
      </section>
    </div>
  );
}
