import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowRight, ArrowLeft, Target, Activity, UtensilsCrossed, Heart, Flame, Users, ChevronLeft, ChevronRight, Package, Calendar, Clock, Dumbbell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/fit-food-tasty-logo.png";

// Data interfaces
interface OnboardingStep {
  id: string;
  title: string;
  subtitle: string;
  icon: any;
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

// Steps configuration
const steps: OnboardingStep[] = [
  {
    id: "goal",
    title: "What's Your Goal?",
    subtitle: "Let's personalize your meal plan to fit your lifestyle",
    icon: Target
  },
  {
    id: "mealCount",
    title: "How Many Meals?",
    subtitle: "Choose the number of meals per week that fits your schedule",
    icon: UtensilsCrossed
  },
  {
    id: "recommendation",
    title: "Your Perfect Plan",
    subtitle: "We've found the ideal package for you",
    icon: Flame
  },
  {
    id: "deliveryFrequency",
    title: "Delivery Schedule",
    subtitle: "How often would you like your meals delivered?",
    icon: Calendar
  }
];

const Onboarding = () => {
  const navigate = useNavigate();
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

  const progress = ((currentStep + 1) / steps.length) * 100;

  // Fetch packages on mount
  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const { data, error } = await supabase
          .from("packages")
          .select("*")
          .eq("is_active", true)
          .order("sort_order");

        if (error) throw error;
        setPackages(data || []);
      } catch (error) {
        console.error("Error fetching packages:", error);
      } finally {
        setLoadingPackages(false);
      }
    };

    fetchPackages();
  }, []);

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
      // Redirect to menu with selected package for meal selection
      const selectedPackage = packages.find(p => p.id === profile.selectedPackageId);
      if (selectedPackage) {
        // Store the onboarding data in localStorage for the menu to use
        localStorage.setItem('onboardingProfile', JSON.stringify(profile));
        localStorage.setItem('selectedPackage', JSON.stringify(selectedPackage));
        navigate('/menu');
      } else {
        navigate('/menu');
      }
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
      case "burn-fat":
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

    // Try to find a package that matches both meal count and type
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
      case "burn-fat":
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

    // Filter packages by type and sort by meal count
    const filteredPackages = packages.filter(pkg => 
      pkg.name.toLowerCase().includes(mealSizeKeyword)
    ).sort((a, b) => a.meal_count - b.meal_count);

    // If we don't have enough packages of this type, include all packages
    return filteredPackages.length >= 2 ? filteredPackages : packages.sort((a, b) => a.meal_count - b.meal_count);
  };

  // Set initial carousel position and auto-select recommended package
  useEffect(() => {
    if (currentStep === 2 && packages.length > 0) {
      const recommendedPackage = getRecommendedPackage();
      const similarPackages = getSimilarPackages();
      
      if (recommendedPackage) {
        const index = similarPackages.findIndex(pkg => pkg.id === recommendedPackage.id);
        setCarouselIndex(index >= 0 ? index : 0);
        setProfile(prev => ({ ...prev, selectedPackageId: recommendedPackage.id }));
      }
    }
  }, [currentStep, packages, profile.goal, profile.mealCount]);

  // Navigation functions for carousel
  const navigateCarousel = (direction: 'prev' | 'next') => {
    const similarPackages = getSimilarPackages();
    if (direction === 'prev') {
      setCarouselIndex(prev => prev > 0 ? prev - 1 : similarPackages.length - 1);
    } else {
      setCarouselIndex(prev => prev < similarPackages.length - 1 ? prev + 1 : 0);
    }
  };

  // Update selected package when carousel index changes
  useEffect(() => {
    if (currentStep === 2) {
      const similarPackages = getSimilarPackages();
      const currentCarouselPackage = similarPackages[carouselIndex];
      if (currentCarouselPackage) {
        setProfile(prev => ({ ...prev, selectedPackageId: currentCarouselPackage.id }));
      }
    }
  }, [carouselIndex, currentStep]);

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <RadioGroup value={profile.goal} onValueChange={(value) => updateProfile("goal", value)}>
              <div className="flex flex-col gap-4">
                <Card className={getCardClassName("burn-fat")}>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="burn-fat" id="burn-fat" className="sr-only" />
                      <Label htmlFor="burn-fat" className="cursor-pointer flex-1">
                        <div className="flex flex-col items-center text-center space-y-4">
                          <div className={`relative p-4 rounded-2xl transition-all duration-500 backdrop-blur-sm ${
                            isOptionSelectedAndTransitioning("burn-fat") 
                              ? 'bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600 shadow-2xl shadow-emerald-500/50' 
                              : 'bg-gradient-to-br from-red-100/80 via-orange-100/80 to-yellow-100/80 group-hover:from-red-200/80 group-hover:via-orange-200/80 group-hover:to-yellow-200/80 shadow-lg'
                          }`}>
                            <Flame className={getIconClassName("burn-fat")} size={28} />
                          </div>
                          <div className="flex-1">
                            <div className="font-bold text-xl text-gray-900 mb-1">Burn Fat</div>
                            <div className="text-gray-600 text-sm leading-relaxed">Calorie-controlled, nutrient-dense meals designed for sustainable fat loss</div>
                          </div>
                        </div>
                      </Label>
                    </div>
                  </CardContent>
                </Card>

                <Card className={getCardClassName("muscle-gain")}>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="muscle-gain" id="muscle-gain" className="sr-only" />
                      <Label htmlFor="muscle-gain" className="cursor-pointer flex-1">
                        <div className="flex flex-col items-center text-center space-y-4">
                          <div className={`relative p-4 rounded-2xl transition-all duration-500 backdrop-blur-sm ${
                            isOptionSelectedAndTransitioning("muscle-gain") 
                              ? 'bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600 shadow-2xl shadow-emerald-500/50' 
                              : 'bg-gradient-to-br from-blue-100/80 via-indigo-100/80 to-cyan-100/80 group-hover:from-blue-200/80 group-hover:via-indigo-200/80 group-hover:to-cyan-200/80 shadow-lg'
                          }`}>
                            <Dumbbell className={getIconClassName("muscle-gain")} size={28} />
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

                <Card className={getCardClassName("performance")}>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="performance" id="performance" className="sr-only" />
                      <Label htmlFor="performance" className="cursor-pointer flex-1">
                        <div className="flex flex-col items-center text-center space-y-4">
                          <div className={`relative p-4 rounded-2xl transition-all duration-500 backdrop-blur-sm ${
                            isOptionSelectedAndTransitioning("performance") 
                              ? 'bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600 shadow-2xl shadow-emerald-500/50' 
                              : 'bg-gradient-to-br from-orange-100/80 via-amber-100/80 to-yellow-100/80 group-hover:from-orange-200/80 group-hover:via-amber-200/80 group-hover:to-yellow-200/80 shadow-lg'
                          }`}>
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
          <div className="space-y-6">
            <RadioGroup value={profile.mealCount.toString()} onValueChange={(value) => updateProfile("mealCount", parseInt(value))}>
              <div className="grid grid-cols-2 gap-4">
                {[5, 7, 10, 14].map((count) => (
                  <Card key={count} className={getCardClassName(count.toString())}>
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value={count.toString()} id={count.toString()} className="sr-only" />
                        <Label htmlFor={count.toString()} className="cursor-pointer flex-1">
                          <div className="text-center space-y-3">
                            <div className={`relative mx-auto w-16 h-16 rounded-2xl transition-all duration-500 backdrop-blur-sm flex items-center justify-center ${
                              isOptionSelectedAndTransitioning(count.toString()) 
                                ? 'bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600 shadow-2xl shadow-emerald-500/50' 
                                : 'bg-gradient-to-br from-emerald-100/80 via-green-100/80 to-teal-100/80 group-hover:from-emerald-200/80 group-hover:via-green-200/80 group-hover:to-teal-200/80 shadow-lg'
                            }`}>
                              <UtensilsCrossed className={getIconClassName(count.toString())} size={24} />
                            </div>
                            <div className="font-bold text-xl text-gray-900">{count} Meals</div>
                            <div className="text-gray-600 text-sm">Per Week</div>
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
        const similarPackages = getSimilarPackages();
        const currentPackage = similarPackages[carouselIndex];
        
        if (loadingPackages) {
          return <div className="text-center py-8">Loading packages...</div>;
        }

        if (!currentPackage) {
          return <div className="text-center py-8">No packages available</div>;
        }

        return (
          <div className="space-y-8">
            <div className="relative">
              <div className="flex items-center justify-between mb-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateCarousel('prev')}
                  className="rounded-full p-2 bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <ChevronLeft size={16} />
                </Button>
                
                <div className="text-center">
                  <Badge variant="secondary" className="mb-2 bg-emerald-100 text-emerald-800">
                    Recommended for you
                  </Badge>
                  <div className="text-sm text-gray-600">
                    {carouselIndex + 1} of {similarPackages.length}
                  </div>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateCarousel('next')}
                  className="rounded-full p-2 bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <ChevronRight size={16} />
                </Button>
              </div>

              <Card className="overflow-hidden bg-gradient-to-br from-white/90 via-emerald-50/80 to-green-50/80 backdrop-blur-xl border-0 shadow-2xl shadow-emerald-500/20">
                <CardContent className="p-8">
                  <div className="text-center space-y-6">
                    <div className="relative mx-auto w-20 h-20 bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-emerald-500/40">
                      <Package size={32} className="text-white drop-shadow-xl" />
                    </div>
                    
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">{currentPackage.name}</h3>
                      <p className="text-gray-600 mb-4">{currentPackage.description}</p>
                      
                      <div className="flex justify-center items-center space-x-6 mb-6">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-emerald-600">{currentPackage.meal_count}</div>
                          <div className="text-sm text-gray-600">Meals per week</div>
                        </div>
                        <div className="w-px h-8 bg-gray-300"></div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-emerald-600">£{currentPackage.price}</div>
                          <div className="text-sm text-gray-600">Per week</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <RadioGroup value={profile.deliveryFrequency} onValueChange={(value) => updateProfile("deliveryFrequency", value)}>
              <div className="space-y-4">
                <Card className={getCardClassName("One Time")}>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="One Time" id="one-time" className="sr-only" />
                      <Label htmlFor="one-time" className="cursor-pointer flex-1">
                        <div className="flex items-center space-x-4">
                          <div className={`relative p-4 rounded-2xl transition-all duration-500 backdrop-blur-sm ${
                            isOptionSelectedAndTransitioning("One Time") 
                              ? 'bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600 shadow-2xl shadow-emerald-500/50' 
                              : 'bg-gradient-to-br from-emerald-100/80 via-green-100/80 to-teal-100/80 group-hover:from-emerald-200/80 group-hover:via-green-200/80 group-hover:to-teal-200/80 shadow-lg'
                          }`}>
                            <Package className={getIconClassName("One Time")} size={24} />
                          </div>
                          <div className="flex-1">
                            <div className="font-bold text-lg text-gray-900 mb-1">One Time Purchase</div>
                            <div className="text-gray-600 text-sm leading-relaxed">Try our meals with a single order</div>
                          </div>
                        </div>
                      </Label>
                    </div>
                  </CardContent>
                </Card>

                <Card className={getCardClassName("Weekly")}>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Weekly" id="weekly" className="sr-only" />
                      <Label htmlFor="weekly" className="cursor-pointer flex-1">
                        <div className="flex items-center space-x-4">
                          <div className={`relative p-4 rounded-2xl transition-all duration-500 backdrop-blur-sm ${
                            isOptionSelectedAndTransitioning("Weekly") 
                              ? 'bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600 shadow-2xl shadow-emerald-500/50' 
                              : 'bg-gradient-to-br from-blue-100/80 via-indigo-100/80 to-cyan-100/80 group-hover:from-blue-200/80 group-hover:via-indigo-200/80 group-hover:to-cyan-200/80 shadow-lg'
                          }`}>
                            <Calendar className={getIconClassName("Weekly")} size={24} />
                          </div>
                          <div className="flex-1">
                            <div className="font-bold text-lg text-gray-900 mb-1">Weekly Subscription</div>
                            <div className="text-gray-600 text-sm leading-relaxed">Fresh meals delivered every week</div>
                          </div>
                        </div>
                      </Label>
                    </div>
                  </CardContent>
                </Card>

                <Card className={getCardClassName("Monthly")}>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Monthly" id="monthly" className="sr-only" />
                      <Label htmlFor="monthly" className="cursor-pointer flex-1">
                        <div className="flex items-center space-x-4">
                          <div className={`relative p-4 rounded-2xl transition-all duration-500 backdrop-blur-sm ${
                            isOptionSelectedAndTransitioning("Monthly") 
                              ? 'bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600 shadow-2xl shadow-emerald-500/50' 
                              : 'bg-gradient-to-br from-purple-100/80 via-pink-100/80 to-rose-100/80 group-hover:from-purple-200/80 group-hover:via-pink-200/80 group-hover:to-rose-200/80 shadow-lg'
                          }`}>
                            <Clock className={getIconClassName("Monthly")} size={24} />
                          </div>
                          <div className="flex-1">
                            <div className="font-bold text-lg text-gray-900 mb-1">Monthly Subscription</div>
                            <div className="text-gray-600 text-sm leading-relaxed">Convenient monthly meal delivery</div>
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

      default:
        return null;
    }
  };

  const StepIcon = steps[currentStep].icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <Link to="/" className="transition-opacity hover:opacity-80">
              <img 
                src={logo} 
                alt="Fit Food Tasty" 
                className="h-10 sm:h-12 w-auto object-contain"
              />
            </Link>
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-between mb-6">
              <Button 
                variant="ghost" 
                onClick={() => navigate('/')}
                className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-white/60 transition-all duration-300"
              >
                ✕
              </Button>
              
              <div className="flex items-center space-x-3 bg-gradient-to-r from-emerald-500/10 via-green-500/10 to-teal-500/10 px-6 py-3 rounded-2xl border border-emerald-200/50 backdrop-blur-sm shadow-lg">
                <div className="relative">
                  <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
                    <Flame size={16} className="text-white drop-shadow-sm" />
                  </div>
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
                  <StepIcon size={32} className="text-white drop-shadow-xl relative z-10" />
                </div>
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 bg-clip-text text-transparent mb-3">
                {steps[currentStep].title}
              </h1>
              <p className="text-gray-600 text-lg font-medium leading-relaxed">
                {steps[currentStep].subtitle}
              </p>
            </div>
          </div>

          {/* Content */}
          <Card className="bg-white/95 backdrop-blur-2xl border-0 shadow-xl rounded-3xl mb-8">
            <CardContent className="p-8">
              {renderStepContent()}
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex justify-between items-center">
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
        </div>
      </div>
    </div>
  );
};

export default Onboarding;