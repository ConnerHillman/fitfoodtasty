import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Minus } from 'lucide-react';

interface MealItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  ingredients: string[];
  allergens: string[];
  image?: string;
}

const sampleMeals: MealItem[] = [
  {
    id: '1',
    name: 'Grilled Chicken Bowl',
    description: 'Perfectly seasoned grilled chicken with quinoa, roasted vegetables, and tahini sauce',
    price: 12.99,
    category: 'Protein Bowls',
    calories: 450,
    protein: 35,
    carbs: 42,
    fat: 12,
    ingredients: ['Chicken breast', 'Quinoa', 'Broccoli', 'Sweet potato', 'Tahini sauce'],
    allergens: ['Sesame'],
  },
  {
    id: '2',
    name: 'Mediterranean Salmon',
    description: 'Wild-caught salmon with Mediterranean herbs, brown rice, and seasonal vegetables',
    price: 15.99,
    category: 'Seafood',
    calories: 520,
    protein: 38,
    carbs: 45,
    fat: 18,
    ingredients: ['Salmon fillet', 'Brown rice', 'Zucchini', 'Bell peppers', 'Olive oil', 'Herbs'],
    allergens: ['Fish'],
  },
  {
    id: '3',
    name: 'Vegan Buddha Bowl',
    description: 'Plant-based bowl with chickpeas, kale, sweet potato, and creamy avocado dressing',
    price: 11.99,
    category: 'Plant-Based',
    calories: 380,
    protein: 15,
    carbs: 52,
    fat: 14,
    ingredients: ['Chickpeas', 'Kale', 'Sweet potato', 'Avocado', 'Quinoa', 'Hemp seeds'],
    allergens: [],
  },
];

const Menu = () => {
  const [cart, setCart] = useState<Record<string, number>>({});
  const categories = ['All', ...Array.from(new Set(sampleMeals.map(meal => meal.category)))];

  const addToCart = (mealId: string) => {
    setCart(prev => ({
      ...prev,
      [mealId]: (prev[mealId] || 0) + 1
    }));
  };

  const removeFromCart = (mealId: string) => {
    setCart(prev => {
      const newCart = { ...prev };
      if (newCart[mealId] > 1) {
        newCart[mealId]--;
      } else {
        delete newCart[mealId];
      }
      return newCart;
    });
  };

  const getCartQuantity = (mealId: string) => cart[mealId] || 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-2">Fresh Meal Menu</h1>
        <p className="text-muted-foreground text-lg">Choose from our selection of nutritious, chef-prepared meals</p>
      </div>

      <Tabs defaultValue="All" className="mb-8">
        <TabsList className="grid w-full grid-cols-4">
          {categories.map((category) => (
            <TabsTrigger key={category} value={category} className="text-sm">
              {category}
            </TabsTrigger>
          ))}
        </TabsList>

        {categories.map((category) => (
          <TabsContent key={category} value={category} className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sampleMeals
                .filter(meal => category === 'All' || meal.category === category)
                .map((meal) => (
                  <Card key={meal.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="h-48 bg-gradient-to-br from-primary/10 to-primary/20 flex items-center justify-center">
                      <span className="text-6xl">🍽️</span>
                    </div>
                    
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-xl">{meal.name}</CardTitle>
                        <Badge variant="secondary">${meal.price}</Badge>
                      </div>
                      <CardDescription>{meal.description}</CardDescription>
                    </CardHeader>

                    <CardContent>
                      <div className="grid grid-cols-4 gap-2 mb-4 text-center">
                        <div>
                          <div className="text-sm font-medium">{meal.calories}</div>
                          <div className="text-xs text-muted-foreground">Cal</div>
                        </div>
                        <div>
                          <div className="text-sm font-medium">{meal.protein}g</div>
                          <div className="text-xs text-muted-foreground">Protein</div>
                        </div>
                        <div>
                          <div className="text-sm font-medium">{meal.carbs}g</div>
                          <div className="text-xs text-muted-foreground">Carbs</div>
                        </div>
                        <div>
                          <div className="text-sm font-medium">{meal.fat}g</div>
                          <div className="text-xs text-muted-foreground">Fat</div>
                        </div>
                      </div>

                      {meal.allergens.length > 0 && (
                        <div className="mb-4">
                          <div className="text-xs text-muted-foreground mb-1">Contains:</div>
                          <div className="flex flex-wrap gap-1">
                            {meal.allergens.map((allergen) => (
                              <Badge key={allergen} variant="outline" className="text-xs">
                                {allergen}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>

                    <CardFooter>
                      {getCartQuantity(meal.id) === 0 ? (
                        <Button onClick={() => addToCart(meal.id)} className="w-full">
                          Add to Cart
                        </Button>
                      ) : (
                        <div className="flex items-center justify-between w-full">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeFromCart(meal.id)}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="font-medium">{getCartQuantity(meal.id)}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => addToCart(meal.id)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </CardFooter>
                  </Card>
                ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default Menu;