import { supabase } from "@/integrations/supabase/client";
import type { MealImpact } from "@/hooks/useMealImpactCheck";

export interface ReplacementOptions {
  mealId: string;
  replaceInPackages: boolean;
  packageReplacementMealId: string | null;
  replaceInSubscriptions: boolean;
  subscriptionReplacementMealId: string | null;
}

export interface ReplacementResult {
  packagesUpdated: number;
  subscriptionsUpdated: number;
  deliveriesUpdated: number;
  errors: string[];
}

export const executeMealReplacement = async (
  options: ReplacementOptions,
  impact: MealImpact
): Promise<ReplacementResult> => {
  const result: ReplacementResult = {
    packagesUpdated: 0,
    subscriptionsUpdated: 0,
    deliveriesUpdated: 0,
    errors: [],
  };

  // 1. Handle package replacements
  if (options.replaceInPackages && options.packageReplacementMealId && impact.packages.length > 0) {
    try {
      // Get unique package IDs
      const packageIds = [...new Set(impact.packages.map(p => p.package_id))];
      
      for (const packageId of packageIds) {
        // Check if replacement meal already exists in this package
        const { data: existing } = await supabase
          .from('package_meals')
          .select('id')
          .eq('package_id', packageId)
          .eq('meal_id', options.packageReplacementMealId)
          .single();

        if (existing) {
          // Replacement meal already in package, just delete the old one
          const { error: deleteError } = await supabase
            .from('package_meals')
            .delete()
            .eq('package_id', packageId)
            .eq('meal_id', options.mealId);

          if (deleteError) {
            result.errors.push(`Failed to remove meal from package: ${deleteError.message}`);
          } else {
            result.packagesUpdated++;
          }
        } else {
          // Update the meal_id to the replacement
          const { error: updateError } = await supabase
            .from('package_meals')
            .update({ meal_id: options.packageReplacementMealId })
            .eq('package_id', packageId)
            .eq('meal_id', options.mealId);

          if (updateError) {
            result.errors.push(`Failed to update package meal: ${updateError.message}`);
          } else {
            result.packagesUpdated++;
          }
        }
      }
    } catch (error: any) {
      result.errors.push(`Package replacement error: ${error.message}`);
    }
  }

  // 2. Handle subscription replacements
  if (options.replaceInSubscriptions && options.subscriptionReplacementMealId && impact.subscriptions.length > 0) {
    try {
      for (const sub of impact.subscriptions) {
        let updatedPrefs = sub.meal_preferences;
        
        // Handle various meal_preferences structures
        if (Array.isArray(updatedPrefs)) {
          updatedPrefs = updatedPrefs.map((p: any) => {
            if (p === options.mealId) return options.subscriptionReplacementMealId;
            if (p.meal_id === options.mealId) return { ...p, meal_id: options.subscriptionReplacementMealId };
            return p;
          });
        } else if (updatedPrefs && typeof updatedPrefs === 'object') {
          if (updatedPrefs.selected_meals && Array.isArray(updatedPrefs.selected_meals)) {
            updatedPrefs.selected_meals = updatedPrefs.selected_meals.map((m: string) =>
              m === options.mealId ? options.subscriptionReplacementMealId : m
            );
          }
          if (updatedPrefs.meals && Array.isArray(updatedPrefs.meals)) {
            updatedPrefs.meals = updatedPrefs.meals.map((m: any) => {
              if (m === options.mealId) return options.subscriptionReplacementMealId;
              if (m.meal_id === options.mealId) return { ...m, meal_id: options.subscriptionReplacementMealId };
              return m;
            });
          }
        }

        const { error } = await supabase
          .from('user_subscriptions')
          .update({ meal_preferences: updatedPrefs })
          .eq('id', sub.id);

        if (error) {
          result.errors.push(`Failed to update subscription ${sub.id}: ${error.message}`);
        } else {
          result.subscriptionsUpdated++;
        }
      }

      // Also update upcoming deliveries for these subscriptions
      for (const delivery of impact.deliveries) {
        let updatedSelections = delivery.meal_selections;
        
        if (Array.isArray(updatedSelections)) {
          updatedSelections = updatedSelections.map((s: any) => {
            if (s === options.mealId) return options.subscriptionReplacementMealId;
            if (s.meal_id === options.mealId) return { ...s, meal_id: options.subscriptionReplacementMealId };
            return s;
          });

          const { error } = await supabase
            .from('subscription_deliveries')
            .update({ meal_selections: updatedSelections })
            .eq('id', delivery.id);

          if (error) {
            result.errors.push(`Failed to update delivery ${delivery.id}: ${error.message}`);
          } else {
            result.deliveriesUpdated++;
          }
        }
      }
    } catch (error: any) {
      result.errors.push(`Subscription replacement error: ${error.message}`);
    }
  }

  return result;
};

// Helper to get unique package names from impact
export const getAffectedPackageNames = (impact: MealImpact): string[] => {
  const uniquePackages = new Map<string, string>();
  impact.packages.forEach(p => {
    if (p.package?.name) {
      uniquePackages.set(p.package_id, p.package.name);
    }
  });
  return Array.from(uniquePackages.values());
};
