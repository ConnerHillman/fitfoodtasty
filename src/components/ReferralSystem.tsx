import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Copy, Check, Gift, Users, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface ReferralStats {
  total_referrals: number;
  total_revenue: number;
  total_credits: number;
}

const ReferralSystem = () => {
  const { user } = useAuth();
  const [referralCode, setReferralCode] = useState("");
  const [newCode, setNewCode] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copying, setCopying] = useState(false);
  const [stats, setStats] = useState<ReferralStats>({
    total_referrals: 0,
    total_revenue: 0,
    total_credits: 0
  });

  // Fetch referral data
  useEffect(() => {
    const fetchReferralData = async () => {
      if (!user) return;

      try {
        // Get referral code
        const { data: codeData } = await supabase
          .from('referral_codes')
          .select('code')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .single();

        if (codeData) {
          setReferralCode(codeData.code);
          setNewCode(codeData.code);
        }

        // Get user credits
        const { data: creditsData } = await supabase
          .from('user_credits')
          .select('total_credits')
          .eq('user_id', user.id)
          .single();

        // Get referral stats
        const { data: statsData } = await supabase
          .from('referral_transactions')
          .select('referrer_credit_earned, order_total')
          .eq('referrer_user_id', user.id);

        const totalReferrals = statsData?.length || 0;
        const totalRevenue = statsData?.reduce((sum, t) => sum + Number(t.order_total), 0) || 0;
        const totalCredits = creditsData?.total_credits || 0;

        setStats({
          total_referrals: totalReferrals,
          total_revenue: totalRevenue,
          total_credits: totalCredits
        });
      } catch (error) {
        console.error('Error fetching referral data:', error);
      }
    };

    fetchReferralData();
  }, [user]);

  const handleUpdateCode = async () => {
    if (!user || !newCode.trim()) return;

    setLoading(true);
    try {
      // Check if code is available
      const { data: existingCode } = await supabase
        .from('referral_codes')
        .select('id')
        .eq('code', newCode.toUpperCase())
        .neq('user_id', user.id)
        .single();

      if (existingCode) {
        toast.error("This code is already taken. Please choose another one.");
        setLoading(false);
        return;
      }

      // Update the code
      const { error } = await supabase
        .from('referral_codes')
        .update({ code: newCode.toUpperCase() })
        .eq('user_id', user.id);

      if (error) throw error;

      setReferralCode(newCode.toUpperCase());
      setEditMode(false);
      toast.success("Referral code updated successfully!");
    } catch (error: any) {
      console.error('Error updating referral code:', error);
      toast.error("Failed to update code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const copyCode = async () => {
    setCopying(true);
    try {
      await navigator.clipboard.writeText(referralCode);
      toast.success("Referral code copied to clipboard!");
    } catch (error) {
      toast.error("Failed to copy code");
    } finally {
      setTimeout(() => setCopying(false), 1000);
    }
  };

  const shareUrl = `${window.location.origin}?ref=${referralCode}`;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{stats.total_referrals}</p>
                <p className="text-sm text-muted-foreground">Total Referrals</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">£{stats.total_revenue.toFixed(2)}</p>
                <p className="text-sm text-muted-foreground">Revenue Generated</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Gift className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">£{stats.total_credits.toFixed(2)}</p>
                <p className="text-sm text-muted-foreground">Available Credits</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Referral Code Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Gift className="h-5 w-5" />
            <span>Your Referral Code</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <p className="text-sm text-green-700 mb-2">
              <strong>How it works:</strong> Share your code with friends! They get 15% off their first order, 
              and you earn 15% store credit when they purchase.
            </p>
          </div>

          {editMode ? (
            <div className="space-y-4">
              <div>
                <Label htmlFor="newCode">Edit Your Referral Code</Label>
                <Input
                  id="newCode"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                  placeholder="Enter new code"
                  maxLength={20}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Code will be converted to uppercase. Max 20 characters.
                </p>
              </div>
              <div className="flex space-x-2">
                <Button onClick={handleUpdateCode} disabled={loading}>
                  {loading ? "Updating..." : "Update Code"}
                </Button>
                <Button variant="outline" onClick={() => setEditMode(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="flex-1 p-3 bg-gray-50 rounded-lg border">
                  <p className="font-mono text-lg font-bold">{referralCode}</p>
                </div>
                <Button
                  onClick={copyCode}
                  variant="outline"
                  size="icon"
                  disabled={copying}
                >
                  {copying ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              
              <div className="flex space-x-2">
                <Button onClick={() => setEditMode(true)} variant="outline">
                  Edit Code
                </Button>
                <Button onClick={copyCode} className="flex-1">
                  Copy Code
                </Button>
              </div>
            </div>
          )}

          <div className="border-t pt-4">
            <Label>Share Link</Label>
            <div className="flex items-center space-x-2 mt-1">
              <Input value={shareUrl} readOnly className="text-sm" />
              <Button
                onClick={() => navigator.clipboard.writeText(shareUrl)}
                variant="outline"
                size="icon"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReferralSystem;