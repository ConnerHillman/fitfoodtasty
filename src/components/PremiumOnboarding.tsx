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
      }, 600);
    }
  };

  // Helper function to check if current option is selected and transitioning
  const isOptionSelectedAndTransitioning = (optionValue: string) => {
    return selectedOption === optionValue && isTransitioning;
  };

  // Generic card styling with transition effects
  const getCardClassName = (optionValue: string, isRadioCard: boolean = true) => {
    if (!isRadioCard) return "group cursor-pointer transition-all duration-500 ease-out border-0 bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg hover:shadow-2xl hover:shadow-emerald-500/20 hover:scale-[1.02] hover:-translate-y-1";
    
    return `group cursor-pointer transition-all duration-500 ease-out border-0 rounded-2xl backdrop-blur-xl overflow-hidden relative ${
      isOptionSelectedAndTransitioning(optionValue)
        ? 'bg-gradient-to-br from-emerald-500/20 via-green-500/15 to-teal-500/20 scale-105 shadow-2xl shadow-emerald-500/40 -translate-y-2' 
        : 'bg-white/70 hover:bg-gradient-to-br hover:from-white/80 hover:via-emerald-50/30 hover:to-green-50/30 hover:shadow-xl hover:shadow-emerald-500/10 hover:scale-[1.02] hover:-translate-y-1'
    }`;
  };

  // Generic icon styling with animation
  const getIconClassName = (optionValue: string) => {
    return `transition-all duration-500 ease-out drop-shadow-sm ${
      isOptionSelectedAndTransitioning(optionValue) 
        ? 'text-white animate-bounce drop-shadow-xl scale-110' 
        : 'text-emerald-600 group-hover:text-emerald-700 group-hover:scale-105 group-hover:drop-shadow-md'
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
      case 3: return profile.selectedPackageId !== "" && profile.deliveryFrequency !== "";
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
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-2xl pointer-events-none"></div>
                  <CardContent className="p-8 relative z-10">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="weight-loss" id="weight-loss" className="sr-only" />
                      <Label htmlFor="weight-loss" className="cursor-pointer flex-1">
                        <div className="flex items-center space-x-4">
                          <div className={`relative p-4 rounded-2xl transition-all duration-500 backdrop-blur-sm ${
                            isOptionSelectedAndTransitioning("weight-loss") 
                              ? 'bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600 shadow-2xl shadow-emerald-500/50' 
                              : 'bg-gradient-to-br from-emerald-100/80 via-green-100/80 to-teal-100/80 group-hover:from-emerald-200/80 group-hover:via-green-200/80 group-hover:to-teal-200/80 shadow-lg'
                          }`}>
                            <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent rounded-2xl"></div>
                            <Zap className={getIconClassName("weight-loss")} size={28} />
                          </div>
                          <div className="flex-1">
                            <div className="font-bold text-xl text-gray-900 mb-1">Weight Loss</div>
                            <div className="text-gray-600 text-sm leading-relaxed">Calorie-controlled, nutrient-dense meals designed for sustainable weight management</div>
                          </div>
                        </div>
                      </Label>
                    </div>
                  </CardContent>
                </Card>

                <Card className={getCardClassName("muscle-gain")}>
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-2xl pointer-events-none"></div>
                  <CardContent className="p-8 relative z-10">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="muscle-gain" id="muscle-gain" className="sr-only" />
                      <Label htmlFor="muscle-gain" className="cursor-pointer flex-1">
                        <div className="flex items-center space-x-4">
                          <div className={`relative p-4 rounded-2xl transition-all duration-500 backdrop-blur-sm ${
                            isOptionSelectedAndTransitioning("muscle-gain") 
                              ? 'bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600 shadow-2xl shadow-emerald-500/50' 
                              : 'bg-gradient-to-br from-blue-100/80 via-indigo-100/80 to-cyan-100/80 group-hover:from-blue-200/80 group-hover:via-indigo-200/80 group-hover:to-cyan-200/80 shadow-lg'
                          }`}>
                            <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent rounded-2xl"></div>
                            <Activity className={getIconClassName("muscle-gain")} size={28} />
                          </div>
                          <div className="flex-1">
                            <div className="font-bold text-xl text-gray-900 mb-1">Muscle Gain</div>
                            <div className="text-gray-600 text-sm leading-relaxed">High-protein, performance-focused nutrition for muscle building and recovery</div>
                          </div>
                        </div>
                      </Label>
                    </div>
                  </CardContent>
                </Card>

                <Card className={getCardClassName("convenience")}>
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-2xl pointer-events-none"></div>
                  <CardContent className="p-8 relative z-10">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="convenience" id="convenience" className="sr-only" />
                      <Label htmlFor="convenience" className="cursor-pointer flex-1">
                        <div className="flex items-center space-x-4">
                          <div className={`relative p-4 rounded-2xl transition-all duration-500 backdrop-blur-sm ${
                            isOptionSelectedAndTransitioning("convenience") 
                              ? 'bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600 shadow-2xl shadow-emerald-500/50' 
                              : 'bg-gradient-to-br from-purple-100/80 via-pink-100/80 to-rose-100/80 group-hover:from-purple-200/80 group-hover:via-pink-200/80 group-hover:to-rose-200/80 shadow-lg'
                          }`}>
                            <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent rounded-2xl"></div>
                            <Heart className={getIconClassName("convenience")} size={28} />
                          </div>
                          <div className="flex-1">
                            <div className="font-bold text-xl text-gray-900 mb-1">Convenience</div>
                            <div className="text-gray-600 text-sm leading-relaxed">Healthy meals without the planning, perfectly suited for busy lifestyles</div>
                          </div>
                        </div>
                      </Label>
                    </div>
                  </CardContent>
                </Card>

                <Card className={getCardClassName("performance")}>
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-2xl pointer-events-none"></div>
                  <CardContent className="p-8 relative z-10">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="performance" id="performance" className="sr-only" />
                      <Label htmlFor="performance" className="cursor-pointer flex-1">
                        <div className="flex items-center space-x-4">
                          <div className={`relative p-4 rounded-2xl transition-all duration-500 backdrop-blur-sm ${
                            isOptionSelectedAndTransitioning("performance") 
                              ? 'bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600 shadow-2xl shadow-emerald-500/50' 
                              : 'bg-gradient-to-br from-orange-100/80 via-amber-100/80 to-yellow-100/80 group-hover:from-orange-200/80 group-hover:via-amber-200/80 group-hover:to-yellow-200/80 shadow-lg'
                          }`}>
                            <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent rounded-2xl"></div>
                            <Target className={getIconClassName("performance")} size={28} />
                          </div>
                          <div className="flex-1">
                            <div className="font-bold text-xl text-gray-900 mb-1">Performance</div>
                            <div className="text-gray-600 text-sm leading-relaxed">Athlete-level nutrition optimization for peak physical performance</div>
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
          <div className="space-y-8">
            <div className="text-center mb-8">
              <h3 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 bg-clip-text text-transparent mb-3">How active are you?</h3>
              <p className="text-gray-600 text-lg">Tell us about your lifestyle so we can tailor your nutrition</p>
            </div>
            <RadioGroup value={profile.activityLevel} onValueChange={(value) => updateProfile("activityLevel", value)}>
              <div className="space-y-4">
                {[
                  { value: "low", label: "Light Activity", desc: "Desk job, minimal exercise", gradient: "from-blue-100/80 via-indigo-100/80 to-purple-100/80", hoverGradient: "group-hover:from-blue-200/80 group-hover:via-indigo-200/80 group-hover:to-purple-200/80" },
                  { value: "moderate", label: "Moderate Activity", desc: "Regular workouts 3-4 times per week", gradient: "from-green-100/80 via-emerald-100/80 to-teal-100/80", hoverGradient: "group-hover:from-green-200/80 group-hover:via-emerald-200/80 group-hover:to-teal-200/80" },
                  { value: "high", label: "High Activity", desc: "Daily training, very active lifestyle", gradient: "from-orange-100/80 via-amber-100/80 to-yellow-100/80", hoverGradient: "group-hover:from-orange-200/80 group-hover:via-amber-200/80 group-hover:to-yellow-200/80" },
                  { value: "athlete", label: "Professional Athlete", desc: "Elite training regimen", gradient: "from-red-100/80 via-pink-100/80 to-rose-100/80", hoverGradient: "group-hover:from-red-200/80 group-hover:via-pink-200/80 group-hover:to-rose-200/80" }
                ].map((option) => (
                  <Card key={option.value} className={getCardClassName(option.value)}>
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-2xl pointer-events-none"></div>
                    <CardContent className="p-6 relative z-10">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value={option.value} id={option.value} className="sr-only" />
                        <Label htmlFor={option.value} className="cursor-pointer flex-1">
                          <div className="flex items-center space-x-4">
                            <div className={`relative p-3 rounded-2xl transition-all duration-500 backdrop-blur-sm shadow-lg ${
                              isOptionSelectedAndTransitioning(option.value) 
                                ? 'bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600 shadow-2xl shadow-emerald-500/50' 
                                : `bg-gradient-to-br ${option.gradient} ${option.hoverGradient}`
                            }`}>
                              <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent rounded-2xl"></div>
                              <Activity className={getIconClassName(option.value)} size={24} />
                            </div>
                            <div className="flex-1">
                              <div className="font-bold text-lg text-gray-900 mb-1">{option.label}</div>
                              <div className="text-gray-600 leading-relaxed">{option.desc}</div>
                            </div>
                          </div>
                        </Label>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </RadioGroup>
          </div>
        );

      case 2:
        return (
          <div className="space-y-8">
            <div className="text-center mb-8">
              <h3 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 bg-clip-text text-transparent mb-3">Dietary Preferences</h3>
              <p className="text-gray-600 text-lg">Any dietary restrictions we should know about? Select all that apply, or skip if none</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {["Vegetarian", "Vegan", "Gluten-Free", "Dairy-Free", "Keto", "Paleo"].map((restriction) => (
                <Card 
                  key={restriction}
                  className={`group cursor-pointer transition-all duration-500 ease-out border-0 rounded-2xl backdrop-blur-xl overflow-hidden relative ${
                    profile.dietaryRestrictions.includes(restriction) 
                      ? 'bg-gradient-to-br from-emerald-500/20 via-green-500/15 to-teal-500/20 scale-105 shadow-2xl shadow-emerald-500/40 -translate-y-2' 
                      : 'bg-white/70 hover:bg-gradient-to-br hover:from-white/80 hover:via-emerald-50/30 hover:to-green-50/30 hover:shadow-xl hover:shadow-emerald-500/10 hover:scale-[1.02] hover:-translate-y-1'
                  }`}
                  onClick={() => toggleArrayValue("dietaryRestrictions", restriction)}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-2xl pointer-events-none"></div>
                  <CardContent className="p-6 text-center relative z-10">
                    <div className="flex items-center justify-center space-x-2 mb-2">
                      <Checkbox
                        id={restriction}
                        checked={profile.dietaryRestrictions.includes(restriction)}
                        onCheckedChange={() => toggleArrayValue("dietaryRestrictions", restriction)}
                        className="sr-only"
                      />
                      <Heart className={`transition-all duration-500 ${
                        profile.dietaryRestrictions.includes(restriction) 
                          ? 'text-emerald-600 scale-110' 
                          : 'text-gray-400 group-hover:text-emerald-500'
                      }`} size={20} />
                    </div>
                    <Label htmlFor={restriction} className="font-medium text-gray-900 cursor-pointer">{restriction}</Label>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-8">
            <div className="mb-12">
              <div className="text-center mb-8">
                <h3 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 bg-clip-text text-transparent mb-3">Choose your perfect package</h3>
                <p className="text-gray-600 text-lg">Select the meal plan that fits your lifestyle</p>
              </div>
              {loadingPackages ? (
                <div className="text-center text-gray-500 py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
                  <p className="text-lg">Loading premium packages...</p>
                </div>
              ) : (
                <RadioGroup value={profile.selectedPackageId} onValueChange={(value) => updateProfile("selectedPackageId", value)}>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {packages.map((pkg, index) => {
                      const isPopular = index === Math.floor(packages.length / 2);
                      return (
                        <Card key={pkg.id} className="group cursor-pointer transition-all duration-500 ease-out border-0 bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg hover:shadow-2xl hover:shadow-emerald-500/20 hover:scale-[1.02] hover:-translate-y-1 relative overflow-hidden">
                          {isPopular && (
                            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-20">
                              <Badge className="bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold px-4 py-2 shadow-lg shadow-emerald-500/40 rounded-full">
                                Most Popular
                              </Badge>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-2xl pointer-events-none"></div>
                          <CardContent className="p-8 relative z-10 text-center">
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value={pkg.id} id={`package-${pkg.id}`} className="sr-only" />
                              <Label htmlFor={`package-${pkg.id}`} className="cursor-pointer flex-1">
                                <div className="space-y-4">
                                  <div className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">£{pkg.price.toFixed(2)}</div>
                                  <div className="text-xl font-bold text-gray-900">{pkg.meal_count} Meals</div>
                                  <div className="text-gray-600 leading-relaxed">{pkg.description}</div>
                                  <div className="text-sm text-gray-500 font-medium">£{(pkg.price / pkg.meal_count).toFixed(2)} per meal</div>
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
              <div className="text-center mb-8">
                <h3 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 bg-clip-text text-transparent mb-3">Delivery frequency</h3>
                <p className="text-gray-600 text-lg">Choose how often you'd like fresh meals delivered</p>
              </div>
              <RadioGroup value={profile.deliveryFrequency} onValueChange={(value) => updateProfile("deliveryFrequency", value)}>
                <div className="space-y-4">
                  {[
                    { value: "weekly", label: "Weekly Subscription", desc: "Fresh meals every week, save 10%", badge: "Best Value" },
                    { value: "bi-weekly", label: "Bi-Weekly", desc: "Every two weeks, save 5%", badge: "Popular" },
                    { value: "one-time", label: "One-Time Order", desc: "Try us out first", badge: null }
                  ].map((option) => (
                    <Card key={option.value} className="group cursor-pointer transition-all duration-500 ease-out border-0 bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg hover:shadow-2xl hover:shadow-emerald-500/20 hover:scale-[1.01] hover:-translate-y-1 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-2xl pointer-events-none"></div>
                      {option.badge && (
                        <div className="absolute top-4 right-4 z-20">
                          <Badge className="bg-gradient-to-r from-emerald-500 to-green-600 text-white font-medium px-3 py-1 shadow-lg shadow-emerald-500/40 rounded-full text-xs">
                            {option.badge}
                          </Badge>
                        </div>
                      )}
                      <CardContent className="p-6 relative z-10">
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value={option.value} id={`freq-${option.value}`} className="sr-only" />
                          <Label htmlFor={`freq-${option.value}`} className="cursor-pointer flex-1">
                            <div className="flex items-center space-x-4">
                              <div className="relative p-3 rounded-2xl bg-gradient-to-br from-emerald-100/80 via-green-100/80 to-teal-100/80 group-hover:from-emerald-200/80 group-hover:via-green-200/80 group-hover:to-teal-200/80 shadow-lg transition-all duration-500 backdrop-blur-sm">
                                <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent rounded-2xl"></div>
                                <Users className="text-emerald-600 group-hover:text-emerald-700 transition-all duration-500" size={24} />
                              </div>
                              <div className="flex-1">
                                <div className="font-bold text-lg text-gray-900 mb-1">{option.label}</div>
                                <div className="text-gray-600 leading-relaxed">{option.desc}</div>
                              </div>
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
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900/98 via-gray-900/98 to-black/98 backdrop-blur-xl z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-5xl max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-2xl border-0 shadow-[0_32px_64px_rgba(0,0,0,0.4)] rounded-3xl">
        <CardHeader className="text-center border-b-0 bg-gradient-to-r from-emerald-50/80 via-green-50/80 to-teal-50/80 backdrop-blur-sm rounded-t-3xl p-8">
          <div className="flex items-center justify-between mb-6">
            <Button 
              variant="ghost" 
              onClick={onClose} 
              className="text-gray-400 hover:text-gray-600 hover:bg-white/60 backdrop-blur-sm rounded-full w-10 h-10 p-0 transition-all duration-300 hover:scale-110"
            >
              ✕
            </Button>
            <div className="flex items-center space-x-3">
              <div className="relative p-3 rounded-2xl bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600 shadow-lg shadow-emerald-500/40">
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-2xl"></div>
                <StepIcon className="text-white relative z-10" size={24} />
              </div>
              <div className="text-left">
                <span className="text-xs text-gray-500 uppercase tracking-wider font-medium">Progress</span>
                <div className="text-sm text-gray-700 font-semibold">Step {currentStep + 1} of {steps.length}</div>
              </div>
            </div>
          </div>
          
          <div className="relative mb-8">
            <div className="w-full h-2 bg-gradient-to-r from-gray-200/50 to-gray-300/50 rounded-full backdrop-blur-sm shadow-inner">
              <div 
                className="h-full bg-gradient-to-r from-emerald-400 via-green-500 to-teal-500 rounded-full transition-all duration-700 ease-out shadow-lg shadow-emerald-500/50 relative overflow-hidden"
                style={{ width: `${progress}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/30 to-transparent"></div>
                <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent"></div>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <CardTitle className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 bg-clip-text text-transparent tracking-tight">
              {steps[currentStep].title}
            </CardTitle>
            <p className="text-gray-600 text-xl font-medium leading-relaxed">{steps[currentStep].subtitle}</p>
          </div>
        </CardHeader>

        <CardContent className="p-10 bg-gradient-to-b from-white/50 to-gray-50/30 backdrop-blur-sm">
          {renderStepContent()}
        </CardContent>

        <div className="border-t-0 bg-gradient-to-r from-gray-50/80 via-white/80 to-gray-50/80 backdrop-blur-sm p-8 flex justify-between rounded-b-3xl">
          <Button 
            variant="outline" 
            onClick={prevStep} 
            disabled={currentStep === 0}
            className="flex items-center space-x-2 border-0 bg-white/70 backdrop-blur-sm hover:bg-white/90 text-gray-700 hover:text-gray-900 rounded-xl px-6 py-3 font-medium shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
          >
            <ArrowLeft size={18} />
            <span>Back</span>
          </Button>
          
          {(currentStep > 1 && currentStep < steps.length - 1) && (
            <Button 
              onClick={nextStep}
              disabled={!canProceed()}
              className="bg-gradient-to-r from-emerald-500 via-green-500 to-teal-600 hover:from-emerald-600 hover:via-green-600 hover:to-teal-700 text-white font-bold flex items-center space-x-2 shadow-2xl shadow-emerald-500/40 hover:shadow-emerald-500/60 hover:scale-105 transition-all duration-300 rounded-xl px-8 py-3 backdrop-blur-sm"
            >
              <span>Continue</span>
              <ArrowRight size={18} />
            </Button>
          )}
          
          {currentStep === steps.length - 1 && (
            <Button 
              onClick={nextStep}
              disabled={!canProceed()}
              className="bg-gradient-to-r from-emerald-500 via-green-500 to-teal-600 hover:from-emerald-600 hover:via-green-600 hover:to-teal-700 text-white font-bold flex items-center space-x-3 shadow-2xl shadow-emerald-500/50 hover:shadow-emerald-500/70 hover:scale-105 transition-all duration-300 rounded-xl px-10 py-4 backdrop-blur-sm text-lg"
            >
              <span>Create My Plan</span>
              <ArrowRight size={20} />
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
};

export default PremiumOnboarding;