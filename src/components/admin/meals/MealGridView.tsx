import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Calculator, Edit, ImageIcon } from "lucide-react";
import { ClickableStatusBadge } from "@/components/common";
import CategoryTag from "@/components/CategoryTag";
import type { Meal } from "@/types/meal";

interface MealGridViewProps {
  meals: Meal[];
  onToggleActive: (meal: Meal) => void;
  onViewMeal: (mealId: string) => void;
  onBuildMeal: (mealId: string) => void;
  onEditMeal: (mealId: string) => void;
}

export function MealGridView({ 
  meals, 
  onToggleActive, 
  onViewMeal, 
  onBuildMeal, 
  onEditMeal 
}: MealGridViewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {meals.map((meal) => (
        <Card 
          key={meal.id} 
          className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow" 
          onClick={() => onViewMeal(meal.id)}
        >
          <div className="relative h-48">
            {meal.image_url ? (
              <img
                src={meal.image_url}
                alt={meal.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center">
                <ImageIcon className="h-12 w-12 text-muted-foreground" />
              </div>
            )}
            <div className="absolute top-2 right-2">
              <ClickableStatusBadge
                item={meal}
                isActive={meal.is_active ?? false}
                itemName={meal.name}
                onToggle={onToggleActive}
              />
            </div>
          </div>
          
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex items-start justify-between">
                <h3 className="font-semibold line-clamp-1">{meal.name}</h3>
                <span className="font-bold text-primary">£{meal.price?.toFixed(2)}</span>
              </div>
              
              {meal.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">{meal.description}</p>
              )}
              
              <CategoryTag category={meal.category} />
              
              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <span>Cal: {Math.round(meal.total_calories ?? 0)}</span>
                <span>Protein: {(meal.total_protein ?? 0).toFixed(1)}g</span>
                <span>Carbs: {(meal.total_carbs ?? 0).toFixed(1)}g</span>
                <span>Fat: {(meal.total_fat ?? 0).toFixed(1)}g</span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-3">
                <TooltipProvider delayDuration={0}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="default"
                        variant="outline"
                        onClick={(e) => { e.stopPropagation(); onBuildMeal(meal.id); }}
                        className="flex items-center gap-2 h-10 px-3 flex-1"
                      >
                        <Calculator className="h-4 w-4" />
                        <span className="text-sm">Build</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Edit nutrition & ingredients</TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider delayDuration={0}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="default"
                        variant="outline"
                        onClick={(e) => { e.stopPropagation(); onEditMeal(meal.id); }}
                        className="flex items-center gap-2 h-10 px-3 flex-1"
                      >
                        <Edit className="h-4 w-4" />
                        <span className="text-sm">Edit</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Edit meal details</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}