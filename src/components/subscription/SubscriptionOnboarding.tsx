import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Heart, 
  Leaf, 
  Wheat, 
  Beef, 
  Fish, 
  ChefHat, 
  ArrowRight,
  Star,
  Users
} from "lucide-react";

interface DietaryPreference {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
}

interface SubscriptionOnboardingProps {
  onComplete: (preferences: {
    dietaryPreferences: string[];
    servingSize: string;
    mealTypes: string[];
  }) => void;
  onSkip: () => void;
}

const SubscriptionOnboarding: React.FC<SubscriptionOnboardingProps> = ({
  onComplete,
  onSkip,
}) => {
  const [step, setStep] = useState(1);
  const [dietaryPreferences, setDietaryPreferences] = useState<string[]>([]);
  const [servingSize, setServingSize] = useState<string>("");
  const [mealTypes, setMealTypes] = useState<string[]>([]);

  const dietaryOptions: DietaryPreference[] = [
    {
      id: "vegetarian",
      name: "Vegetarian",
      icon: <Leaf className="h-5 w-5" />,
      description: "No meat or fish"
    },
    {
      id: "vegan",
      name: "Vegan",
      icon: <Heart className="h-5 w-5" />,
      description: "Plant-based only"
    },
    {
      id: "gluten-free",
      name: "Gluten-Free",
      icon: <Wheat className="h-5 w-5" />,
      description: "No gluten-containing ingredients"
    },
    {
      id: "high-protein",
      name: "High Protein",
      icon: <Beef className="h-5 w-5" />,
      description: "Protein-rich meals"
    },
    {
      id: "pescatarian",
      name: "Pescatarian",
      icon: <Fish className="h-5 w-5" />,
      description: "Fish but no meat"
    },
    {
      id: "keto",
      name: "Keto",
      icon: <ChefHat className="h-5 w-5" />,
      description: "Low-carb, high-fat"
    }
  ];

  const mealTypeOptions = [
    { id: "breakfast", name: "Breakfast", icon: "🌅" },
    { id: "lunch", name: "Lunch", icon: "🥙" },
    { id: "dinner", name: "Dinner", icon: "🍽️" },
    { id: "snacks", name: "Snacks", icon: "🍎" },
  ];

  const handleDietaryChange = (preferenceId: string, checked: boolean) => {
    if (checked) {
      setDietaryPreferences(prev => [...prev, preferenceId]);
    } else {
      setDietaryPreferences(prev => prev.filter(id => id !== preferenceId));
    }
  };

  const handleMealTypeChange = (typeId: string, checked: boolean) => {
    if (checked) {
      setMealTypes(prev => [...prev, typeId]);
    } else {
      setMealTypes(prev => prev.filter(id => id !== typeId));
    }
  };

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      onComplete({
        dietaryPreferences,
        servingSize,
        mealTypes,
      });
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1: return true; // Dietary preferences are optional
      case 2: return servingSize !== "";
      case 3: return mealTypes.length > 0;
      default: return false;
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-amber-500" />
            Personalize Your Subscription
          </CardTitle>
          <Badge variant="outline">Step {step} of 3</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Dietary Preferences</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Select any dietary preferences to help us recommend the best meals for you.
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {dietaryOptions.map((option) => (
                <div key={option.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50">
                  <Checkbox
                    id={option.id}
                    checked={dietaryPreferences.includes(option.id)}
                    onCheckedChange={(checked) => handleDietaryChange(option.id, !!checked)}
                  />
                  <div className="flex-1">
                    <Label htmlFor={option.id} className="flex items-center gap-2 cursor-pointer">
                      {option.icon}
                      <div>
                        <div className="font-medium">{option.name}</div>
                        <div className="text-xs text-muted-foreground">{option.description}</div>
                      </div>
                    </Label>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Serving Size</h3>
              <p className="text-muted-foreground text-sm mb-4">
                How many people will you typically be feeding?
              </p>
            </div>
            
            <Select value={servingSize} onValueChange={setServingSize}>
              <SelectTrigger>
                <SelectValue placeholder="Select serving size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>Just me (1 person)</span>
                  </div>
                </SelectItem>
                <SelectItem value="2">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>Couple (2 people)</span>
                  </div>
                </SelectItem>
                <SelectItem value="3-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>Small family (3-4 people)</span>
                  </div>
                </SelectItem>
                <SelectItem value="5+">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>Large family (5+ people)</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Meal Types</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Which meal types would you like to include in your subscription?
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {mealTypeOptions.map((option) => (
                <div key={option.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50">
                  <Checkbox
                    id={option.id}
                    checked={mealTypes.includes(option.id)}
                    onCheckedChange={(checked) => handleMealTypeChange(option.id, !!checked)}
                  />
                  <Label htmlFor={option.id} className="flex items-center gap-2 cursor-pointer">
                    <span className="text-lg">{option.icon}</span>
                    <span className="font-medium">{option.name}</span>
                  </Label>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Progress indicator */}
        <div className="flex justify-center gap-2 pt-4">
          {[1, 2, 3].map((stepNumber) => (
            <div
              key={stepNumber}
              className={`w-2 h-2 rounded-full ${
                stepNumber <= step ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex justify-between pt-4">
          <Button variant="ghost" onClick={onSkip}>
            Skip for now
          </Button>
          <Button onClick={handleNext} disabled={!canProceed()}>
            {step === 3 ? "Complete Setup" : "Next"}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SubscriptionOnboarding;