import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, Download, Filter, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface ReferralData {
  id: string;
  referrer_user_id: string;
  referee_user_id: string;
  order_id: string;
  referral_code_used: string;
  referrer_credit_earned: number;
  referee_discount_given: number;
  order_total: number;
  created_at: string;
  referrer_email: string;
  referee_email: string;
}

const ReferralReports = () => {
  const [referrals, setReferrals] = useState<ReferralData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPeriod, setFilterPeriod] = useState("all");

  useEffect(() => {
    fetchReferralData();
  }, [filterPeriod]);

  const fetchReferralData = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('referral_transactions')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply date filter
      if (filterPeriod !== "all") {
        const now = new Date();
        let startDate = new Date();
        
        switch (filterPeriod) {
          case "7days":
            startDate.setDate(now.getDate() - 7);
            break;
          case "30days":
            startDate.setDate(now.getDate() - 30);
            break;
          case "90days":
            startDate.setDate(now.getDate() - 90);
            break;
        }
        
        query = query.gte('created_at', startDate.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;

      // Fetch user emails separately
      const referralData = data || [];
      const userIds = [...new Set([
        ...referralData.map(r => r.referrer_user_id),
        ...referralData.map(r => r.referee_user_id)
      ])];

      // Get user emails from auth.users via profiles table
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name, full_name')
        .in('user_id', userIds);

      // Import display name utility
      const { getDisplayName } = await import('@/lib/displayName');
      
      // Get emails from a different approach - we'll use user IDs as placeholders for now
      const transformedData = referralData.map(item => {
        const referrerProfile = profiles?.find(p => p.user_id === item.referrer_user_id);
        const refereeProfile = profiles?.find(p => p.user_id === item.referee_user_id);
        return {
          ...item,
          referrer_email: referrerProfile ? getDisplayName(referrerProfile, `User ${item.referrer_user_id.slice(0, 8)}`) : `User ${item.referrer_user_id.slice(0, 8)}`,
          referee_email: refereeProfile ? getDisplayName(refereeProfile, `User ${item.referee_user_id.slice(0, 8)}`) : `User ${item.referee_user_id.slice(0, 8)}`
        };
      });

      setReferrals(transformedData);
    } catch (error) {
      console.error('Error fetching referral data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredReferrals = referrals.filter(referral =>
    referral.referral_code_used.toLowerCase().includes(searchTerm.toLowerCase()) ||
    referral.referrer_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    referral.referee_email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalStats = {
    totalReferrals: filteredReferrals.length,
    totalRevenue: filteredReferrals.reduce((sum, r) => sum + Number(r.order_total), 0),
    totalCreditsEarned: filteredReferrals.reduce((sum, r) => sum + Number(r.referrer_credit_earned), 0),
    totalDiscountsGiven: filteredReferrals.reduce((sum, r) => sum + Number(r.referee_discount_given), 0)
  };

  const exportToCSV = () => {
    const headers = [
      'Date',
      'Referral Code',
      'Referrer Email',
      'Referee Email',
      'Order Total',
      'Credit Earned',
      'Discount Given'
    ];

    const csvData = filteredReferrals.map(referral => [
      format(new Date(referral.created_at), 'yyyy-MM-dd'),
      referral.referral_code_used,
      referral.referrer_email,
      referral.referee_email,
      referral.order_total,
      referral.referrer_credit_earned,
      referral.referee_discount_given
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `referral-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Loading referral data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Referral Reports</h1>
          <p className="text-gray-600">Track and analyze your referral program performance.</p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold">{totalStats.totalReferrals}</div>
              <p className="text-sm text-muted-foreground">Total Referrals</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold">£{totalStats.totalRevenue.toFixed(2)}</div>
              <p className="text-sm text-muted-foreground">Total Revenue</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold">£{totalStats.totalCreditsEarned.toFixed(2)}</div>
              <p className="text-sm text-muted-foreground">Credits Earned</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold">£{totalStats.totalDiscountsGiven.toFixed(2)}</div>
              <p className="text-sm text-muted-foreground">Discounts Given</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Controls */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Referral Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 mb-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search by code, referrer, or referee email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <Select value={filterPeriod} onValueChange={setFilterPeriod}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="7days">Last 7 Days</SelectItem>
                  <SelectItem value="30days">Last 30 Days</SelectItem>
                  <SelectItem value="90days">Last 90 Days</SelectItem>
                </SelectContent>
              </Select>
              
              <Button onClick={exportToCSV} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>

            {/* Referrals Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Referral Code</TableHead>
                    <TableHead>Referrer</TableHead>
                    <TableHead>Referee</TableHead>
                    <TableHead>Order Total</TableHead>
                    <TableHead>Credit Earned</TableHead>
                    <TableHead>Discount Given</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReferrals.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        No referral transactions found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredReferrals.map((referral) => (
                      <TableRow key={referral.id}>
                        <TableCell>
                          {format(new Date(referral.created_at), 'MMM dd, yyyy')}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{referral.referral_code_used}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {referral.referrer_email}
                        </TableCell>
                        <TableCell>{referral.referee_email}</TableCell>
                        <TableCell>£{Number(referral.order_total).toFixed(2)}</TableCell>
                        <TableCell className="text-green-600">
                          £{Number(referral.referrer_credit_earned).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-blue-600">
                          £{Number(referral.referee_discount_given).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ReferralReports;