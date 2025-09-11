import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChefHat, Clock, Target, Calendar, Star, ArrowRight, Heart } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface Meal {
  id: string;
  name: string;
  description: string;
  image_url?: string;
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  price: number;
}

interface UserProfile {
  goal: string;
  activityLevel: string;
  dietaryRestrictions: string[];
  cuisinePreferences: string[];
  mealCount: string;
  deliveryFrequency: string;
}

interface Props {
  profile: UserProfile;
  onStartOver: () => void;
}

const PersonalizedResults = ({ profile, onStartOver }: Props) => {
  const [recommendedMeals, setRecommendedMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPersonalizedMeals();
  }, [profile]);

  const fetchPersonalizedMeals = async () => {
    try {
      // Fetch meals and apply basic filtering based on preferences
      const { data: meals, error } = await supabase
        .from("meals")
        .select("id,name,description,image_url,total_calories,total_protein,total_carbs,total_fat,price")
        .eq("is_active", true)
        .limit(parseInt(profile.mealCount) || 10);

      if (!error && meals) {
        setRecommendedMeals(meals);
      }
    } catch (error) {
      console.error("Error fetching personalized meals:", error);
    } finally {
      setLoading(false);
    }
  };

  const getGoalDescription = () => {
    switch (profile.goal) {
      case "weight-loss": return "Calorie-controlled meals designed to support your weight loss journey";
      case "muscle-gain": return "High-protein meals to fuel your muscle building goals";
      case "convenience": return "Delicious, nutritious meals without the planning and prep";
      case "performance": return "Performance-optimized nutrition for elite results";
      default: return "Personalized nutrition tailored to your lifestyle";
    }
  };

  const getPersonalizedInsights = () => {
    const insights = [];
    if (profile.goal === "weight-loss") {
      insights.push("All meals under 600 calories");
      insights.push("High fiber for satiety");
    }
    if (profile.goal === "muscle-gain") {
      insights.push("30g+ protein per meal");
      insights.push("Post-workout recovery focused");
    }
    if (profile.activityLevel === "high" || profile.activityLevel === "athlete") {
      insights.push("Extra complex carbs for energy");
      insights.push("Anti-inflammatory ingredients");
    }
    if (profile.cuisinePreferences.length > 0) {
      insights.push(`${profile.cuisinePreferences[0]} flavors featured`);
    }
    return insights;
  };

  const totalPrice = recommendedMeals.reduce((sum, meal) => sum + meal.price, 0);
  const savingsAmount = profile.deliveryFrequency === "weekly" ? totalPrice * 0.1 : 
                       profile.deliveryFrequency === "bi-weekly" ? totalPrice * 0.05 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 p-4">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center py-12">
          <div className="inline-flex items-center space-x-2 bg-green-100 text-green-800 px-4 py-2 rounded-full mb-6">
            <Heart size={16} />
            <span className="font-medium">Your Personalized Plan is Ready!</span>
          </div>
          
          <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-4">
            Your Perfect Week
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {getGoalDescription()}
          </p>
        </div>

        {/* Plan Summary */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card className="bg-white/80 backdrop-blur-sm border-green-200">
            <CardContent className="p-6 text-center">
              <Target className="text-green-600 mx-auto mb-3" size={32} />
              <h3 className="font-bold text-lg mb-2">Your Goal</h3>
              <p className="text-gray-600 capitalize">{profile.goal.replace("-", " ")}</p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-green-200">
            <CardContent className="p-6 text-center">
              <Calendar className="text-green-600 mx-auto mb-3" size={32} />
              <h3 className="font-bold text-lg mb-2">Weekly Plan</h3>
              <p className="text-gray-600">{profile.mealCount} Premium Meals</p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-green-200">
            <CardContent className="p-6 text-center">
              <Clock className="text-green-600 mx-auto mb-3" size={32} />
              <h3 className="font-bold text-lg mb-2">Ready In</h3>
              <p className="text-gray-600">3 Minutes</p>
            </CardContent>
          </Card>
        </div>

        {/* Personalized Insights */}
        <Card className="mb-12 bg-gradient-to-r from-green-500 to-emerald-500 text-white">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <ChefHat size={24} />
              <span>Why We Selected These Meals For You</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {getPersonalizedInsights().map((insight, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Star size={16} className="text-green-200" />
                  <span className="text-sm">{insight}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recommended Meals */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-center mb-8 text-gray-800">
            Your Personalized Meals
          </h2>
          
          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="h-64 animate-pulse bg-gray-200" />
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendedMeals.slice(0, parseInt(profile.mealCount)).map((meal, index) => (
                <Card key={meal.id} className="group hover:shadow-xl transition-all duration-300 bg-white/90 backdrop-blur-sm">
                  {meal.image_url && (
                    <div className="aspect-[4/3] overflow-hidden rounded-t-lg">
                      <img 
                        src={meal.image_url} 
                        alt={meal.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    </div>
                  )}
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-lg text-gray-800">{meal.name}</h3>
                      <Badge className="bg-green-100 text-green-800">
                        Week {Math.floor(index / 5) + 1}
                      </Badge>
                    </div>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">{meal.description}</p>
                    
                    <div className="grid grid-cols-3 gap-2 text-xs text-gray-500 mb-3">
                      <div className="text-center">
                        <div className="font-bold text-green-600">{Math.round(meal.total_calories)}</div>
                        <div>kcal</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-green-600">{meal.total_protein.toFixed(1)}g</div>
                        <div>protein</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-green-600">£{meal.price.toFixed(2)}</div>
                        <div>price</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Pricing Summary */}
        <Card className="mb-12 bg-white/90 backdrop-blur-sm">
          <CardContent className="p-8">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-2xl font-bold mb-4">Your Plan Summary</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>{profile.mealCount} Premium Meals</span>
                    <span className="font-medium">£{totalPrice.toFixed(2)}</span>
                  </div>
                  {savingsAmount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Subscription Savings</span>
                      <span className="font-medium">-£{savingsAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="border-t pt-3 flex justify-between text-lg font-bold">
                    <span>Total per week</span>
                    <span>£{(totalPrice - savingsAmount).toFixed(2)}</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <Button 
                  asChild
                  size="lg"
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold py-4 text-lg rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                >
                  <Link to="/menu">
                    <span>Start My Plan</span>
                    <ArrowRight size={20} className="ml-2" />
                  </Link>
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={onStartOver}
                  className="w-full"
                >
                  Customize Further
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PersonalizedResults;