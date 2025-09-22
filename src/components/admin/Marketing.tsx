import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import ReferralSettingsAdmin from "@/components/admin/ReferralSettingsAdmin";
import CouponModal from "@/components/admin/CouponModal";
import UsageInsightsModal from "@/components/admin/UsageInsightsModal";
import DeleteDialog from "@/components/admin/DeleteDialog";
import { EmailsSection } from "@/components/admin/email/EmailsSection";
import { 
  Users, 
  Percent, 
  Gift, 
  Tag, 
  CreditCard, 
  TrendingUp, 
  Mail,
  MessageSquare, 
  Clock,
  DollarSign,
  Download
} from "lucide-react";

const Marketing = () => {
  const [activeTab, setActiveTab] = useState("leads");

  const LeadsSection = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Lead Management
        </CardTitle>
        <CardDescription>
          Track and manage potential customers
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Total Leads</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Converted</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Conversion Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0%</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const PromotionsSection = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Percent className="h-5 w-5" />
          Promotions
        </CardTitle>
        <CardDescription>
          Create and manage promotional campaigns
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Button>Create New Promotion</Button>
          <div className="text-sm text-muted-foreground">
            No active promotions
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const ReferralsSection = () => (
    <ReferralSettingsAdmin />
  );

  const CouponsSection = () => {
    const [coupons, setCoupons] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [selectedCoupon, setSelectedCoupon] = useState<any>(null);
    const [searchFilter, setSearchFilter] = useState("");
    const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [usageStats, setUsageStats] = useState<Record<string, number>>({});
    const [showUsageModal, setShowUsageModal] = useState(false);
    const [selectedCouponUsage, setSelectedCouponUsage] = useState<any>(null);
    const [usageOrders, setUsageOrders] = useState<any[]>([]);
    const [loadingUsage, setLoadingUsage] = useState(false);
    const [meals, setMeals] = useState<any[]>([]);
    const { toast } = useToast();

    // Form state
    const [formData, setFormData] = useState({
      code: '',
      discount_type: 'percentage', // percentage, fixed_amount, free_delivery, free_item
      discount_percentage: 0,
      discount_amount: 0,
      free_delivery: false,
      free_item_id: '',
      min_order_value: 0,
      active: true,
      expires_at: null as Date | null
    });

    // Fetch coupons, usage stats, and meals on component load
    useEffect(() => {
      fetchCoupons();
      fetchUsageStats();
      fetchMeals();
    }, []);

    const fetchMeals = async () => {
      try {
        const { data, error } = await supabase
          .from('meals')
          .select('id, name')
          .eq('is_active', true)
          .order('name');

        if (error) throw error;
        setMeals(data || []);
      } catch (err) {
        console.error('Error fetching meals:', err);
      }
    };

    const fetchCoupons = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const { data, error: fetchError } = await supabase
          .from('coupons')
          .select('*')
          .order('created_at', { ascending: sortOrder === 'asc' });

        if (fetchError) throw fetchError;
        
        setCoupons(data || []);
      } catch (err) {
        console.error('Error fetching coupons:', err);
        setError('Failed to load coupons');
      } finally {
        setLoading(false);
      }
    };

    const fetchUsageStats = async () => {
      try {
        // Get usage count for each coupon from orders table
        const { data: orderStats, error } = await supabase
          .from('orders')
          .select('referral_code_used')
          .not('referral_code_used', 'is', null);

        if (error) {
          console.error('Error fetching usage stats:', error);
          return;
        }

        // Count usage by coupon code
        const stats: Record<string, number> = {};
        orderStats?.forEach(order => {
          if (order.referral_code_used) {
            stats[order.referral_code_used] = (stats[order.referral_code_used] || 0) + 1;
          }
        });

        setUsageStats(stats);
      } catch (err) {
        console.error('Error calculating usage stats:', err);
      }
    };

    // Filter and sort coupons
    const filteredCoupons = coupons
      .filter(coupon => {
        const matchesSearch = coupon.code.toLowerCase().includes(searchFilter.toLowerCase());
        const matchesActive = activeFilter === 'all' || 
          (activeFilter === 'active' && coupon.active) ||
          (activeFilter === 'inactive' && !coupon.active);
        return matchesSearch && matchesActive;
      })
      .sort((a, b) => {
        const aDate = new Date(a.created_at).getTime();
        const bDate = new Date(b.created_at).getTime();
        return sortOrder === 'asc' ? aDate - bDate : bDate - aDate;
      });

    const toggleSort = () => {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    };

    const resetForm = () => {
      setFormData({
        code: '',
        discount_type: 'percentage',
        discount_percentage: 0,
        discount_amount: 0,
        free_delivery: false,
        free_item_id: '',
        min_order_value: 0,
        active: true,
        expires_at: null
      });
    };

    const openCreateModal = () => {
      resetForm();
      setShowCreateModal(true);
    };

    const openEditModal = (coupon: any) => {
      setSelectedCoupon(coupon);
      
      // Determine discount type based on existing coupon data
      let discountType = 'percentage';
      if (coupon.discount_amount && coupon.discount_amount > 0) {
        discountType = 'fixed_amount';
      } else if (coupon.free_delivery) {
        discountType = 'free_delivery';
      } else if (coupon.free_item_id) {
        discountType = 'free_item';
      }
      
      setFormData({
        code: coupon.code,
        discount_type: discountType,
        discount_percentage: coupon.discount_percentage || 0,
        discount_amount: coupon.discount_amount || 0,
        free_delivery: coupon.free_delivery || false,
        free_item_id: coupon.free_item_id || '',
        min_order_value: coupon.min_order_value || 0,
        active: coupon.active,
        expires_at: coupon.expires_at ? new Date(coupon.expires_at) : null
      });
      setShowEditModal(true);
    };

    const openDeleteDialog = (coupon: any) => {
      setSelectedCoupon(coupon);
      setShowDeleteDialog(true);
    };

    const handleSubmit = async (isEdit: boolean = false) => {
      // Validation
      if (!formData.code.trim()) {
        toast({
          title: "Error",
          description: "Coupon code is required",
          variant: "destructive",
        });
        return;
      }

      // Validate based on discount type
      if (formData.discount_type === 'percentage') {
        if (formData.discount_percentage < 0 || formData.discount_percentage > 100) {
          toast({
            title: "Error",
            description: "Discount percentage must be between 0 and 100",
            variant: "destructive",
          });
          return;
        }
      } else if (formData.discount_type === 'fixed_amount') {
        if (formData.discount_amount <= 0) {
          toast({
            title: "Error",
            description: "Discount amount must be greater than 0",
            variant: "destructive",
          });
          return;
        }
      } else if (formData.discount_type === 'free_item') {
        if (!formData.free_item_id) {
          toast({
            title: "Error",
            description: "Please select a free item",
            variant: "destructive",
          });
          return;
        }
      }

      if (formData.min_order_value && formData.min_order_value < 0) {
        toast({
          title: "Error",
          description: "Minimum order value must be 0 or greater",
          variant: "destructive",
        });
        return;
      }

      // Validate expiration date
      if (formData.expires_at && formData.expires_at < new Date()) {
        toast({
          title: "Error",
          description: "Expiration date must be in the future",
          variant: "destructive",
        });
        return;
      }

      setIsSubmitting(true);

      try {
        const couponCode = formData.code.trim().toUpperCase();

        // Prepare data based on discount type
        const couponData = {
          code: couponCode,
          discount_percentage: formData.discount_type === 'percentage' ? formData.discount_percentage : 0,
          discount_amount: formData.discount_type === 'fixed_amount' ? formData.discount_amount : null,
          free_delivery: formData.discount_type === 'free_delivery',
          free_item_id: formData.discount_type === 'free_item' ? formData.free_item_id || null : null,
          min_order_value: formData.min_order_value > 0 ? formData.min_order_value : null,
          active: formData.active,
          expires_at: formData.expires_at ? formData.expires_at.toISOString() : null
        };

        if (isEdit && selectedCoupon) {
          // Update existing coupon
          const { error } = await supabase
            .from('coupons')
            .update(couponData)
            .eq('id', selectedCoupon.id);

          if (error) {
            if (error.code === '23505') { // Unique constraint violation
              throw new Error('A coupon with this code already exists');
            }
            throw error;
          }

          toast({
            title: "Success",
            description: "Coupon updated successfully",
          });
          setShowEditModal(false);
        } else {
          // Create new coupon - check for duplicates first
          const { data: existingCoupon } = await supabase
            .from('coupons')
            .select('id')
            .eq('code', couponCode)
            .single();

          if (existingCoupon) {
            toast({
              title: "Error",
              description: "A coupon with this code already exists",
              variant: "destructive",
            });
            return;
          }

          const { error } = await supabase
            .from('coupons')
            .insert(couponData);

          if (error) throw error;

          toast({
            title: "Success",
            description: "Coupon created successfully",
          });
          setShowCreateModal(false);
        }

        // Refresh the table and stats
        await Promise.all([fetchCoupons(), fetchUsageStats()]);
        resetForm();
      } catch (err: any) {
        console.error('Error saving coupon:', err);
        toast({
          title: "Error",
          description: err.message || "Failed to save coupon",
          variant: "destructive",
        });
      } finally {
        setIsSubmitting(false);
      }
    };

    const handleDelete = async () => {
      if (!selectedCoupon) return;

      setIsSubmitting(true);

      try {
        const { error } = await supabase
          .from('coupons')
          .delete()
          .eq('id', selectedCoupon.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Coupon deleted successfully",
        });

        setShowDeleteDialog(false);
        setSelectedCoupon(null);
        
        // Refresh the table and stats
        await Promise.all([fetchCoupons(), fetchUsageStats()]);
      } catch (err: any) {
        console.error('Error deleting coupon:', err);
        toast({
          title: "Error",
          description: "Failed to delete coupon",
          variant: "destructive",
        });
      } finally {
        setIsSubmitting(false);
      }
    };

    const getDiscountDisplay = (coupon: any) => {
      if (coupon.discount_percentage > 0) {
        return `${coupon.discount_percentage}% off`;
      } else if (coupon.discount_amount > 0) {
        return `£${coupon.discount_amount} off`;
      } else if (coupon.free_delivery) {
        return 'Free delivery';
      } else if (coupon.free_item_id) {
        const meal = meals.find(m => m.id === coupon.free_item_id);
        return `Free: ${meal?.name || 'Unknown item'}`;
      }
      return 'No discount';
    };

    const exportToCsv = () => {
      // Prepare CSV data
      const csvData = filteredCoupons.map(coupon => ({
        Code: coupon.code,
        Discount: getDiscountDisplay(coupon),
        'Min Order': coupon.min_order_value ? `£${coupon.min_order_value}` : 'None',
        'Expires': coupon.expires_at 
          ? new Date(coupon.expires_at).toLocaleDateString('en-GB', {
              day: '2-digit',
              month: '2-digit', 
              year: 'numeric'
            })
          : 'None',
        Status: coupon.active ? 'Active' : 'Inactive',
        'Usage Count': usageStats[coupon.code] || 0,
        'Created Date': new Date(coupon.created_at).toLocaleDateString('en-GB'),
        'Created Time': new Date(coupon.created_at).toLocaleTimeString('en-GB', { hour12: false })
      }));

      // Convert to CSV string
      const headers = Object.keys(csvData[0] || {});
      const csvContent = [
        headers.join(','),
        ...csvData.map(row => 
          headers.map(header => {
            const value = row[header as keyof typeof row];
            // Escape values that contain commas or quotes
            return typeof value === 'string' && (value.includes(',') || value.includes('"'))
              ? `"${value.replace(/"/g, '""')}"` 
              : value;
          }).join(',')
        )
      ].join('\n');

      // Create and trigger download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `coupon-usage-data-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Export Complete",
        description: `Exported ${csvData.length} coupon records to CSV`,
      });
    };

    const fetchCouponUsageOrders = async (couponCode: string) => {
      setLoadingUsage(true);
      try {
        const { data: orders, error } = await supabase
          .from('orders')
          .select(`
            id,
            customer_name,
            customer_email,
            total_amount,
            created_at,
            status,
            referral_code_used
          `)
          .eq('referral_code_used', couponCode)
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        setUsageOrders(orders || []);
      } catch (err) {
        console.error('Error fetching coupon usage orders:', err);
        toast({
          title: "Error",
          description: "Failed to load coupon usage details",
          variant: "destructive",
        });
      } finally {
        setLoadingUsage(false);
      }
    };

    const handleUsageClick = (coupon: any) => {
      // Always open the modal to allow testing even with zero usage
      setSelectedCouponUsage(coupon);
      setShowUsageModal(true);
      fetchCouponUsageOrders(coupon.code);
    };




    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Coupons
          </CardTitle>
          <CardDescription>
            Create and manage discount coupons
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Action Bar */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div className="flex items-center gap-2">
                <Button onClick={openCreateModal}>
                  Create New Coupon
                </Button>
                <Button 
                  variant="outline" 
                  onClick={exportToCsv}
                  className="flex items-center gap-2"
                  disabled={filteredCoupons.length === 0}
                >
                  <Download className="h-4 w-4" />
                  Export CSV
                </Button>
              </div>
              
              {/* Filters */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full lg:w-auto">
                {/* Search Filter */}
                <Input
                  placeholder="Search by code..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="w-full sm:w-48"
                />
                
                {/* Active Filter */}
                <Select value={activeFilter} onValueChange={(value: 'all' | 'active' | 'inactive') => setActiveFilter(value)}>
                  <SelectTrigger className="w-full sm:w-32">
                    <SelectValue placeholder="Filter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
                
                {/* Sort */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleSort}
                  className="whitespace-nowrap"
                >
                  Date {sortOrder === 'asc' ? '↑' : '↓'}
                </Button>
              </div>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="text-center py-8">
                <div className="text-sm text-muted-foreground">Loading coupons...</div>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="text-center py-8">
                <div className="text-sm text-destructive">{error}</div>
                <Button variant="outline" size="sm" onClick={fetchCoupons} className="mt-2">
                  Try Again
                </Button>
              </div>
            )}

            {/* Coupons Table */}
            {!loading && !error && (
              <div className="rounded-lg border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr className="border-b">
                        <th className="text-left p-3 font-medium">Code</th>
                        <th className="text-left p-3 font-medium">Discount</th>
                        <th className="text-left p-3 font-medium">Min Order</th>
                        <th className="text-left p-3 font-medium">Expires</th>
                        <th className="text-left p-3 font-medium">Active</th>
                        <th className="text-left p-3 font-medium">Usage</th>
                        <th className="text-left p-3 font-medium">Created At</th>
                        <th className="text-left p-3 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCoupons.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="text-center p-8 text-muted-foreground">
                            {searchFilter || activeFilter !== 'all' ? 'No coupons match your filters' : 'No coupons created yet'}
                          </td>
                        </tr>
                      ) : (
                        filteredCoupons.map((coupon) => (
                          <tr key={coupon.id} className="border-b hover:bg-muted/20">
                            <td className="p-3">
                              <code className="px-2 py-1 bg-muted rounded text-sm font-mono">
                                {coupon.code}
                              </code>
                            </td>
                            <td className="p-3">
                              <span className="font-medium">{getDiscountDisplay(coupon)}</span>
                            </td>
                            <td className="p-3">
                              <span className="text-sm">
                                {coupon.min_order_value ? `£${coupon.min_order_value}` : 'None'}
                              </span>
                            </td>
                            <td className="p-3">
                              <span className="text-sm">
                                {coupon.expires_at 
                                  ? new Date(coupon.expires_at).toLocaleDateString('en-GB', {
                                      day: '2-digit',
                                      month: '2-digit',
                                      year: 'numeric'
                                    })
                                  : 'None'
                                }
                              </span>
                            </td>
                            <td className="p-3">
                              <Badge 
                                variant={coupon.active ? "default" : "secondary"}
                                className={coupon.active ? "bg-green-100 text-green-800" : ""}
                              >
                                {coupon.active ? 'Active' : 'Inactive'}
                              </Badge>
                            </td>
                            <td className="p-3">
                              <button
                                onClick={() => handleUsageClick(coupon)}
                                className={`text-sm transition-colors ${
                                  (usageStats[coupon.code] || 0) > 0 
                                    ? 'text-blue-600 hover:text-blue-800 cursor-pointer underline' 
                                    : 'text-muted-foreground hover:text-foreground/80 cursor-pointer underline'
                                }`}
                                title="View orders that used this coupon"
                              >
                                {usageStats[coupon.code] || 0} uses
                              </button>
                            </td>
                            <td className="p-3 text-sm text-muted-foreground">
                              {new Date(coupon.created_at).toLocaleDateString('en-GB', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </td>
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openEditModal(coupon)}
                                  className="h-8 px-2"
                                >
                                  Edit
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => openDeleteDialog(coupon)}
                                  className="h-8 px-2"
                                >
                                  Delete
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Results Count */}
            {!loading && !error && (
              <div className="text-sm text-muted-foreground">
                Showing {filteredCoupons.length} of {coupons.length} coupons
                {(searchFilter || activeFilter !== 'all') && (
                  <span className="ml-2 text-blue-600">
                    (filtered)
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Modals */}
          <CouponModal
            isEdit={false}
            isVisible={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            formData={formData}
            setFormData={setFormData}
            isSubmitting={isSubmitting}
            meals={meals}
            onSubmit={handleSubmit}
          />
          <CouponModal
            isEdit={true}
            isVisible={showEditModal}
            onClose={() => setShowEditModal(false)}
            formData={formData}
            setFormData={setFormData}
            isSubmitting={isSubmitting}
            meals={meals}
            onSubmit={handleSubmit}
          />
          <DeleteDialog
            isVisible={showDeleteDialog}
            onClose={() => setShowDeleteDialog(false)}
            onConfirm={handleDelete}
            selectedCoupon={selectedCoupon}
            isSubmitting={isSubmitting}
          />
          <UsageInsightsModal
            isVisible={showUsageModal}
            onClose={() => setShowUsageModal(false)}
            selectedCouponUsage={selectedCouponUsage}
            usageStats={usageStats}
            usageOrders={usageOrders}
            loadingUsage={loadingUsage}
          />
        </CardContent>
      </Card>
    );
  };

  const GiftCardsSection = () => {
    const [giftCards, setGiftCards] = useState<any[]>([]);
    const [stats, setStats] = useState({
      totalSold: 0,
      totalValue: 0,
      activeCards: 0,
      redeemedCards: 0,
      outstandingBalance: 0
    });
    const [loading, setLoading] = useState(true);
    const [searchFilter, setSearchFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'redeemed' | 'expired'>('all');

    useEffect(() => {
      fetchGiftCards();
      fetchGiftCardStats();
    }, []);

    const fetchGiftCards = async () => {
      try {
        const { data, error } = await supabase
          .from('gift_cards')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50);

        if (error) throw error;
        setGiftCards(data || []);
      } catch (error) {
        console.error('Error fetching gift cards:', error);
      } finally {
        setLoading(false);
      }
    };

    const fetchGiftCardStats = async () => {
      try {
        // Get total stats
        const { data: allCards, error } = await supabase
          .from('gift_cards')
          .select('amount, balance, status, expires_at');

        if (error) throw error;

        const now = new Date();
        let totalSold = 0;
        let totalValue = 0;
        let activeCards = 0;
        let redeemedCards = 0;
        let outstandingBalance = 0;

        allCards?.forEach(card => {
          totalSold += 1;
          totalValue += card.amount;
          outstandingBalance += card.balance;

          const isExpired = new Date(card.expires_at) < now;
          
          if (card.status === 'redeemed' || card.balance === 0) {
            redeemedCards += 1;
          } else if (!isExpired && card.status === 'active') {
            activeCards += 1;
          }
        });

        setStats({
          totalSold,
          totalValue,
          activeCards,
          redeemedCards,
          outstandingBalance
        });
      } catch (error) {
        console.error('Error fetching gift card stats:', error);
      }
    };

    const filteredGiftCards = giftCards.filter(card => {
      const matchesSearch = card.code.toLowerCase().includes(searchFilter.toLowerCase()) ||
                           card.purchaser_name.toLowerCase().includes(searchFilter.toLowerCase()) ||
                           card.recipient_name?.toLowerCase().includes(searchFilter.toLowerCase());
      
      const now = new Date();
      const isExpired = new Date(card.expires_at) < now;
      
      let matchesStatus = true;
      if (statusFilter === 'active') {
        matchesStatus = card.status === 'active' && !isExpired && card.balance > 0;
      } else if (statusFilter === 'redeemed') {
        matchesStatus = card.status === 'redeemed' || card.balance === 0;
      } else if (statusFilter === 'expired') {
        matchesStatus = isExpired;
      }
      
      return matchesSearch && matchesStatus;
    });

    const getStatusBadge = (card: any) => {
      const now = new Date();
      const isExpired = new Date(card.expires_at) < now;
      
      if (isExpired) {
        return <Badge variant="destructive">Expired</Badge>;
      } else if (card.balance === 0) {
        return <Badge variant="secondary">Fully Redeemed</Badge>;
      } else if (card.balance < card.amount) {
        return <Badge variant="outline">Partially Used</Badge>;
      } else {
        return <Badge variant="default">Active</Badge>;
      }
    };

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Gift Cards Management
          </CardTitle>
          <CardDescription>
            View and manage gift card purchases and redemptions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Total Sold</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalSold}</div>
                  <div className="text-sm text-muted-foreground">£{stats.totalValue.toLocaleString()}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Active Cards</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{stats.activeCards}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Redeemed</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">{stats.redeemedCards}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Outstanding</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">£{stats.outstandingBalance.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">Liability</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Redemption Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats.totalSold > 0 ? Math.round((stats.redeemedCards / stats.totalSold) * 100) : 0}%
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search by code, purchaser, or recipient..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="redeemed">Redeemed</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={fetchGiftCards} variant="outline">
                Refresh
              </Button>
            </div>

            {/* Gift Cards Table */}
            <div className="border rounded-lg overflow-hidden">
              <div className="max-h-96 overflow-y-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium">Code</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Amount</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Balance</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Purchaser</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Recipient</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Created</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Expires</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                          Loading gift cards...
                        </td>
                      </tr>
                    ) : filteredGiftCards.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                          No gift cards found
                        </td>
                      </tr>
                    ) : (
                      filteredGiftCards.map((card) => (
                        <tr key={card.id} className="border-t hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="font-mono text-sm">{card.code}</div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-semibold">£{card.amount}</div>
                          </td>
                          <td className="px-4 py-3">
                            <div className={`font-semibold ${card.balance > 0 ? 'text-green-600' : 'text-gray-500'}`}>
                              £{card.balance}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {getStatusBadge(card)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm">
                              <div className="font-medium">{card.purchaser_name}</div>
                              <div className="text-gray-500">{card.purchaser_email}</div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm">
                              <div className="font-medium">{card.recipient_name || '—'}</div>
                              <div className="text-gray-500">{card.recipient_email || '—'}</div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {new Date(card.created_at).toLocaleDateString('en-GB')}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {new Date(card.expires_at).toLocaleDateString('en-GB')}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="text-sm text-gray-500 text-center">
              Showing {filteredGiftCards.length} of {giftCards.length} gift cards
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const UpsalesSection = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Upsales
        </CardTitle>
        <CardDescription>
          Configure upselling opportunities
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch id="upsales-enabled" />
            <Label htmlFor="upsales-enabled">Enable Upsales</Label>
          </div>
          <Button>Configure Upsale Rules</Button>
        </div>
      </CardContent>
    </Card>
  );


  const CustomerSurveySection = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Customer Survey
        </CardTitle>
        <CardDescription>
          Collect customer feedback and insights
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch id="survey-enabled" />
            <Label htmlFor="survey-enabled">Enable Post-Order Surveys</Label>
          </div>
          <Button>Create Survey</Button>
        </div>
      </CardContent>
    </Card>
  );

  const FlodeskSection = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Flodesk Integration
        </CardTitle>
        <CardDescription>
          Connect your Flodesk account for email marketing and automation
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="flodesk-api">Flodesk API Key</Label>
            <Input id="flodesk-api" type="password" placeholder="Enter your Flodesk API key" />
            <div className="text-xs text-muted-foreground">
              Find your API key in Flodesk Settings → Integrations → API
            </div>
          </div>
          <Button>Connect Flodesk</Button>
          <div className="text-sm text-muted-foreground">
            Status: Not connected
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case "leads": return <LeadsSection />;
      case "promotions": return <PromotionsSection />;
      case "referrals": return <ReferralsSection />;
      case "coupons": return <CouponsSection />;
      case "gift-cards": return <GiftCardsSection />;
      case "upsales": return <UpsalesSection />;
      case "emails": return <EmailsSection />;
      case "customer-survey": return <CustomerSurveySection />;
      case "flodesk": return <FlodeskSection />;
      default: return <LeadsSection />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <TrendingUp className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Marketing</h1>
          <p className="text-muted-foreground">Manage your marketing campaigns and customer engagement</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="relative bg-gradient-to-r from-background via-background/95 to-background backdrop-blur-sm border border-border/50 rounded-xl p-2 shadow-lg">
          <TabsList className="grid w-full grid-cols-9 bg-transparent gap-1 p-0 h-auto">
            <TabsTrigger 
              value="leads" 
              className="flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-300 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-md data-[state=active]:shadow-primary/20 hover:bg-muted/50 text-xs font-medium"
            >
              <Users className="h-3 w-3" />
              <span>Leads</span>
            </TabsTrigger>
            <TabsTrigger 
              value="promotions" 
              className="flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-300 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-md data-[state=active]:shadow-primary/20 hover:bg-muted/50 text-xs font-medium"
            >
              <Percent className="h-3 w-3" />
              <span>Promotions</span>
            </TabsTrigger>
            <TabsTrigger 
              value="referrals" 
              className="flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-300 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-md data-[state=active]:shadow-primary/20 hover:bg-muted/50 text-xs font-medium"
            >
              <Gift className="h-3 w-3" />
              <span>Referrals</span>
            </TabsTrigger>
            <TabsTrigger 
              value="coupons" 
              className="flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-300 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-md data-[state=active]:shadow-primary/20 hover:bg-muted/50 text-xs font-medium"
            >
              <Tag className="h-3 w-3" />
              <span>Coupons</span>
            </TabsTrigger>
            <TabsTrigger 
              value="gift-cards" 
              className="flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-300 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-md data-[state=active]:shadow-primary/20 hover:bg-muted/50 text-xs font-medium"
            >
              <CreditCard className="h-3 w-3" />
              <span>Gift Cards</span>
            </TabsTrigger>
            <TabsTrigger 
              value="upsales" 
              className="flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-300 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-md data-[state=active]:shadow-primary/20 hover:bg-muted/50 text-xs font-medium"
            >
              <TrendingUp className="h-3 w-3" />
              <span>Upsales</span>
            </TabsTrigger>
            <TabsTrigger 
              value="emails" 
              className="flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-300 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-md data-[state=active]:shadow-primary/20 hover:bg-muted/50 text-xs font-medium"
            >
              <Mail className="h-3 w-3" />
              <span>Emails</span>
            </TabsTrigger>
            <TabsTrigger 
              value="customer-survey" 
              className="flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-300 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-md data-[state=active]:shadow-primary/20 hover:bg-muted/50 text-xs font-medium"
            >
              <MessageSquare className="h-3 w-3" />
              <span>Survey</span>
            </TabsTrigger>
            <TabsTrigger 
              value="flodesk" 
              className="flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-300 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-md data-[state=active]:shadow-primary/20 hover:bg-muted/50 text-xs font-medium"
            >
              <Mail className="h-3 w-3" />
              <span>Flodesk</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="mt-6">
          {renderTabContent()}
        </div>
      </Tabs>
    </div>
  );
};

export default Marketing;