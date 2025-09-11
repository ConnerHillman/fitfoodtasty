import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowRight, ArrowLeft, Target, Activity, UtensilsCrossed, Heart, Zap, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface OnboardingStep {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ComponentType<any>;
}

interface MealPackage {
  id: string;
  name: string;
  description: string;
  meal_count: number;
  price: number;
  is_active: boolean;
}

interface UserProfile {
  goal: string;
  activityLevel: string;
  dietaryRestrictions: string[];
  cuisinePreferences: string[];
  selectedPackageId: string;
  deliveryFrequency: string;
}

const steps: OnboardingStep[] = [
  {
    id: "goal",
    title: "What's Your Goal?",
    subtitle: "Help us personalize your perfect meal plan",
    icon: Target
  },
  {
    id: "lifestyle",
    title: "How Active Are You?",
    subtitle: "Tell us about your activity level",
    icon: Activity
  },
  {
    id: "restrictions",
    title: "Dietary Preferences",
    subtitle: "Any dietary restrictions we should know about?",
    icon: Heart
  },
  {
    id: "preferences",
    title: "Food Preferences",
    subtitle: "What flavors and cuisines do you love?",
    icon: UtensilsCrossed
  },
  {
    id: "plan",
    title: "Your Meal Plan",
    subtitle: "Choose your perfect weekly setup",
    icon: Zap
  }
];

interface Props {
  onComplete: (profile: UserProfile) => void;
  onClose: () => void;
}

