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
  return <section className="relative min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img src="/src/assets/about-kitchen-team.jpg" alt="Premium meal prep kitchen" className="w-full h-full object-cover opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-gray-900/50 to-transparent"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-20 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="text-white space-y-8">
            <div className="space-y-4">
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-sm px-4 py-2">
                Premium Meal Prep
              </Badge>
              
              <h1 className="text-5xl lg:text-7xl font-bold leading-tight">
                <span className="text-white">PREMIUM</span>
                <br />
                <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                  MEAL PREP
                </span>
              </h1>
            </div>

            {/* Value Props */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Flame className="text-green-400" size={20} />
                <span className="text-lg font-medium">High Protein, Calorie Controlled</span>
              </div>
              <div className="flex items-center space-x-3">
                <Clock className="text-green-400" size={20} />
                <span className="text-lg font-medium">Ready to Eat in 3 mins</span>
              </div>
              <div className="flex items-center space-x-3">
                <Users className="text-green-400" size={20} />
                <span className="text-lg font-medium">Simple Weekly Subscription</span>
              </div>
              <div className="flex items-center space-x-3">
                <Award className="text-green-400" size={20} />
                <span className="text-lg font-medium">Designed by Nutritionists, prepared by Elite Chefs</span>
              </div>
            </div>

             {/* CTA */}
             <div className="space-y-4">
               <Button size="lg" onClick={handleGetStarted} className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold px-8 py-4 text-lg rounded-full shadow-2xl hover:shadow-green-500/25 transform hover:scale-105 transition-all duration-200">
                 ✨ Create Your Perfect Plan
               </Button>
               
               <div className="flex items-center space-x-4">
                 <Button asChild variant="outline" size="lg" className="border-2 border-white text-white hover:bg-white hover:text-gray-900 font-bold px-6 py-3 rounded-full backdrop-blur-sm">
                   <Link to="/auth">Create Free Account</Link>
                 </Button>
                 
                 <Button asChild variant="ghost" size="lg" className="text-white hover:bg-white/20 font-medium px-6 py-3 rounded-full">
                   <Link to="/menu">Browse Menu</Link>
                 </Button>
               </div>
               
               
             </div>
          </div>

          {/* Right Content - Social Proof */}
          <div className="space-y-8">
            {/* Stats */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
              <h3 className="text-2xl font-bold text-white mb-6">
                Over 500,000 Meals Delivered
              </h3>
              
              {/* Trustpilot Style Reviews */}
              <div className="space-y-6">
                <div className="flex items-center space-x-2 mb-4">
                  <div className="flex items-center space-x-1">
                    {[...Array(5)].map((_, i) => <Star key={i} size={16} className="fill-green-400 text-green-400" />)}
                  </div>
                  <span className="text-white font-semibold">4.8/5</span>
                  <span className="text-gray-300 text-sm">Excellent on Trustpilot</span>
                </div>

                {/* Sample Reviews */}
                <div className="space-y-4">
                  <div className="border-l-4 border-green-400 pl-4">
                    <p className="text-white text-sm mb-2">
                      "The best meal prep service I have used. Quality is outstanding and the convenience is unmatched."
                    </p>
                    <div className="flex items-center space-x-2">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => <Star key={i} size={12} className="fill-green-400 text-green-400" />)}
                      </div>
                      <span className="text-gray-300 text-xs">- Sarah M.</span>
                    </div>
                  </div>

                  <div className="border-l-4 border-green-400 pl-4">
                    <p className="text-white text-sm mb-2">
                      "Perfect portions, amazing flavours. Has completely changed my approach to healthy eating."
                    </p>
                    <div className="flex items-center space-x-2">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => <Star key={i} size={12} className="fill-green-400 text-green-400" />)}
                      </div>
                      <span className="text-gray-300 text-xs">- James R.</span>
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