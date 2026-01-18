import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Flame, Clock, Users, Award } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import PersonalizedResults from "./PersonalizedResults";
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

  return <section className="relative min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black overflow-hidden">
      {/* Background Image - Mobile uses Supabase hero image, desktop uses kitchen team */}
      <div className="absolute inset-0">
        {/* Mobile Hero Image */}
        <img 
          src={mobileHeroImage} 
          alt="Premium chilli chicken meal" 
          className="w-full h-full object-cover md:hidden" 
          style={{ objectPosition: 'center' }}
        />
        {/* Desktop/Tablet Hero Image */}
        <img 
          src="/src/assets/about-kitchen-team.jpg" 
          alt="Premium meal prep kitchen" 
          className="hidden md:block w-full h-full object-cover opacity-40" 
        />
        {/* Mobile: Strong top-to-bottom dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80 md:hidden"></div>
        {/* Desktop: Original horizontal gradient */}
        <div className="absolute inset-0 hidden md:block bg-gradient-to-r from-black/70 via-gray-900/50 to-transparent"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-20 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="text-foreground space-y-8">
            <div className="space-y-4">
              <Badge className="bg-primary/20 text-primary-foreground border-primary/30 text-sm px-4 py-2 font-medium">
                Premium Meal Prep
              </Badge>
              
              <h1 className="text-display-lg">
                <span className="text-primary-foreground">PREMIUM</span>
                <br />
                <span className="text-primary-foreground opacity-90">
                  MEAL PREP
                </span>
              </h1>
            </div>

            {/* Value Props */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Flame className="text-primary-foreground/80" size={20} />
                <span className="text-body-lg font-medium text-primary-foreground/90">High Protein, Calorie Controlled</span>
              </div>
              <div className="flex items-center space-x-3">
                <Clock className="text-primary-foreground/80" size={20} />
                <span className="text-body-lg font-medium text-primary-foreground/90">Ready to Eat in 3 mins</span>
              </div>
              <div className="flex items-center space-x-3">
                <Users className="text-primary-foreground/80" size={20} />
                <span className="text-body-lg font-medium text-primary-foreground/90">Simple Weekly Subscription</span>
              </div>
              <div className="flex items-center space-x-3">
                <Award className="text-primary-foreground/80" size={20} />
                <span className="text-body-lg font-medium text-primary-foreground/90">Designed by Nutritionists, prepared by Elite Chefs</span>
              </div>
            </div>

             {/* CTA */}
             <div className="space-y-4">
               <Button size="lg" onClick={handleGetStarted} className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-8 py-4 btn-text-mobile-lg rounded-full shadow-cta hover:shadow-cta-hover transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 ease-out">
                 ✨ Create Your Perfect Plan
               </Button>
               
               <div className="flex items-center space-x-4">
              <Button asChild variant="outline" size="lg" className="border-2 border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary font-bold px-6 py-3 rounded-full backdrop-blur-sm">
                <Link to="/auth">Create Free Account</Link>
              </Button>
              
              <Button asChild variant="ghost" size="lg" className="text-primary-foreground hover:bg-primary-foreground/20 font-medium px-6 py-3 rounded-full">
                <Link to="/menu">Browse Menu</Link>
              </Button>
               </div>
               
               
             </div>
          </div>

          {/* Right Content - Social Proof */}
          <div className="space-y-8">
            {/* Stats */}
            <div className="bg-primary-foreground/10 backdrop-blur-sm rounded-2xl p-8 border border-primary-foreground/20">
              <h3 className="text-heading-lg text-primary-foreground mb-6">
                Over 500,000 Meals Delivered
              </h3>
              
              {/* Trustpilot Style Reviews */}
              <div className="space-y-6">
                <div className="flex items-center space-x-2 mb-4">
                  <div className="flex items-center space-x-1">
                    {[...Array(5)].map((_, i) => <Star key={i} size={16} className="fill-primary-foreground/90 text-primary-foreground/90" />)}
                  </div>
                  <span className="text-primary-foreground font-semibold">4.8/5</span>
                  <span className="text-primary-foreground/60 text-sm">Excellent on Trustpilot</span>
                </div>

                {/* Sample Reviews */}
                <div className="space-y-4">
                  <div className="border-l-2 border-primary-foreground/40 pl-4">
                    <p className="text-primary-foreground/90 text-sm mb-2 leading-relaxed">
                      "The best meal prep service I have used. Quality is outstanding and the convenience is unmatched."
                    </p>
                    <div className="flex items-center space-x-2">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => <Star key={i} size={12} className="fill-primary-foreground/80 text-primary-foreground/80" />)}
                      </div>
                      <span className="text-primary-foreground/50 text-xs">- Sarah M.</span>
                    </div>
                  </div>

                  <div className="border-l-2 border-primary-foreground/40 pl-4">
                    <p className="text-primary-foreground/90 text-sm mb-2 leading-relaxed">
                      "Perfect portions, amazing flavours. Has completely changed my approach to healthy eating."
                    </p>
                    <div className="flex items-center space-x-2">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => <Star key={i} size={12} className="fill-primary-foreground/80 text-primary-foreground/80" />)}
                      </div>
                      <span className="text-primary-foreground/50 text-xs">- James R.</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white animate-bounce">
        <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-white/50 rounded-full mt-2 animate-pulse"></div>
        </div>
      </div>
    </section>;
};
export default HeroSection;