import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowRight, ArrowLeft, Target, Activity, UtensilsCrossed, Heart, Zap, Users, ChevronLeft, ChevronRight, Package, Calendar, Clock } from "lucide-react";
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
  mealCount: number;
}

const steps: OnboardingStep[] = [
  {
    id: "goal",
    title: "What's Your Goal?",
    subtitle: "Help us personalize your perfect meal plan",
    icon: Target
  },
  {
    id: "mealCount",
    title: "How Many Meals?",
    subtitle: "Tell us how many meals you want",
    icon: UtensilsCrossed
  },
  {
    id: "recommendation",
    title: "Your Perfect Plan",
    subtitle: "We've found the ideal package for you",
    icon: Zap
  },
  {
    id: "deliveryFrequency",
    title: "Delivery Schedule",
    subtitle: "How often would you like your meals delivered?",
    icon: Calendar
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
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [profile, setProfile] = useState<UserProfile>({
    goal: "",
    activityLevel: "",
    dietaryRestrictions: [],
    cuisinePreferences: [],
    selectedPackageId: "",
    deliveryFrequency: "",
    mealCount: 0
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
    const autoAdvanceSteps = ["goal", "mealCount"];
    
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
      case 1: return profile.mealCount > 0;
      case 2: return true; // Package recommendation step
      case 3: return profile.deliveryFrequency !== "";
      default: return true;
    }
  };

  // Get recommended package based on goal and meal count
  const getRecommendedPackage = () => {
    // Determine meal size based on goal
    let mealSizeKeyword = "";
    switch (profile.goal) {
      case "weight-loss":
        mealSizeKeyword = "lowcal";
        break;
      case "convenience":
      case "performance":
        mealSizeKeyword = "package"; // Match basic packages (not LowCal or MASSIVE)
        break;
      case "muscle-gain":
        mealSizeKeyword = "massive";
        break;
      default:
        mealSizeKeyword = "package";
    }

    // Find package that matches meal count and contains the size keyword
    const matchingPackage = packages.find(pkg => 
      pkg.meal_count === profile.mealCount && 
      pkg.name.toLowerCase().includes(mealSizeKeyword)
    );
    
    // If no specific match, find any package with the meal count
    return matchingPackage || packages.find(pkg => pkg.meal_count === profile.mealCount);
  };

  // Get similar packages (same type, different meal counts)
  const getSimilarPackages = () => {
    let mealSizeKeyword = "";
    switch (profile.goal) {
      case "weight-loss":
        mealSizeKeyword = "lowcal";
        break;
      case "convenience":
      case "performance":
        mealSizeKeyword = "package"; // Match basic packages
        break;
      case "muscle-gain":
        mealSizeKeyword = "massive";
        break;
      default:
        mealSizeKeyword = "package";
    }

    // Filter packages by the same meal type and sort by meal count
    const filteredPackages = packages.filter(pkg => {
      const name = pkg.name.toLowerCase();
      if (mealSizeKeyword === "package") {
        // For regular packages, exclude LowCal and MASSIVE
        return !name.includes("lowcal") && !name.includes("massive");
      }
      return name.includes(mealSizeKeyword);
    });
    
    return filteredPackages.sort((a, b) => a.meal_count - b.meal_count);
  };

  // Set initial carousel index when packages are loaded or goal changes
  useEffect(() => {
    const similarPackages = getSimilarPackages();
    const recommendedPackage = getRecommendedPackage();
    if (recommendedPackage && similarPackages.length > 0) {
      const index = similarPackages.findIndex(pkg => pkg.id === recommendedPackage.id);
      setCarouselIndex(index >= 0 ? index : 0);
      
      // Auto-select the recommended package when reaching the recommendation step
      if (currentStep === 2 && !profile.selectedPackageId) {
        setProfile(prev => ({ ...prev, selectedPackageId: recommendedPackage.id }));
      }
    }
  }, [packages, profile.goal, profile.mealCount, currentStep]);

  const navigateCarousel = (direction: 'prev' | 'next') => {
    const similarPackages = getSimilarPackages();
    if (similarPackages.length === 0) return;

    if (direction === 'prev') {
      setCarouselIndex(prev => prev === 0 ? similarPackages.length - 1 : prev - 1);
    } else {
      setCarouselIndex(prev => prev === similarPackages.length - 1 ? 0 : prev + 1);
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
        // Get unique meal counts from available packages, sorted ascending
        const availableMealCounts = [...new Set(packages.map(pkg => pkg.meal_count))].sort((a, b) => a - b);
        
        return (
          <div className="space-y-8">
            <div className="flex gap-4 max-w-6xl mx-auto">
              {availableMealCounts.map((count) => (
                <Card 
                  key={count} 
                  className={`group cursor-pointer transition-all duration-500 ease-out border-0 rounded-3xl backdrop-blur-xl overflow-hidden relative flex-1 ${
                    profile.mealCount === count
                      ? 'bg-gradient-to-br from-emerald-500/20 via-green-500/15 to-teal-500/20 scale-105 shadow-2xl shadow-emerald-500/40 -translate-y-2' 
                      : 'bg-white/70 hover:bg-gradient-to-br hover:from-white/80 hover:via-emerald-50/30 hover:to-green-50/30 hover:shadow-xl hover:shadow-emerald-500/10 hover:scale-[1.02] hover:-translate-y-1'
                  }`}
                  onClick={() => updateProfile("mealCount", count)}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-3xl pointer-events-none"></div>
                  <CardContent className="p-8 relative z-10">
                    <div className="text-center">
                      <div className={`relative mx-auto mb-6 w-24 h-24 rounded-3xl transition-all duration-500 backdrop-blur-sm shadow-lg ${
                        profile.mealCount === count
                          ? 'bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600 shadow-2xl shadow-emerald-500/50' 
                          : 'bg-gradient-to-br from-emerald-100/80 via-green-100/80 to-teal-100/80 group-hover:from-emerald-200/80 group-hover:via-green-200/80 group-hover:to-teal-200/80'
                      }`}>
                        <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent rounded-3xl"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className={`text-3xl font-bold transition-all duration-500 ${
                            profile.mealCount === count 
                              ? 'text-white scale-110 drop-shadow-xl' 
                              : 'text-emerald-600 group-hover:text-emerald-700 group-hover:scale-105'
                          }`}>
                            {count}
                          </span>
                        </div>
                      </div>
                      
                      <div className="font-bold text-xl text-gray-900 mb-2">{count} Meals</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );

      case 2:
        const recommendedPackage = getRecommendedPackage();
        const currentPackage = recommendedPackage;
        
        return (
          <div className="space-y-8">
            {currentPackage ? (
              <div className="text-center space-y-6">
                <div className="bg-gradient-to-br from-white via-green-50 to-emerald-50 border-2 border-green-200 rounded-3xl p-8 shadow-2xl">
                  <div className="text-4xl font-bold bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent mb-4">
                    {currentPackage.name}
                  </div>
                  <p className="text-gray-600 text-lg mb-6">{currentPackage.description}</p>
                  <div className="flex items-center justify-center space-x-6">
                    <div className="text-5xl font-bold text-green-600">£{currentPackage.price}</div>
                    <div className="text-2xl text-gray-500">{currentPackage.meal_count} meals</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500">
                No packages available
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { value: "onetime", label: "One Time", desc: "Single delivery order", icon: Package },
                { value: "weekly", label: "Weekly", desc: "Fresh meals every week", icon: Calendar, popular: true },
                { value: "monthly", label: "Monthly", desc: "Once per month delivery", icon: Clock }
              ].map((freq) => (
                <Card 
                  key={freq.value} 
                  className={`group cursor-pointer transition-all duration-500 ease-out border-0 rounded-2xl backdrop-blur-xl overflow-hidden relative ${
                    profile.deliveryFrequency === freq.value
                      ? 'bg-gradient-to-br from-emerald-500/20 via-green-500/15 to-teal-500/20 scale-105 shadow-2xl shadow-emerald-500/40 -translate-y-2' 
                      : 'bg-white/70 hover:bg-gradient-to-br hover:from-white/80 hover:via-emerald-50/30 hover:to-green-50/30 hover:shadow-xl hover:shadow-emerald-500/10 hover:scale-[1.02] hover:-translate-y-1'
                  }`}
                  onClick={() => updateProfile("deliveryFrequency", freq.value)}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-2xl pointer-events-none"></div>
                  {freq.popular && (
                    <div className="absolute top-4 right-4 z-20">
                      <Badge className="bg-gradient-to-r from-emerald-500 to-green-500 text-white border-0 shadow-lg">
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  <CardContent className="p-6 relative z-10">
                    <div className="text-center">
                      <div className={`relative mx-auto mb-4 w-16 h-16 rounded-2xl transition-all duration-500 backdrop-blur-sm shadow-lg ${
                        profile.deliveryFrequency === freq.value
                          ? 'bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600 shadow-2xl shadow-emerald-500/50' 
                          : 'bg-gradient-to-br from-blue-100/80 via-indigo-100/80 to-purple-100/80 group-hover:from-blue-200/80 group-hover:via-indigo-200/80 group-hover:to-purple-200/80'
                      }`}>
                        <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent rounded-2xl"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <freq.icon className={`transition-all duration-500 ${
                            profile.deliveryFrequency === freq.value 
                              ? 'text-white scale-110 drop-shadow-xl' 
                              : 'text-blue-600 group-hover:text-blue-700 group-hover:scale-105'
                          }`} size={24} />
                        </div>
                      </div>
                      
                      <div className="font-bold text-xl text-gray-900 mb-1">{freq.label}</div>
                      <div className="text-gray-600 text-sm leading-relaxed">{freq.desc}</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
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
              className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-white/60 transition-all duration-300"
            >
              ✕
            </Button>
            
            <div className="flex items-center space-x-3 bg-gradient-to-r from-emerald-500/10 via-green-500/10 to-teal-500/10 px-6 py-3 rounded-2xl border border-emerald-200/50 backdrop-blur-sm shadow-lg">
              <div className="relative">
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
                  <Zap size={16} className="text-white drop-shadow-sm" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent rounded-2xl"></div>
              </div>
              <div className="flex flex-col items-start">
                <span className="text-xs font-medium text-emerald-700 uppercase tracking-wider">Progress</span>
                <span className="text-sm font-bold bg-gradient-to-r from-gray-700 to-gray-900 bg-clip-text text-transparent">
                  Step {currentStep + 1} of {steps.length}
                </span>
              </div>
            </div>
          </div>

          <Progress 
            value={progress} 
            className="w-full h-3 mb-8 bg-gradient-to-r from-emerald-100 via-green-100 to-teal-100 rounded-full shadow-inner" 
          />
          
          <div className="space-y-4">
            <div className="flex items-center justify-center space-x-4 mb-4">
              <div className="relative p-6 bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600 rounded-3xl shadow-2xl shadow-emerald-500/40">
                <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-white/20 to-transparent rounded-3xl"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-white/40 rounded-3xl"></div>
                <StepIcon size={32} className="text-white drop-shadow-xl relative z-10" />
              </div>
            </div>
            <CardTitle className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 bg-clip-text text-transparent mb-3">
              {steps[currentStep].title}
            </CardTitle>
            <p className="text-gray-600 text-lg font-medium leading-relaxed">
              {steps[currentStep].subtitle}
            </p>
          </div>
        </CardHeader>

        <CardContent className="p-12">
          {renderStepContent()}
        </CardContent>

        <div className="flex justify-between items-center p-8 bg-gradient-to-r from-gray-50/80 via-white/80 to-gray-50/80 backdrop-blur-sm rounded-b-3xl border-t border-gray-100/50">
          <Button 
            variant="outline" 
            onClick={prevStep} 
            disabled={currentStep === 0}
            className="flex items-center space-x-2 border-0 bg-white/70 backdrop-blur-sm hover:bg-white/90 text-gray-700 hover:text-gray-900 rounded-xl px-6 py-3 font-medium shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
          >
            <ArrowLeft size={18} />
            <span>Back</span>
          </Button>
          
          {(currentStep > 0 && currentStep < steps.length - 1) && (
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