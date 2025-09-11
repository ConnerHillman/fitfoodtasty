import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface Meal {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  total_fiber: number;
  image_url?: string;
}

interface MealCardProps {
  meal: Meal;
  onAddToCart?: (meal: Meal) => void;
  showNutrition?: boolean;
}

const MealCard = ({ meal, onAddToCart, showNutrition = true }: MealCardProps) => {
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'breakfast': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'lunch': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'dinner': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'snack': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Card className="h-full hover:shadow-lg transition-shadow">
      {meal.image_url && (
        <div className="aspect-video w-full overflow-hidden rounded-t-lg">
          <img 
            src={meal.image_url} 
            alt={meal.name}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-xl">{meal.name}</CardTitle>
            <CardDescription className="mt-1">
              {meal.description}
            </CardDescription>
          </div>
          <Badge className={getCategoryColor(meal.category)}>
            {meal.category}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {showNutrition && (
          <>
            <div className="bg-muted/50 rounded-lg p-4">
              <h4 className="font-semibold text-sm mb-2">Nutritional Information</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Calories:</span>
                  <span className="font-medium">{Math.round(meal.total_calories)} kcal</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Protein:</span>
                  <span className="font-medium">{meal.total_protein?.toFixed(1) || '0'}g</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Carbs:</span>
                  <span className="font-medium">{meal.total_carbs?.toFixed(1) || '0'}g</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fat:</span>
                  <span className="font-medium">{meal.total_fat?.toFixed(1) || '0'}g</span>
                </div>
                {meal.total_fiber > 0 && (
                  <div className="flex justify-between col-span-2">
                    <span className="text-muted-foreground">Fiber:</span>
                    <span className="font-medium">{meal.total_fiber?.toFixed(1)}g</span>
                  </div>
                )}
              </div>
            </div>
            <Separator />
          </>
        )}

        <div className="flex justify-between items-center">
          <div className="text-2xl font-bold text-primary">
            £{meal.price?.toFixed(2) || '0.00'}
          </div>
          {onAddToCart && (
            <Button onClick={() => onAddToCart(meal)}>
              Add to Cart
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default MealCard;