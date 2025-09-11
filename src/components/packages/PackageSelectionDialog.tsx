import { useEffect, useMemo, useState } from "react";
import { MealPackage } from "./PackagesBar";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Minus, Plus, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Meal {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  image_url?: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pkg: MealPackage | null;
}

const CategoryColors: Record<string, string> = {
  breakfast: "bg-orange-100 text-orange-800 border-orange-200",
  lunch: "bg-blue-100 text-blue-800 border-blue-200",
  dinner: "bg-purple-100 text-purple-800 border-purple-200",
  snack: "bg-green-100 text-green-800 border-green-200",
};

const PackageSelectionDialog = ({ open, onOpenChange, pkg }: Props) => {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [selected, setSelected] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const totalSelected = useMemo(
    () => Object.values(selected).reduce((a, b) => a + b, 0),
    [selected]
  );

  useEffect(() => {
    if (open) {
      setSelected({});
      (async () => {
        setLoading(true);
        
        if (pkg) {
          // First get the meal IDs for this package
          const { data: packageMealData, error: packageError } = await supabase
            .from("package_meals")
            .select("meal_id")
            .eq("package_id", pkg.id);
            
          if (packageError) {
            console.error("Error fetching package meals:", packageError);
            setLoading(false);
            return;
          }
          
          // If no meals are assigned to this package, show all active meals
          if (!packageMealData || packageMealData.length === 0) {
            const { data, error } = await supabase
              .from("meals")
              .select("id,name,description,category,price,image_url")
              .eq("is_active", true)
              .order("category", { ascending: true })
              .order("name", { ascending: true });
            if (!error) setMeals((data || []) as Meal[]);
          } else {
            // Get the actual meal data for the assigned meals
            const mealIds = packageMealData.map(pm => pm.meal_id);
            const { data, error } = await supabase
              .from("meals")
              .select("id,name,description,category,price,image_url")
              .in("id", mealIds)
              .eq("is_active", true)
              .order("category", { ascending: true })
              .order("name", { ascending: true });
            if (!error) setMeals((data || []) as Meal[]);
          }
        }
        
        setLoading(false);
      })();
    }
  }, [open]);

  const inc = (id: string) => {
    if (!pkg) return;
    setSelected((prev) => {
      const current = prev[id] || 0;
      const nextTotal = totalSelected + 1;
      if (nextTotal > pkg.meal_count) return prev; // enforce limit
      return { ...prev, [id]: current + 1 };
    });
  };

  const dec = (id: string) => {
    setSelected((prev) => {
      const current = prev[id] || 0;
      const next = Math.max(0, current - 1);
      const { [id]: _, ...rest } = prev;
      return next > 0 ? { ...prev, [id]: next } : rest;
    });
  };

  const handleCheckout = async () => {
    if (!pkg) return;
    if (totalSelected !== pkg.meal_count) {
      toast({ title: "Select meals", description: `Please select exactly ${pkg.meal_count} meals.`, variant: "destructive" });
      return;
    }

    const summary = Object.entries(selected)
      .map(([id, qty]) => {
        const meal = meals.find((m) => m.id === id);
        return `${qty} x ${meal?.name ?? "Meal"}`;
      })
      .join(" | ");

    try {
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: {
          currency: 'gbp',
          items: [
            {
              name: `${pkg.meal_count} Meal Package`,
              amount: Math.round(pkg.price * 100),
              quantity: 1,
              description: summary,
            },
          ],
          delivery_fee: 299,
          successPath: '/payment-success',
          cancelPath: '/menu'
        }
      });
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (err: any) {
      console.error(err);
      toast({ title: 'Checkout error', description: err.message || 'Unable to start checkout', variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto pointer-events-auto">
        <DialogHeader>
          <DialogTitle>
            {pkg ? `Choose ${pkg.meal_count} meals for ${pkg.name}` : 'Choose Meals'}
          </DialogTitle>
        </DialogHeader>

        {/* Selection status */}
        <div className="flex items-center justify-between mb-4">
          <div className="text-muted-foreground">
            Selected: <span className="font-semibold text-foreground">{totalSelected}</span> / {pkg?.meal_count ?? 0}
          </div>
          <div className="flex items-center gap-2">
            {totalSelected === (pkg?.meal_count ?? 0) ? (
              <div className="text-green-600 flex items-center gap-1">
                <CheckCircle2 size={16} /> Ready to checkout
              </div>
            ) : (
              <div className="text-muted-foreground">Pick {((pkg?.meal_count ?? 0) - totalSelected)} more</div>
            )}
            <Button onClick={handleCheckout} disabled={!pkg || totalSelected !== (pkg?.meal_count ?? 0)}>
              Proceed to Checkout
            </Button>
          </div>
        </div>

        {/* Meals grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading && Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="h-40" />
          ))}
          {!loading && meals.map((meal) => {
            const qty = selected[meal.id] || 0;
            return (
              <Card key={meal.id} className="overflow-hidden">
                {meal.image_url && (
                  <div className="aspect-video w-full overflow-hidden">
                    <img src={meal.image_url} alt={meal.name} className="w-full h-full object-cover" />
                  </div>
                )}
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-base">{meal.name}</CardTitle>
                    <Badge className={CategoryColors[meal.category] || 'bg-gray-100 text-gray-800 border-gray-200'}>
                      {meal.category}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{meal.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="font-semibold">£{meal.price.toFixed(2)}</div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" onClick={() => dec(meal.id)} disabled={qty === 0}>
                        <Minus size={16} />
                      </Button>
                      <span className="w-6 text-center font-medium">{qty}</span>
                      <Button size="sm" onClick={() => inc(meal.id)} disabled={pkg ? totalSelected >= pkg.meal_count : true}>
                        <Plus size={16} />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PackageSelectionDialog;
