import { supabase } from "@/integrations/supabase/client";

interface PackageImpact {
  id: string;
  package_id: string;
  package: {
    id: string;
    name: string;
    is_active: boolean | null;
  } | null;
}

interface SubscriptionImpact {
  id: string;
  user_id: string;
  status: string;
  meal_preferences: any;
}

interface DeliveryImpact {
  id: string;
  planned_delivery_date: string;
  meal_selections: any;
}

export interface MealImpact {
  packages: PackageImpact[];
  subscriptions: SubscriptionImpact[];
  deliveries: DeliveryImpact[];
  hasImpact: boolean;
  packageCount: number;
  subscriptionCount: number;
  deliveryCount: number;
}

export const useMealImpactCheck = () => {
  const checkMealImpact = async (mealId: string): Promise<MealImpact> => {
    try {
      // 1. Check package_meals - which packages contain this meal
      // First get the package_meal entries
      const { data: packageMeals, error: packageMealsError } = await supabase
        .from('package_meals')
        .select('id, package_id')
        .eq('meal_id', mealId);

      if (packageMealsError) {
        console.error('Error checking package_meals:', packageMealsError);
      }

      // Then get the package details for those package IDs
      const packageIds = (packageMeals || []).map(pm => pm.package_id);
      let packages: { id: string; name: string; is_active: boolean | null }[] = [];
      
      if (packageIds.length > 0) {
        const { data: packageData, error: packageError } = await supabase
          .from('packages')
          .select('id, name, is_active')
          .in('id', packageIds);
        
        if (packageError) {
          console.error('Error fetching packages:', packageError);
        } else {
          packages = packageData || [];
        }
      }

      // Map package_meals to include package info
      const packageImpact: PackageImpact[] = (packageMeals || []).map(pm => ({
        id: pm.id,
        package_id: pm.package_id,
        package: packages.find(p => p.id === pm.package_id) || null
      }));

      // 2. Check user_subscriptions with meal_preferences containing this meal
      // Since meal_preferences is JSONB, we need to fetch and filter client-side
      const { data: subscriptions, error: subError } = await supabase
        .from('user_subscriptions')
        .select('id, user_id, status, meal_preferences')
        .in('status', ['active', 'paused', 'trialing']);

      if (subError) {
        console.error('Error checking subscription impact:', subError);
      }

      // Filter subscriptions that have this meal in preferences
      const subscriptionImpact = (subscriptions || []).filter(sub => {
        if (!sub.meal_preferences) return false;
        const prefs = sub.meal_preferences as any;
        // Check various possible structures
        if (Array.isArray(prefs)) {
          return prefs.some(p => p.meal_id === mealId || p === mealId);
        }
        if (prefs.selected_meals && Array.isArray(prefs.selected_meals)) {
          return prefs.selected_meals.includes(mealId);
        }
        if (prefs.meals && Array.isArray(prefs.meals)) {
          return prefs.meals.some((m: any) => m.meal_id === mealId || m === mealId);
        }
        return false;
      });

      // 3. Check upcoming subscription_deliveries with this meal selected
      const today = new Date().toISOString().split('T')[0];
      const { data: deliveries, error: delError } = await supabase
        .from('subscription_deliveries')
        .select('id, planned_delivery_date, meal_selections')
        .gte('planned_delivery_date', today)
        .in('status', ['scheduled', 'pending', 'confirmed']);

      if (delError) {
        console.error('Error checking delivery impact:', delError);
      }

      // Filter deliveries that have this meal selected
      const deliveryImpact = (deliveries || []).filter(del => {
        if (!del.meal_selections) return false;
        const selections = del.meal_selections as any;
        if (Array.isArray(selections)) {
          return selections.some((s: any) => s.meal_id === mealId || s === mealId);
        }
        return false;
      });

      const subs = subscriptionImpact as SubscriptionImpact[];
      const dels = deliveryImpact as DeliveryImpact[];

      return {
        packages: packageImpact,
        subscriptions: subs,
        deliveries: dels,
        hasImpact: packageImpact.length > 0 || subs.length > 0 || dels.length > 0,
        packageCount: packageImpact.length,
        subscriptionCount: subs.length,
        deliveryCount: dels.length,
      };
    } catch (error) {
      console.error('Error in checkMealImpact:', error);
      return {
        packages: [],
        subscriptions: [],
        deliveries: [],
        hasImpact: false,
        packageCount: 0,
        subscriptionCount: 0,
        deliveryCount: 0,
      };
    }
  };

  return { checkMealImpact };
};
