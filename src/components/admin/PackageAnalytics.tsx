import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SimpleDateRangePicker } from "@/components/ui/simple-date-range-picker";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { TrendingUp, TrendingDown, Package, Users, DollarSign, Star, RefreshCw, Calendar, Target, Award } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { addDays, subDays, startOfDay, endOfDay } from "date-fns";

interface Package {
  id: string;
  name: string;
  price: number;
  meal_count: number;
  is_active: boolean;
}

interface PackageAnalytics {
  packageId: string;
  packageName: string;
  totalOrders: number;
  totalRevenue: number;
  avgOrderValue: number;
  popularMeals: Array<{
    mealName: string;
    selectionCount: number;
    percentage: number;
  }>;
  revenueGrowth: number;
  orderGrowth: number;
  conversionRate: number;
  views: number;
}

interface PackageAnalyticsProps {
  packageId?: string;
  timeRange?: string;
}

const PackageAnalytics = ({ packageId, timeRange = "30" }: PackageAnalyticsProps) => {
  const [packages, setPackages] = useState<Package[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<string>(packageId || "all");
  const [selectedTimeRange, setSelectedTimeRange] = useState(timeRange);
  const [analytics, setAnalytics] = useState<PackageAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchPackages();
  }, []);

  useEffect(() => {
    if (packages.length > 0) {
      fetchAnalytics();
    }
  }, [packages, selectedPackage, selectedTimeRange, dateRange]);

  const fetchPackages = async () => {
    const { data, error } = await supabase
      .from("packages")
      .select("id, name, price, meal_count, is_active")
      .order("name");

    if (error) {
      toast({ title: "Error", description: "Failed to fetch packages", variant: "destructive" });
    } else {
      setPackages(data || []);
    }
  };

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const startDate = startOfDay(dateRange.from);
      const endDate = endOfDay(dateRange.to);
      
      // Calculate the number of days in the selected range
      const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      
      // Get previous period for comparison
      const prevEndDate = startDate;
      const prevStartDate = subDays(startDate, daysDiff);

      const packageFilter = selectedPackage === "all" ? {} : { package_id: selectedPackage };

      // Fetch package orders
      const { data: orders, error: ordersError } = await supabase
        .from("package_orders")
        .select(`
          *,
          package_meal_selections (
            quantity,
            meal_id,
            meals (name)
          ),
          packages (name, price)
        `)
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString())
        .match(packageFilter);

      if (ordersError) throw ordersError;

      // Fetch previous period orders for growth calculation
      const { data: prevOrders, error: prevOrdersError } = await supabase
        .from("package_orders")
        .select("*")
        .gte("created_at", prevStartDate.toISOString())
        .lt("created_at", prevEndDate.toISOString())
        .match(packageFilter);

      if (prevOrdersError) throw prevOrdersError;

      // Fetch page views for packages
      const { data: views, error: viewsError } = await supabase
        .from("page_views")
        .select("*")
        .eq("page_type", "packages")
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString());

      if (viewsError) throw viewsError;

      // Process analytics data
      const analyticsData = processAnalyticsData(orders || [], prevOrders || [], views || []);
      setAnalytics(analyticsData);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      toast({ title: "Error", description: "Failed to fetch analytics data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const processAnalyticsData = (orders: any[], prevOrders: any[], views: any[]): PackageAnalytics[] => {
    const packageMap = new Map<string, PackageAnalytics>();

    // Initialize with all packages
    packages.forEach(pkg => {
      packageMap.set(pkg.id, {
        packageId: pkg.id,
        packageName: pkg.name,
        totalOrders: 0,
        totalRevenue: 0,
        avgOrderValue: 0,
        popularMeals: [],
        revenueGrowth: 0,
        orderGrowth: 0,
        conversionRate: 0,
        views: 0
      });
    });

    // Process current period orders
    orders.forEach(order => {
      const analytics = packageMap.get(order.package_id);
      if (analytics) {
        analytics.totalOrders++;
        analytics.totalRevenue += parseFloat(order.total_amount || 0);
      }
    });

    // Calculate growth rates
    const prevStats = new Map<string, { orders: number; revenue: number }>();
    prevOrders.forEach(order => {
      const stats = prevStats.get(order.package_id) || { orders: 0, revenue: 0 };
      stats.orders++;
      stats.revenue += parseFloat(order.total_amount || 0);
      prevStats.set(order.package_id, stats);
    });

    // Process meal selections
    const mealSelections = new Map<string, Map<string, number>>();
    orders.forEach(order => {
      if (!mealSelections.has(order.package_id)) {
        mealSelections.set(order.package_id, new Map());
      }
      const packageMeals = mealSelections.get(order.package_id)!;
      
      order.package_meal_selections?.forEach((selection: any) => {
        const mealName = selection.meals?.name || 'Unknown Meal';
        packageMeals.set(mealName, (packageMeals.get(mealName) || 0) + selection.quantity);
      });
    });

    // Calculate final analytics
    packageMap.forEach((analytics, packageId) => {
      // Average order value
      analytics.avgOrderValue = analytics.totalOrders > 0 ? analytics.totalRevenue / analytics.totalOrders : 0;

      // Growth calculations
      const prevData = prevStats.get(packageId) || { orders: 0, revenue: 0 };
      analytics.orderGrowth = prevData.orders > 0 ? 
        ((analytics.totalOrders - prevData.orders) / prevData.orders) * 100 : 0;
      analytics.revenueGrowth = prevData.revenue > 0 ? 
        ((analytics.totalRevenue - prevData.revenue) / prevData.revenue) * 100 : 0;

      // Popular meals
      const packageMeals = mealSelections.get(packageId);
      if (packageMeals) {
        const totalSelections = Array.from(packageMeals.values()).reduce((sum, count) => sum + count, 0);
        analytics.popularMeals = Array.from(packageMeals.entries())
          .map(([mealName, count]) => ({
            mealName,
            selectionCount: count,
            percentage: totalSelections > 0 ? (count / totalSelections) * 100 : 0
          }))
          .sort((a, b) => b.selectionCount - a.selectionCount)
          .slice(0, 5);
      }

      // Views and conversion rate
      analytics.views = views.filter(v => v.page_id === packageId).length;
      analytics.conversionRate = analytics.views > 0 ? (analytics.totalOrders / analytics.views) * 100 : 0;
    });

    return Array.from(packageMap.values()).filter(a => selectedPackage === "all" || a.packageId === selectedPackage);
  };

  const formatCurrency = (amount: number) => `£${amount.toFixed(2)}`;
  const formatPercent = (percent: number) => `${percent >= 0 ? '+' : ''}${percent.toFixed(1)}%`;

  const chartColors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00', '#ff0000'];

  const totalAnalytics = analytics.reduce((acc, curr) => ({
    totalOrders: acc.totalOrders + curr.totalOrders,
    totalRevenue: acc.totalRevenue + curr.totalRevenue,
    totalViews: acc.totalViews + curr.views,
    avgConversion: analytics.length > 0 ? (acc.totalOrders + curr.totalOrders) / (acc.totalViews + curr.views) * 100 : 0
  }), { totalOrders: 0, totalRevenue: 0, totalViews: 0, avgConversion: 0 });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading analytics...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-4">
          <Select value={selectedPackage} onValueChange={setSelectedPackage}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select package" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Packages</SelectItem>
              {packages.map(pkg => (
                <SelectItem key={pkg.id} value={pkg.id}>{pkg.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <SimpleDateRangePicker
            date={dateRange}
            onDateChange={(range) => {
              if (range?.from && range?.to) {
                setDateRange({ from: range.from, to: range.to });
              }
            }}
            showPresets={true}
          />
        </div>

        <Button onClick={fetchAnalytics} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAnalytics.totalOrders}</div>
            <p className="text-xs text-muted-foreground">
              {selectedPackage === "all" ? "All packages" : "Selected package"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalAnalytics.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              Last {selectedTimeRange} days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Page Views</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAnalytics.totalViews}</div>
            <p className="text-xs text-muted-foreground">
              Package page visits
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAnalytics.avgConversion.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Views to orders
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Package Performance */}
      {analytics.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Package Revenue Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="packageName" />
                  <YAxis />
                  <Tooltip formatter={(value) => [formatCurrency(value as number), 'Revenue']} />
                  <Bar dataKey="totalRevenue" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Orders Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Package Order Volume</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="packageName" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="totalOrders" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Individual Package Analytics */}
      {analytics.map((packageAnalytics, index) => (
        <Card key={packageAnalytics.packageId} className="mt-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{packageAnalytics.packageName} - Detailed Analytics</CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant={packageAnalytics.revenueGrowth >= 0 ? "default" : "destructive"}>
                  {packageAnalytics.revenueGrowth >= 0 ? (
                    <TrendingUp className="h-3 w-3 mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-1" />
                  )}
                  {formatPercent(packageAnalytics.revenueGrowth)}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{packageAnalytics.totalOrders}</div>
                <div className="text-sm text-muted-foreground">Total Orders</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{formatCurrency(packageAnalytics.totalRevenue)}</div>
                <div className="text-sm text-muted-foreground">Total Revenue</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{formatCurrency(packageAnalytics.avgOrderValue)}</div>
                <div className="text-sm text-muted-foreground">Avg Order Value</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{packageAnalytics.conversionRate.toFixed(1)}%</div>
                <div className="text-sm text-muted-foreground">Conversion Rate</div>
              </div>
            </div>

            {/* Popular Meals */}
            {packageAnalytics.popularMeals.length > 0 && (
              <div>
                <h4 className="text-md font-semibold mb-3 flex items-center">
                  <Award className="h-4 w-4 mr-2" />
                  Most Popular Meals
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    {packageAnalytics.popularMeals.map((meal, mealIndex) => (
                      <div key={mealIndex} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                        <span className="font-medium">{meal.mealName}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{meal.selectionCount} orders</Badge>
                          <span className="text-sm text-muted-foreground">{meal.percentage.toFixed(1)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-center">
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={packageAnalytics.popularMeals}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ percentage }) => `${percentage.toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="selectionCount"
                        >
                          {packageAnalytics.popularMeals.map((entry, mealIndex) => (
                            <Cell key={`cell-${mealIndex}`} fill={chartColors[mealIndex % chartColors.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value, name) => [value, 'Selections']} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {analytics.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Analytics Data</h3>
            <p className="text-muted-foreground">
              No analytics data available for the selected time period.
              {selectedPackage !== "all" ? " Try selecting a different package or time range." : " Try selecting a different time range."}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PackageAnalytics;