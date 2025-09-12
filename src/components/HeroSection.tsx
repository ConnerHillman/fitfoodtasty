import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Check, Clock, Package, ChefHat } from "lucide-react";
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
  return <section className="relative min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img src="/src/assets/about-meal-selection.jpg" alt="Fresh chef-prepared meals" className="w-full h-full object-cover opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-r from-white/90 via-white/70 to-emerald-50/80"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-20 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            <div className="space-y-6">
              <Badge className="bg-green-500 text-white border-green-500 text-sm px-4 py-2 font-semibold">
                Chef-Prepared Excellence
              </Badge>
              
              <h1 className="text-5xl lg:text-6xl font-bold leading-tight text-gray-900">
                Healthy Eating Made 
                <span className="block bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  Simple, Fresh & Delicious
                </span>
              </h1>
              
              <p className="text-xl text-gray-600 leading-relaxed max-w-lg">
                Chef-prepared, protein-packed meals designed by nutritionists. Delivered fresh to fuel your lifestyle.
              </p>
            </div>

            {/* Key Features */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3 bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-green-100">
                <div className="flex-shrink-0 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <Check className="text-white" size={16} />
                </div>
                <span className="text-gray-800 font-medium">High Protein, Macro Balanced</span>
              </div>
              <div className="flex items-center space-x-3 bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-green-100">
                <div className="flex-shrink-0 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <Clock className="text-white" size={16} />
                </div>
                <span className="text-gray-800 font-medium">Ready in 3 Minutes</span>
              </div>
              <div className="flex items-center space-x-3 bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-green-100">
                <div className="flex-shrink-0 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <Package className="text-white" size={16} />
                </div>
                <span className="text-gray-800 font-medium">Weekly Flexible Plans</span>
              </div>
              <div className="flex items-center space-x-3 bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-green-100">
                <div className="flex-shrink-0 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <ChefHat className="text-white" size={16} />
                </div>
                <span className="text-gray-800 font-medium">Fresh, Chef-Crafted Variety</span>
              </div>
            </div>

             {/* CTA */}
             <div className="space-y-4">
               <Button size="lg" onClick={handleGetStarted} className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold px-8 py-4 text-lg rounded-full shadow-xl hover:shadow-green-500/30 transform hover:scale-105 transition-all duration-200">
                 🍴 Create Your Perfect Plan
               </Button>
               
               <div className="flex flex-col sm:flex-row gap-3">
                 <Button asChild variant="outline" size="lg" className="border-2 border-green-500 text-green-600 hover:bg-green-50 font-semibold px-6 py-3 rounded-full">
                   <Link to="/menu">Browse Menu</Link>
                 </Button>
               </div>
             </div>
          </div>

          {/* Right Content - Social Proof */}
          <div className="space-y-6">
            {/* Trust Badge */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-green-100 shadow-lg">
              <div className="text-center mb-6">
                <h3 className="text-3xl font-bold text-gray-900 mb-2">
                  Over 500,000 Meals Delivered
                </h3>
                <div className="flex items-center justify-center space-x-2">
                  <div className="flex items-center space-x-1">
                    {[...Array(5)].map((_, i) => <Star key={i} size={20} className="fill-yellow-400 text-yellow-400" />)}
                  </div>
                  <span className="text-gray-900 font-bold text-lg">4.8/5</span>
                  <span className="text-gray-600">on Trustpilot</span>
                </div>
              </div>
              
              {/* Sample Reviews */}
              <div className="space-y-4">
                <div className="bg-green-50 rounded-lg p-4 border-l-4 border-green-500">
                  <p className="text-gray-800 text-sm mb-2 italic">
                    "The best meal prep service I have used. Quality is outstanding and the convenience is unmatched."
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => <Star key={i} size={12} className="fill-yellow-400 text-yellow-400" />)}
                    </div>
                    <span className="text-gray-600 text-xs font-medium">- Sarah M.</span>
                  </div>
                </div>

                <div className="bg-green-50 rounded-lg p-4 border-l-4 border-green-500">
                  <p className="text-gray-800 text-sm mb-2 italic">
                    "Perfect portions, amazing flavours. Has completely changed my approach to healthy eating."
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => <Star key={i} size={12} className="fill-yellow-400 text-yellow-400" />)}
                    </div>
                    <span className="text-gray-600 text-xs font-medium">- James R.</span>
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