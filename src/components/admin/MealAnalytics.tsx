import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, Package, DollarSign, Eye, ShoppingCart, Users, Star, X } from "lucide-react";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { DateRange } from "react-day-picker";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import * as React from "react";

interface MealAnalyticsData {
  totalOrders: number;
  totalRevenue: number;
  totalViews: number;
  conversionRate: number;
  popularMeals: Array<{
    name: string;
    orders: number;
    revenue: number;
    views: number;
  }>;
  revenueByDay: Array<{
    date: string;
    revenue: number;
    orders: number;
  }>;
  ordersByCategory: Array<{
    category: string;
    orders: number;
    revenue: number;
  }>;
  growthMetrics: {
    ordersGrowth: number;
    revenueGrowth: number;
    viewsGrowth: number;
  };
}

interface Meal {
  id: string;
  name: string;
  category: string;
  is_active: boolean;
}

const MealAnalytics = () => {
  const [analyticsData, setAnalyticsData] = useState<MealAnalyticsData | null>(null);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [selectedMeal, setSelectedMeal] = useState<string>("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [sortBy, setSortBy] = useState<'revenue' | 'orders'>('revenue');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const mealsPerPage = 10;

  useEffect(() => {
    fetchMeals();
  }, []);

  useEffect(() => {
    if (meals.length > 0) {
      fetchAnalytics();
    }
  }, [selectedMeal, dateRange, meals]);

  // Reset pagination when sorting changes
  useEffect(() => {
    setCurrentPage(1);
  }, [sortBy]);

  const fetchMeals = async () => {
    try {
      const { data, error } = await supabase
        .from("meals")
        .select("id, name, category, is_active")
        .order("name");

      if (error) throw error;
      setMeals(data || []);
    } catch (error) {
      console.error("Error fetching meals:", error);
      toast({
        title: "Error",
        description: "Failed to fetch meals",
        variant: "destructive",
      });
    }
  };

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      let startDate: Date;
      let endDate: Date;

      // Use custom date range if provided, otherwise default to last 30 days
      if (dateRange?.from) {
        startDate = startOfDay(dateRange.from);
        // If we have a 'to' date and it's different from 'from', use it; otherwise use 'from' date
        if (dateRange.to && dateRange.from.getTime() !== dateRange.to.getTime()) {
          endDate = endOfDay(dateRange.to);
        } else {
          endDate = endOfDay(dateRange.from);
        }
        
        console.log('Using custom date range:', {
          from: dateRange.from,
          to: dateRange.to,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        });
      } else {
        // Default to last 30 days
        startDate = startOfDay(subDays(new Date(), 29));
        endDate = endOfDay(new Date());
        
        console.log('Using default date range (last 30 days):', {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        });
      }

      // Base query filters
      const dateFilter = `created_at.gte.${startDate.toISOString()},created_at.lte.${endDate.toISOString()}`;
      
      // Fetch orders data
      let ordersQuery = supabase
        .from("orders")
        .select(`
          id,
          total_amount,
          created_at,
          order_items (
            meal_id,
            quantity,
            unit_price,
            meal_name
          )
        `)
        .in("status", ["completed", "confirmed"])
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString());

      const { data: ordersData, error: ordersError } = await ordersQuery;
      if (ordersError) throw ordersError;

      // Fetch page views data
      let viewsQuery = supabase
        .from("page_views")
        .select("page_id, created_at")
        .eq("page_type", "meal")
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString());

      if (selectedMeal !== "all") {
        viewsQuery = viewsQuery.eq("page_id", selectedMeal);
      }

      const { data: viewsData, error: viewsError } = await viewsQuery;
      if (viewsError) throw viewsError;

      // Fetch previous period data for growth calculation
      const periodLength = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const prevStartDate = startOfDay(subDays(startDate, periodLength));
      const prevEndDate = endOfDay(subDays(endDate, periodLength));

      const { data: prevOrdersData } = await supabase
        .from("orders")
        .select("total_amount")
        .in("status", ["completed", "confirmed"])
        .gte("created_at", prevStartDate.toISOString())
        .lte("created_at", prevEndDate.toISOString());

      const { data: prevViewsData } = await supabase
        .from("page_views")
        .select("id")
        .eq("page_type", "meal")
        .gte("created_at", prevStartDate.toISOString())
        .lte("created_at", prevEndDate.toISOString());

      // Process data
      const orders = ordersData || [];
      const views = viewsData || [];
      const prevOrders = prevOrdersData || [];
      const prevViews = prevViewsData || [];

      // Filter orders by selected meal if specified
      let filteredOrders = orders;
      if (selectedMeal !== "all") {
        filteredOrders = orders.filter(order =>
          order.order_items?.some(item => item.meal_id === selectedMeal)
        );
      }

      // Calculate metrics
      const totalOrders = filteredOrders.length;
      const totalRevenue = filteredOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
      const totalViews = views.length;
      const conversionRate = totalViews > 0 ? (totalOrders / totalViews) * 100 : 0;

      // Calculate growth metrics
      const prevTotalOrders = prevOrders.length;
      const prevTotalRevenue = prevOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
      const prevTotalViews = prevViews.length;

      const ordersGrowth = prevTotalOrders > 0 ? ((totalOrders - prevTotalOrders) / prevTotalOrders) * 100 : 0;
      const revenueGrowth = prevTotalRevenue > 0 ? ((totalRevenue - prevTotalRevenue) / prevTotalRevenue) * 100 : 0;
      const viewsGrowth = prevTotalViews > 0 ? ((totalViews - prevTotalViews) / prevTotalViews) * 100 : 0;

      // Process popular meals
      const mealStats = new Map<string, { orders: number; revenue: number; views: number; name: string }>();
      
      // Initialize with all meals
      meals.forEach(meal => {
        mealStats.set(meal.id, { orders: 0, revenue: 0, views: 0, name: meal.name });
      });

      // Count orders and revenue per meal
      filteredOrders.forEach(order => {
        order.order_items?.forEach(item => {
          if (item.meal_id) {
            const current = mealStats.get(item.meal_id);
            if (current) {
              current.orders += item.quantity || 0;
              current.revenue += (item.unit_price || 0) * (item.quantity || 0);
              mealStats.set(item.meal_id, current);
            }
          }
        });
      });

      // Count views per meal
      views.forEach(view => {
        if (view.page_id) {
          const current = mealStats.get(view.page_id);
          if (current) {
            current.views += 1;
            mealStats.set(view.page_id, current);
          }
        }
      });

      const popularMeals = Array.from(mealStats.values())
        .filter(meal => meal.orders > 0 || meal.revenue > 0) // Only include meals with activity
        .sort((a, b) => b.revenue - a.revenue); // Default sort by revenue

      // Process revenue by day
      const revenueByDay = new Map<string, { revenue: number; orders: number }>();
      
      const chartDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      for (let i = 0; i < chartDays; i++) {
        const date = format(subDays(endDate, i), 'yyyy-MM-dd');
        revenueByDay.set(date, { revenue: 0, orders: 0 });
      }

      filteredOrders.forEach(order => {
        const date = format(new Date(order.created_at), 'yyyy-MM-dd');
        const current = revenueByDay.get(date);
        if (current) {
          current.revenue += order.total_amount || 0;
          current.orders += 1;
          revenueByDay.set(date, current);
        }
      });

      const revenueChartData = Array.from(revenueByDay.entries())
        .map(([date, data]) => ({
          date: format(new Date(date), 'MMM dd'),
          revenue: data.revenue,
          orders: data.orders
        }))
        .reverse();

      // Process orders by category
      const categoryStats = new Map<string, { orders: number; revenue: number }>();
      
      filteredOrders.forEach(order => {
        order.order_items?.forEach(item => {
          if (item.meal_id) {
            const meal = meals.find(m => m.id === item.meal_id);
            if (meal) {
              const category = meal.category || 'Uncategorized';
              const current = categoryStats.get(category) || { orders: 0, revenue: 0 };
              current.orders += item.quantity || 0;
              current.revenue += (item.unit_price || 0) * (item.quantity || 0);
              categoryStats.set(category, current);
            }
          }
        });
      });

      const ordersByCategory = Array.from(categoryStats.entries())
        .map(([category, data]) => ({
          category,
          orders: data.orders,
          revenue: data.revenue
        }))
        .sort((a, b) => b.orders - a.orders);

      setAnalyticsData({
        totalOrders,
        totalRevenue,
        totalViews,
        conversionRate,
        popularMeals,
        revenueByDay: revenueChartData,
        ordersByCategory,
        growthMetrics: {
          ordersGrowth,
          revenueGrowth,
          viewsGrowth
        }
      });

    } catch (error) {
      console.error("Error fetching analytics:", error);
      toast({
        title: "Error",
        description: "Failed to fetch analytics data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount);
  };

  const getGrowthIcon = (growth: number) => {
    return growth >= 0 ? <TrendingUp className="h-4 w-4 text-green-600" /> : <TrendingDown className="h-4 w-4 text-red-600" />;
  };

  const getGrowthColor = (growth: number) => {
    return growth >= 0 ? "text-green-600" : "text-red-600";
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="space-y-4">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
          <div className="flex gap-4 items-center">
            <Select value={selectedMeal} onValueChange={setSelectedMeal}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select meal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Meals</SelectItem>
                {meals.map((meal) => (
                  <SelectItem key={meal.id} value={meal.id}>
                    {meal.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Enhanced Date Range Picker */}
        <div className="flex items-center gap-4 justify-between">
          <div className="flex items-center gap-4">
            <DateRangePicker
              date={dateRange}
              onDateChange={setDateRange}
              placeholder="Select date range for analytics"
              className="w-auto"
            />
          </div>
          {dateRange && (
            <div className="text-sm text-muted-foreground">
              Custom date range active
            </div>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Orders</p>
                <p className="text-2xl font-bold">{analyticsData?.totalOrders || 0}</p>
                <div className={`flex items-center gap-1 text-xs ${getGrowthColor(analyticsData?.growthMetrics.ordersGrowth || 0)}`}>
                  {getGrowthIcon(analyticsData?.growthMetrics.ordersGrowth || 0)}
                  {Math.abs(analyticsData?.growthMetrics.ordersGrowth || 0).toFixed(1)}%
                </div>
              </div>
              <ShoppingCart className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">{formatCurrency(analyticsData?.totalRevenue || 0)}</p>
                <div className={`flex items-center gap-1 text-xs ${getGrowthColor(analyticsData?.growthMetrics.revenueGrowth || 0)}`}>
                  {getGrowthIcon(analyticsData?.growthMetrics.revenueGrowth || 0)}
                  {Math.abs(analyticsData?.growthMetrics.revenueGrowth || 0).toFixed(1)}%
                </div>
              </div>
              <DollarSign className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Page Views</p>
                <p className="text-2xl font-bold">{analyticsData?.totalViews || 0}</p>
                <div className={`flex items-center gap-1 text-xs ${getGrowthColor(analyticsData?.growthMetrics.viewsGrowth || 0)}`}>
                  {getGrowthIcon(analyticsData?.growthMetrics.viewsGrowth || 0)}
                  {Math.abs(analyticsData?.growthMetrics.viewsGrowth || 0).toFixed(1)}%
                </div>
              </div>
              <Eye className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Conversion Rate</p>
                <p className="text-2xl font-bold">{(analyticsData?.conversionRate || 0).toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground">Views to Orders</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Meals</p>
                <p className="text-2xl font-bold">{analyticsData?.popularMeals.length || 0}</p>
                <p className="text-xs text-muted-foreground">With activity</p>
              </div>
              <Package className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue & Orders Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analyticsData?.revenueByDay || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip
                  formatter={(value, name) => [
                    name === 'revenue' ? formatCurrency(Number(value)) : value,
                    name === 'revenue' ? 'Revenue' : 'Orders'
                  ]}
                />
                <Bar yAxisId="left" dataKey="revenue" fill="#8884d8" />
                <Bar yAxisId="right" dataKey="orders" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Orders by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analyticsData?.ordersByCategory || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ category, percent }) => `${category}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="orders"
                >
                  {(analyticsData?.ordersByCategory || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [value, 'Orders']} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* All Meals Performance */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Meal Performance</CardTitle>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-muted-foreground">Sort By:</span>
            <div className="flex items-center gap-2">
              <Button
                variant={sortBy === 'revenue' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSortBy('revenue')}
              >
                <DollarSign className="h-4 w-4 mr-1" />
                Revenue
              </Button>
              <Button
                variant={sortBy === 'orders' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSortBy('orders')}
              >
                <ShoppingCart className="h-4 w-4 mr-1" />
                Orders
              </Button>
            </div>
          </div>
          </div>
        </CardHeader>
        <CardContent>
          {analyticsData?.popularMeals && analyticsData.popularMeals.length > 0 ? (
            <>
              <div className="space-y-4">
                {analyticsData.popularMeals
                  .sort((a, b) => sortBy === 'revenue' ? b.revenue - a.revenue : b.orders - a.orders)
                  .slice((currentPage - 1) * mealsPerPage, currentPage * mealsPerPage)
                  .map((meal, index) => {
                    const globalIndex = (currentPage - 1) * mealsPerPage + index + 1;
                    return (
                      <div key={meal.name} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Badge variant="secondary">#{globalIndex}</Badge>
                          <div>
                            <p className="font-medium">{meal.name}</p>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <ShoppingCart className="h-3 w-3" />
                                {meal.orders} orders
                              </span>
                              <span className="flex items-center gap-1">
                                <DollarSign className="h-3 w-3" />
                                {formatCurrency(meal.revenue)}
                              </span>
                              <span className="flex items-center gap-1">
                                <Eye className="h-3 w-3" />
                                {meal.views} views
                              </span>
                              {meal.views > 0 && (
                                <span className="text-xs">
                                  ({((meal.orders / meal.views) * 100).toFixed(1)}% conversion)
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-primary">
                            {sortBy === 'revenue' ? formatCurrency(meal.revenue) : `${meal.orders} orders`}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {sortBy === 'revenue' ? `${meal.orders} orders` : formatCurrency(meal.revenue)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>

              {/* Pagination */}
              {analyticsData.popularMeals.length > mealsPerPage && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    Showing {((currentPage - 1) * mealsPerPage) + 1}-{Math.min(currentPage * mealsPerPage, analyticsData.popularMeals.length)} of {analyticsData.popularMeals.length} meals
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from(
                        { length: Math.ceil(analyticsData.popularMeals.length / mealsPerPage) },
                        (_, i) => i + 1
                      )
                        .filter(page => {
                          const totalPages = Math.ceil(analyticsData.popularMeals.length / mealsPerPage);
                          return page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1;
                        })
                        .map((page, index, filteredPages) => (
                          <React.Fragment key={page}>
                            {index > 0 && filteredPages[index - 1] < page - 1 && (
                              <span className="px-2 text-sm text-muted-foreground">...</span>
                            )}
                            <Button
                              variant={currentPage === page ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setCurrentPage(page)}
                              className="w-8 h-8 p-0"
                            >
                              {page}
                            </Button>
                          </React.Fragment>
                        ))}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(Math.ceil(analyticsData.popularMeals.length / mealsPerPage), prev + 1))}
                      disabled={currentPage === Math.ceil(analyticsData.popularMeals.length / mealsPerPage)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No meal activity found for the selected period</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MealAnalytics;