const PremiumOnboarding = ({ onComplete, onClose }: Props) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [packages, setPackages] = useState<MealPackage[]>([]);
  const [loadingPackages, setLoadingPackages] = useState(true);
  const [selectedOption, setSelectedOption] = useState<string>("");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({
    goal: "",
    activityLevel: "",
    dietaryRestrictions: [],
    cuisinePreferences: [],
    selectedPackageId: "",
    deliveryFrequency: ""
  });

  // Fetch packages from database
  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const { data, error } = await supabase
          .from("packages")
          .select("id, name, description, meal_count, price, is_active")
          .eq("is_active", true)
          .order("meal_count", { ascending: true });

        if (!error && data) {
          setPackages(data);
        }
      } catch (error) {
        console.error("Error fetching packages:", error);
      } finally {
        setLoadingPackages(false);
      }
    };

    fetchPackages();
  }, []);

  const progress = ((currentStep + 1) / steps.length) * 100;

  const updateProfile = (key: keyof UserProfile, value: any) => {
    setProfile(prev => ({ ...prev, [key]: value }));
    
    // Auto-advance steps with radio group selections and visual effects
    const autoAdvanceSteps = ["goal", "activityLevel"];
    
    if (autoAdvanceSteps.includes(key)) {
      setSelectedOption(value);
      setIsTransitioning(true);
      setTimeout(() => {
        setIsTransitioning(false);
        setSelectedOption("");
        nextStep();
      }, 800);
    }
  };

  // Helper function to check if current option is selected and transitioning
  const isOptionSelectedAndTransitioning = (optionValue: string) => {
    return selectedOption === optionValue && isTransitioning;
  };

  // Generic card styling with transition effects
  const getCardClassName = (optionValue: string, isRadioCard: boolean = true) => {
    if (!isRadioCard) return "cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-green-200";
    
    return `cursor-pointer transition-all duration-300 border-2 ${
      isOptionSelectedAndTransitioning(optionValue)
        ? 'border-green-500 bg-green-50 scale-105 shadow-lg animate-pulse' 
        : 'hover:border-green-200 hover:shadow-lg'
    }`;
  };

  // Generic icon styling with animation
  const getIconClassName = (optionValue: string) => {
    return `text-green-600 transition-all duration-300 ${
      isOptionSelectedAndTransitioning(optionValue) ? 'animate-bounce' : ''
    }`;
  };

  const toggleArrayValue = (key: keyof UserProfile, value: string) => {
    setProfile(prev => {
      const currentArray = prev[key] as string[];
      return {
        ...prev,
        [key]: currentArray.includes(value) 
          ? currentArray.filter(item => item !== value)
          : [...currentArray, value]
      };
    });
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onComplete(profile);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0: return profile.goal !== "";
      case 1: return profile.activityLevel !== "";
      case 2: return true; // Dietary restrictions are optional
      case 3: return profile.cuisinePreferences.length > 0;
      case 4: return profile.selectedPackageId !== "" && profile.deliveryFrequency !== "";
      default: return true;
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <RadioGroup value={profile.goal} onValueChange={(value) => updateProfile("goal", value)}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className={getCardClassName("weight-loss")}>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="weight-loss" id="weight-loss" />
                      <Label htmlFor="weight-loss" className="cursor-pointer flex-1">
                        <div className="flex items-center space-x-3">
                          <Zap className={getIconClassName("weight-loss")} size={24} />
                          <div>
                            <div className="font-semibold">Weight Loss</div>
                            <div className="text-sm text-gray-500">Calorie-controlled, nutrient-dense meals</div>
                          </div>
                        </div>
                      </Label>
                    </div>
                  </CardContent>
                </Card>

                <Card className={getCardClassName("muscle-gain")}>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="muscle-gain" id="muscle-gain" />
                      <Label htmlFor="muscle-gain" className="cursor-pointer flex-1">
                        <div className="flex items-center space-x-3">
                          <Activity className={getIconClassName("muscle-gain")} size={24} />
                          <div>
                            <div className="font-semibold">Muscle Gain</div>
                            <div className="text-sm text-gray-500">High-protein, performance-focused nutrition</div>
                          </div>
                        </div>
                      </Label>
                    </div>
                  </CardContent>
                </Card>

                <Card className={getCardClassName("convenience")}>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="convenience" id="convenience" />
                      <Label htmlFor="convenience" className="cursor-pointer flex-1">
                        <div className="flex items-center space-x-3">
                          <Heart className={getIconClassName("convenience")} size={24} />
                          <div>
                            <div className="font-semibold">Convenience</div>
                            <div className="text-sm text-gray-500">Healthy meals without the planning</div>
                          </div>
                        </div>
                      </Label>
                    </div>
                  </CardContent>
                </Card>

                <Card className={getCardClassName("performance")}>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="performance" id="performance" />
                      <Label htmlFor="performance" className="cursor-pointer flex-1">
                        <div className="flex items-center space-x-3">
                          <Target className={getIconClassName("performance")} size={24} />
                          <div>
                            <div className="font-semibold">Performance</div>
                            <div className="text-sm text-gray-500">Athlete-level nutrition optimization</div>
                          </div>
                        </div>
                      </Label>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </RadioGroup>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">How active are you?</h3>
              <RadioGroup value={profile.activityLevel} onValueChange={(value) => updateProfile("activityLevel", value)}>
                <div className="space-y-3">
                  {[
                    { value: "low", label: "Light Activity", desc: "Desk job, minimal exercise" },
                    { value: "moderate", label: "Moderate Activity", desc: "Regular workouts 3-4 times per week" },
                    { value: "high", label: "High Activity", desc: "Daily training, very active lifestyle" },
                    { value: "athlete", label: "Professional Athlete", desc: "Elite training regimen" }
                  ].map((option) => (
                    <Card key={option.value} className={getCardClassName(option.value)}>
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value={option.value} id={option.value} />
                          <Label htmlFor={option.value} className="cursor-pointer flex-1">
                            <div>
                              <div className="font-medium">{option.label}</div>
                              <div className="text-sm text-gray-500">{option.desc}</div>
                            </div>
                          </Label>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </RadioGroup>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Any dietary restrictions?</h3>
              <p className="text-gray-600 mb-6">Select any that apply, or skip if none</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {["Vegetarian", "Vegan", "Gluten-Free", "Dairy-Free", "Keto", "Paleo"].map((restriction) => (
                  <div key={restriction} className="flex items-center space-x-2">
                    <Checkbox
                      id={restriction}
                      checked={profile.dietaryRestrictions.includes(restriction)}
                      onCheckedChange={() => toggleArrayValue("dietaryRestrictions", restriction)}
                    />
                    <Label htmlFor={restriction} className="text-sm">{restriction}</Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">What cuisines do you love?</h3>
              <p className="text-gray-600 mb-6">Select all that appeal to you - we'll personalize your recommendations</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  "Mediterranean", "Asian Fusion", "Mexican", "Italian", 
                  "Indian", "Thai", "American", "Middle Eastern", "Japanese"
                ].map((cuisine) => (
                  <Card 
                    key={cuisine}
                    className={`cursor-pointer transition-all duration-200 ${
                      profile.cuisinePreferences.includes(cuisine) 
                        ? 'border-green-500 bg-green-50' 
                        : 'hover:border-green-200'
                    }`}
                    onClick={() => toggleArrayValue("cuisinePreferences", cuisine)}
                  >
                    <CardContent className="p-4 text-center">
                      <div className="font-medium">{cuisine}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">Choose your perfect package</h3>
              {loadingPackages ? (
                <div className="text-center text-gray-500">Loading packages...</div>
              ) : (
                <RadioGroup value={profile.selectedPackageId} onValueChange={(value) => updateProfile("selectedPackageId", value)}>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {packages.map((pkg, index) => {
                      const isPopular = index === Math.floor(packages.length / 2);
                      return (
                        <Card key={pkg.id} className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-green-200 relative">
                          {isPopular && (
                            <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-green-500">
                              Popular
                            </Badge>
                          )}
                          <CardContent className="p-6">
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value={pkg.id} id={`package-${pkg.id}`} />
                              <Label htmlFor={`package-${pkg.id}`} className="cursor-pointer flex-1">
                                <div className="text-center">
                                  <div className="text-2xl font-bold text-green-600 mb-1">£{pkg.price.toFixed(2)}</div>
                                  <div className="font-semibold">{pkg.meal_count} Meals</div>
                                  <div className="text-sm text-gray-500">{pkg.description}</div>
                                  <div className="text-xs text-gray-400 mt-1">£{(pkg.price / pkg.meal_count).toFixed(2)} per meal</div>
                                </div>
                              </Label>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </RadioGroup>
              )}
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Delivery frequency</h3>
              <RadioGroup value={profile.deliveryFrequency} onValueChange={(value) => updateProfile("deliveryFrequency", value)}>
                <div className="space-y-3">
                  {[
                    { value: "weekly", label: "Weekly Subscription", desc: "Fresh meals every week, save 10%" },
                    { value: "bi-weekly", label: "Bi-Weekly", desc: "Every two weeks, save 5%" },
                    { value: "one-time", label: "One-Time Order", desc: "Try us out first" }
                  ].map((option) => (
                    <Card key={option.value} className="cursor-pointer hover:shadow-md transition-all duration-200">
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value={option.value} id={`freq-${option.value}`} />
                          <Label htmlFor={`freq-${option.value}`} className="cursor-pointer flex-1">
                            <div>
                              <div className="font-medium">{option.label}</div>
                              <div className="text-sm text-gray-500">{option.desc}</div>
                            </div>
                          </Label>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </RadioGroup>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const StepIcon = steps[currentStep].icon;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="text-center border-b">
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" onClick={onClose} className="text-gray-500">
              ✕
            </Button>
            <div className="flex items-center space-x-2">
              <StepIcon className="text-green-600" size={24} />
              <span className="text-sm text-gray-500">Step {currentStep + 1} of {steps.length}</span>
            </div>
          </div>
          
          <Progress value={progress} className="w-full mb-6" />
          
          <CardTitle className="text-2xl font-bold text-gray-800">
            {steps[currentStep].title}
          </CardTitle>
          <p className="text-gray-600">{steps[currentStep].subtitle}</p>
        </CardHeader>

        <CardContent className="p-8">
          {renderStepContent()}
        </CardContent>

        <div className="border-t p-6 flex justify-between">
          <Button 
            variant="outline" 
            onClick={prevStep} 
            disabled={currentStep === 0}
            className="flex items-center space-x-2"
          >
            <ArrowLeft size={16} />
            <span>Back</span>
          </Button>
          
          {(currentStep > 1 && currentStep < steps.length - 1) && (
            <Button 
              onClick={nextStep}
              disabled={!canProceed()}
              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 flex items-center space-x-2"
            >
              <span>Continue</span>
              <ArrowRight size={16} />
            </Button>
          )}
          
          {currentStep === steps.length - 1 && (
            <Button 
              onClick={nextStep}
              disabled={!canProceed()}
              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 flex items-center space-x-2"
            >
              <span>Create My Plan</span>
              <ArrowRight size={16} />
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
};

export default PremiumOnboarding;