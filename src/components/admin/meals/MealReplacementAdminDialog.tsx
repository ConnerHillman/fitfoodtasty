import { useState, useEffect } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertTriangle, Package, Users, CalendarDays, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useMealImpactCheck, type MealImpact } from "@/hooks/useMealImpactCheck";
import { executeMealReplacement, getAffectedPackageNames } from "@/lib/mealReplacement";

interface MealReplacementAdminDialogProps {
  isOpen: boolean;
  onClose: () => void;
  mealId: string;
  mealName: string;
  actionType: 'deactivate' | 'delete';
  onConfirm: () => void;
}

interface ActiveMeal {
  id: string;
  name: string;
  category: string | null;
}

export const MealReplacementAdminDialog = ({
  isOpen,
  onClose,
  mealId,
  mealName,
  actionType,
  onConfirm,
}: MealReplacementAdminDialogProps) => {
  const { toast } = useToast();
  const { checkMealImpact } = useMealImpactCheck();
  
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [impact, setImpact] = useState<MealImpact | null>(null);
  const [activeMeals, setActiveMeals] = useState<ActiveMeal[]>([]);
  
  // Replacement options
  const [replaceInPackages, setReplaceInPackages] = useState(false);
  const [packageReplacementMealId, setPackageReplacementMealId] = useState<string>("");
  const [replaceInSubscriptions, setReplaceInSubscriptions] = useState(false);
  const [subscriptionReplacementMealId, setSubscriptionReplacementMealId] = useState<string>("");

  // Fetch impact and available meals when dialog opens
  useEffect(() => {
    if (isOpen && mealId) {
      fetchData();
    }
  }, [isOpen, mealId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Check impact
      const impactResult = await checkMealImpact(mealId);
      setImpact(impactResult);

      // Fetch active meals for replacement options (excluding current meal)
      const { data: meals, error } = await supabase
        .from('meals')
        .select('id, name, category')
        .eq('is_active', true)
        .neq('id', mealId)
        .order('name');

      if (error) throw error;
      setActiveMeals(meals || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to check meal usage",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    // Validate selections
    if (replaceInPackages && !packageReplacementMealId) {
      toast({
        title: "Selection Required",
        description: "Please select a replacement meal for packages",
        variant: "destructive",
      });
      return;
    }

    if (replaceInSubscriptions && !subscriptionReplacementMealId) {
      toast({
        title: "Selection Required",
        description: "Please select a replacement meal for subscriptions",
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);
    try {
      // Execute replacements if any
      if ((replaceInPackages || replaceInSubscriptions) && impact) {
        const result = await executeMealReplacement(
          {
            mealId,
            replaceInPackages,
            packageReplacementMealId: packageReplacementMealId || null,
            replaceInSubscriptions,
            subscriptionReplacementMealId: subscriptionReplacementMealId || null,
          },
          impact
        );

        if (result.errors.length > 0) {
          console.error('Replacement errors:', result.errors);
          toast({
            title: "Warning",
            description: `Completed with ${result.errors.length} error(s). Check console for details.`,
            variant: "destructive",
          });
        } else {
          const updates: string[] = [];
          if (result.packagesUpdated > 0) {
            updates.push(`${result.packagesUpdated} package(s)`);
          }
          if (result.subscriptionsUpdated > 0) {
            updates.push(`${result.subscriptionsUpdated} subscription(s)`);
          }
          if (result.deliveriesUpdated > 0) {
            updates.push(`${result.deliveriesUpdated} delivery(ies)`);
          }
          
          if (updates.length > 0) {
            toast({
              title: "Replacements Complete",
              description: `Updated ${updates.join(', ')}`,
            });
          }
        }
      }

      // Execute the original action (deactivate/delete)
      onConfirm();
      onClose();
    } catch (error: any) {
      console.error('Error during confirmation:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to complete action",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleCancel = () => {
    // Reset state
    setReplaceInPackages(false);
    setPackageReplacementMealId("");
    setReplaceInSubscriptions(false);
    setSubscriptionReplacementMealId("");
    onClose();
  };

  const affectedPackageNames = impact ? getAffectedPackageNames(impact) : [];
  const hasNoImpact = impact && !impact.hasImpact;

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
      <AlertDialogContent className="max-w-lg" onClick={(e) => e.stopPropagation()}>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            {actionType === 'deactivate' ? 'Deactivate' : 'Delete'} "{mealName}"
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-muted-foreground">Checking usage...</span>
                </div>
              ) : hasNoImpact ? (
                <Alert>
                  <AlertDescription>
                    This meal is not currently used in any packages or subscriptions.
                    You can safely {actionType} it.
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  {/* Impact Summary */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-foreground">This meal is used in:</p>
                    <div className="grid grid-cols-3 gap-2">
                      {impact && impact.packageCount > 0 && (
                        <div className="flex items-center gap-2 p-2 rounded-md bg-muted">
                          <Package className="h-4 w-4 text-blue-500" />
                          <div>
                            <div className="font-medium text-foreground">{impact.packageCount}</div>
                            <div className="text-xs text-muted-foreground">
                              {impact.packageCount === 1 ? 'Package' : 'Packages'}
                            </div>
                          </div>
                        </div>
                      )}
                      {impact && impact.subscriptionCount > 0 && (
                        <div className="flex items-center gap-2 p-2 rounded-md bg-muted">
                          <Users className="h-4 w-4 text-green-500" />
                          <div>
                            <div className="font-medium text-foreground">{impact.subscriptionCount}</div>
                            <div className="text-xs text-muted-foreground">
                              {impact.subscriptionCount === 1 ? 'Subscription' : 'Subscriptions'}
                            </div>
                          </div>
                        </div>
                      )}
                      {impact && impact.deliveryCount > 0 && (
                        <div className="flex items-center gap-2 p-2 rounded-md bg-muted">
                          <CalendarDays className="h-4 w-4 text-orange-500" />
                          <div>
                            <div className="font-medium text-foreground">{impact.deliveryCount}</div>
                            <div className="text-xs text-muted-foreground">
                              {impact.deliveryCount === 1 ? 'Delivery' : 'Deliveries'}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Show affected package names */}
                    {affectedPackageNames.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {affectedPackageNames.map(name => (
                          <Badge key={name} variant="secondary" className="text-xs">
                            {name}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Package Replacement Option */}
                  {impact && impact.packageCount > 0 && (
                    <div className="space-y-3 p-3 rounded-lg border bg-card">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="replace-packages" className="text-sm font-medium">
                          Replace in packages
                        </Label>
                        <Switch
                          id="replace-packages"
                          checked={replaceInPackages}
                          onCheckedChange={setReplaceInPackages}
                        />
                      </div>
                      {replaceInPackages && (
                        <Select
                          value={packageReplacementMealId}
                          onValueChange={setPackageReplacementMealId}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select replacement meal..." />
                          </SelectTrigger>
                          <SelectContent>
                            {activeMeals.map(meal => (
                              <SelectItem key={meal.id} value={meal.id}>
                                {meal.name} {meal.category && `(${meal.category})`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  )}

                  {/* Subscription Replacement Option */}
                  {impact && (impact.subscriptionCount > 0 || impact.deliveryCount > 0) && (
                    <div className="space-y-3 p-3 rounded-lg border bg-card">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="replace-subscriptions" className="text-sm font-medium">
                          Replace in subscriptions & deliveries
                        </Label>
                        <Switch
                          id="replace-subscriptions"
                          checked={replaceInSubscriptions}
                          onCheckedChange={setReplaceInSubscriptions}
                        />
                      </div>
                      {replaceInSubscriptions && (
                        <Select
                          value={subscriptionReplacementMealId}
                          onValueChange={setSubscriptionReplacementMealId}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select replacement meal..." />
                          </SelectTrigger>
                          <SelectContent>
                            {activeMeals.map(meal => (
                              <SelectItem key={meal.id} value={meal.id}>
                                {meal.name} {meal.category && `(${meal.category})`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  )}

                  {/* Warning for unchecked options */}
                  {impact && impact.hasImpact && (!replaceInPackages || !replaceInSubscriptions) && (
                    <Alert variant="destructive" className="border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-400">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription className="text-sm">
                        {!replaceInPackages && impact.packageCount > 0 && (
                          <span>Packages will keep the inactive meal. </span>
                        )}
                        {!replaceInSubscriptions && (impact.subscriptionCount > 0 || impact.deliveryCount > 0) && (
                          <span>Subscriptions may be affected.</span>
                        )}
                      </AlertDescription>
                    </Alert>
                  )}
                </>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={processing}>
            Cancel
          </Button>
          <Button
            variant={actionType === 'delete' ? 'destructive' : 'default'}
            onClick={handleConfirm}
            disabled={loading || processing}
          >
            {processing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {actionType === 'deactivate' ? 'Deactivate' : 'Delete'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
