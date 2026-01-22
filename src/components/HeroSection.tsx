import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import PersonalizedResults from "./PersonalizedResults";
import aboutKitchenTeam from "@/assets/about-kitchen-team.jpg";

const HeroSection = () => {
  const navigate = useNavigate();
  const [showResults, setShowResults] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);

  const handleOnboardingComplete = (profile: any) => {
    setUserProfile(profile);
    setShowResults(true);
  };

  const handleStartOver = () => {
    setShowResults(false);
  };

  const handleGetStarted = () => {
    navigate('/onboarding');
  };

  // If showing results, render the PersonalizedResults component
  if (showResults && userProfile) {
    return <PersonalizedResults profile={userProfile} onStartOver={handleStartOver} />;
  }

  // Supabase public URL for Hero Chilli Chicken 1
  const mobileHeroImage = "https://aicpnaomarzgborltdkt.supabase.co/storage/v1/object/public/assets/Hero%20Chilli%20Chicken%201.png";

  const benefits = [
    "Designed by nutritionists, cooked by chefs",
    "Fresh ingredients, never frozen meals",
    "High protein, calorie-controlled portions",
    "Ready to eat in under 3 minutes",
  ];

  return (
    <section className="relative min-h-[100svh] overflow-hidden">
      {/* Background Image Layer */}
      <div className="absolute inset-0">
        {/* Mobile Hero Image */}
        <img 
          src={mobileHeroImage} 
          alt="Premium chef-prepared meal" 
          className="w-full h-full object-cover md:hidden" 
          style={{ objectPosition: '50% 40%' }} 
        />
        {/* Desktop/Tablet Hero Image */}
        <img 
          src={aboutKitchenTeam} 
          alt="Professional kitchen team" 
          className="hidden md:block w-full h-full object-cover" 
        />
        
        {/* Bottom-weighted gradient overlay - Mobile */}
        <div className="absolute inset-0 md:hidden bg-gradient-to-t from-black/90 via-black/50 via-40% to-black/20" />
        
        {/* Bottom-weighted gradient overlay - Desktop */}
        <div className="absolute inset-0 hidden md:block bg-gradient-to-t from-black/85 via-black/40 via-50% to-black/10" />
      </div>

      {/* Content Container */}
      <div className="relative z-10 min-h-[100svh] flex flex-col justify-end">
        <div className="container mx-auto px-5 pb-10 pt-20 md:pb-16 md:pt-32 lg:pb-20">
          <div className="max-w-xl lg:max-w-2xl space-y-6 md:space-y-8">
            
            {/* Eyebrow Tag */}
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
              <span className="text-sm font-medium text-white/90 tracking-wide">
                Chef-cooked. Nutrition-led.
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-[1.1] tracking-tight">
              Restaurant-quality meal prep—ready in 3&nbsp;minutes.
            </h1>

            {/* Supporting Subheadline */}
            <p className="text-lg md:text-xl text-white/80 leading-relaxed max-w-lg">
              Premium meals designed by nutritionists and prepared by professional chefs. 
              Delivered fresh to your door, ready when you are.
            </p>

            {/* Benefit Bullets */}
            <ul className="space-y-3 pt-2">
              {benefits.map((benefit, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    <Check className="w-5 h-5 text-primary" strokeWidth={2.5} />
                  </div>
                  <span className="text-base text-white/85 leading-snug">
                    {benefit}
                  </span>
                </li>
              ))}
            </ul>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-4">
              <Button 
                size="lg" 
                onClick={handleGetStarted} 
                className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8 py-6 text-base rounded-full shadow-lg hover:shadow-xl transition-all duration-200"
              >
                Start My Plan
              </Button>
              
              <Button 
                asChild 
                variant="ghost" 
                size="lg" 
                className="w-full sm:w-auto text-white hover:text-white hover:bg-white/10 font-medium px-6 py-6 rounded-full"
              >
                <Link to="/menu">Browse Menu</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Subtle scroll indicator - Mobile only */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 md:hidden">
        <div className="w-6 h-10 rounded-full border-2 border-white/30 flex justify-center pt-2">
          <div className="w-1 h-2 bg-white/50 rounded-full animate-pulse" />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
