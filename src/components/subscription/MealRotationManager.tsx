import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Minus, Plus, RotateCcw, Save, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, addWeeks, addDays, isBefore, isAfter } from "date-fns";

interface SubscriptionDelivery {
  id: string;
  planned_delivery_date: string;
  status: string;
  meal_selections: any; // Using any to handle Json type from Supabase
  delivery_notes?: string;
}

interface Meal {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url?: string;
  total_calories: number;
  total_protein: number;
}

interface Props {
  subscription: any;
}

const MealRotationManager = ({ subscription }: Props) => {
  const [editingDelivery, setEditingDelivery] = useState<string | null>(null);
  const [mealSelections, setMealSelections] = useState<Record<string, Record<string, number>>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch upcoming deliveries
  const { data: deliveries, isLoading: deliveriesLoading } = useQuery({
    queryKey: ['subscription-deliveries', subscription?.id],
    queryFn: async () => {
      if (!subscription?.id) return [];
      
      const { data, error } = await supabase
        .from('subscription_deliveries')
        .select('*')
        .eq('user_subscription_id', subscription.id)
        .gte('planned_delivery_date', new Date().toISOString().split('T')[0])
        .order('planned_delivery_date', { ascending: true })
        .limit(6);

      if (error) throw error;
      return data || [];
    },
    enabled: !!subscription?.id,
  });

  // Fetch available meals
  const { data: meals } = useQuery({
    queryKey: ['available-meals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('meals')
        .select('id, name, description, price, image_url, total_calories, total_protein')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data || [];
    },
  });

  // Update meal selections mutation
  const updateMealSelections = useMutation({
    mutationFn: async ({ deliveryId, selections }: { deliveryId: string; selections: Record<string, number> }) => {
      const { error } = await supabase
        .from('subscription_deliveries')
        .update({ 
          meal_selections: selections,
          updated_at: new Date().toISOString()
        })
        .eq('id', deliveryId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-deliveries'] });
      toast({
        title: "Meals Updated",
        description: "Your meal selection has been saved successfully.",
      });
      setEditingDelivery(null);
    },
    onError: (error) => {
      console.error('Error updating meals:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update meal selection. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Generate missing deliveries mutation
  const generateDeliveries = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('generate-subscription-deliveries', {
        body: { subscription_id: subscription.id }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-deliveries'] });
      toast({
        title: "Deliveries Generated",
        description: "Upcoming deliveries have been scheduled.",
      });
    },
  });

  useEffect(() => {
    if (deliveries) {
      const selections: Record<string, Record<string, number>> = {};
      deliveries.forEach(delivery => {
        // Safely parse meal_selections from Json type
        const mealSelections = delivery.meal_selections;
        if (mealSelections && typeof mealSelections === 'object' && !Array.isArray(mealSelections)) {
          selections[delivery.id] = mealSelections as Record<string, number>;
        } else {
          selections[delivery.id] = {};
        }
      });
      setMealSelections(selections);
    }
  }, [deliveries]);

  const getDeliveryStatus = (delivery: SubscriptionDelivery) => {
    const deliveryDate = new Date(delivery.planned_delivery_date);
    const cutoffDate = addDays(deliveryDate, -2); // 2 days before delivery
    const now = new Date();
    
    if (isBefore(now, cutoffDate)) {
      return { canEdit: true, status: "editable", color: "bg-green-100 text-green-800" };
    } else if (isBefore(now, deliveryDate)) {
      return { canEdit: false, status: "locked", color: "bg-yellow-100 text-yellow-800" };
    } else {
      return { canEdit: false, status: delivery.status, color: "bg-gray-100 text-gray-800" };
    }
  };

  const getTotalSelected = (deliveryId: string) => {
    const selections = mealSelections[deliveryId] || {};
    return Object.values(selections).reduce((sum, qty) => sum + qty, 0);
  };

  const updateMealQuantity = (deliveryId: string, mealId: string, change: number) => {
    setMealSelections(prev => {
      const currentSelections = prev[deliveryId] || {};
      const currentQty = currentSelections[mealId] || 0;
      const newQty = Math.max(0, currentQty + change);
      const totalSelected = Object.values(currentSelections).reduce((sum, qty) => sum + qty, 0);
      
      // Don't allow exceeding meal count
      if (change > 0 && totalSelected >= subscription.subscription_plans.meal_count) {
        return prev;
      }

      const newSelections = { ...currentSelections };
      if (newQty === 0) {
        delete newSelections[mealId];
      } else {
        newSelections[mealId] = newQty;
      }

      return {
        ...prev,
        [deliveryId]: newSelections
      };
    });
  };

  const saveDeliveryMeals = (deliveryId: string) => {
    const selections = mealSelections[deliveryId] || {};
    const totalSelected = Object.values(selections).reduce((sum, qty) => sum + qty, 0);
    
    if (totalSelected !== subscription.subscription_plans.meal_count) {
      toast({
        title: "Invalid Selection",
        description: `Please select exactly ${subscription.subscription_plans.meal_count} meals.`,
        variant: "destructive",
      });
      return;
    }

    updateMealSelections.mutate({ deliveryId, selections });
  };

  const applyRotation = (fromDeliveryId: string, toDeliveryId: string) => {
    const sourceSelections = mealSelections[fromDeliveryId];
    if (!sourceSelections) return;

    setMealSelections(prev => ({
      ...prev,
      [toDeliveryId]: { ...sourceSelections }
    }));

    toast({
      title: "Meals Copied",
      description: "Meal selection has been copied from previous delivery.",
    });
  };

  if (deliveriesLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Upcoming Deliveries</h3>
          <p className="text-sm text-muted-foreground">
            Customize your meals for each delivery (changes allowed up to 2 days before delivery)
          </p>
        </div>
        {deliveries && deliveries.length < 3 && (
          <Button 
            variant="outline" 
            onClick={() => generateDeliveries.mutate()}
            disabled={generateDeliveries.isPending}
          >
            {generateDeliveries.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Calendar className="h-4 w-4 mr-2" />
            )}
            Generate More Deliveries
          </Button>
        )}
      </div>

      <div className="grid gap-4">
        {deliveries?.map((delivery, index) => {
          const status = getDeliveryStatus(delivery);
          const totalSelected = getTotalSelected(delivery.id);
          const isEditing = editingDelivery === delivery.id;
          
          return (
            <Card key={delivery.id} className={`${!status.canEdit ? 'opacity-75' : ''}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <CardTitle className="text-base">
                        Delivery #{index + 1}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(delivery.planned_delivery_date), 'EEEE, MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={status.color}>
                      {status.canEdit ? (
                        <>
                          <Clock className="h-3 w-3 mr-1" />
                          Can Edit
                        </>
                      ) : (
                        <>
                          <Clock className="h-3 w-3 mr-1" />
                          Locked
                        </>
                      )}
                    </Badge>
                    {status.canEdit && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingDelivery(isEditing ? null : delivery.id)}
                      >
                        {isEditing ? 'Cancel' : 'Edit Meals'}
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium">
                    Meals Selected: {totalSelected} / {subscription.subscription_plans.meal_count}
                  </span>
                  {index > 0 && status.canEdit && deliveries[index - 1] && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => applyRotation(deliveries[index - 1].id, delivery.id)}
                    >
                      <RotateCcw className="h-4 w-4 mr-1" />
                      Copy from Previous
                    </Button>
                  )}
                </div>

                {isEditing ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                      {meals?.map((meal) => {
                        const qty = mealSelections[delivery.id]?.[meal.id] || 0;
                        return (
                          <div key={meal.id} className="flex items-center gap-3 p-3 border rounded-lg">
                            {meal.image_url && (
                              <img 
                                src={meal.image_url} 
                                alt={meal.name}
                                className="w-12 h-12 object-cover rounded"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-sm truncate">{meal.name}</h4>
                              <p className="text-xs text-muted-foreground">
                                £{meal.price} • {meal.total_calories} cal
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateMealQuantity(delivery.id, meal.id, -1)}
                                disabled={qty === 0}
                                className="h-8 w-8 p-0"
                              >
                                <Minus size={12} />
                              </Button>
                              <span className="w-8 text-center text-sm font-medium">{qty}</span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateMealQuantity(delivery.id, meal.id, 1)}
                                disabled={totalSelected >= subscription.subscription_plans.meal_count}
                                className="h-8 w-8 p-0"
                              >
                                <Plus size={12} />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    
                    <div className="flex justify-end gap-2 pt-3 border-t">
                      <Button 
                        variant="outline" 
                        onClick={() => setEditingDelivery(null)}
                      >
                        Cancel
                      </Button>
                      <Button 
                        onClick={() => saveDeliveryMeals(delivery.id)}
                        disabled={updateMealSelections.isPending || totalSelected !== subscription.subscription_plans.meal_count}
                      >
                        {updateMealSelections.isPending ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4 mr-2" />
                        )}
                        Save Meals
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {Object.entries(mealSelections[delivery.id] || {}).length > 0 ? (
                      Object.entries(mealSelections[delivery.id] || {}).map(([mealId, quantity]) => {
                        const meal = meals?.find(m => m.id === mealId);
                        return meal ? (
                          <div key={mealId} className="flex items-center justify-between py-1">
                            <span className="text-sm">{meal.name}</span>
                            <Badge variant="outline">x{quantity}</Badge>
                          </div>
                        ) : null;
                      })
                    ) : (
                      <p className="text-sm text-muted-foreground italic">
                        No meals selected yet
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default MealRotationManager;