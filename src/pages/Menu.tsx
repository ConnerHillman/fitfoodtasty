import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import MealsGrid from "@/components/MealsGrid";
import PackagesBar, { MealPackage } from "@/components/packages/PackagesBar";
import PackageSelectionDialog from "@/components/packages/PackageSelectionDialog";
import { useViewTracking } from "@/hooks/useViewTracking";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Package } from "lucide-react";

const Menu = () => {
  const { user } = useAuth();
  const [selectedPackage, setSelectedPackage] = useState<MealPackage | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [onboardingPackage, setOnboardingPackage] = useState<MealPackage | null>(null);
  const [onboardingProfile, setOnboardingProfile] = useState<any>(null);

  // Track menu page view
  useViewTracking('menu');

  // Check for onboarding data on mount
  useEffect(() => {
    const storedProfile = localStorage.getItem('onboardingProfile');
    const storedPackage = localStorage.getItem('selectedPackage');
    
    if (storedProfile && storedPackage) {
      try {
        const profile = JSON.parse(storedProfile);
        const pkg = JSON.parse(storedPackage);
        setOnboardingProfile(profile);
        setOnboardingPackage(pkg);
        // Automatically open the package dialog for meal selection
        setSelectedPackage(pkg);
        setDialogOpen(true);
        // Clear the stored data
        localStorage.removeItem('onboardingProfile');
        localStorage.removeItem('selectedPackage');
      } catch (error) {
        console.error('Error parsing onboarding data:', error);
      }
    }
  }, []);

  const handleSelectPackage = (pkg: MealPackage) => {
    setSelectedPackage(pkg);
    setDialogOpen(true);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Special onboarding header */}
      {onboardingPackage && onboardingProfile && (
        <Card className="mb-8 bg-gradient-to-r from-emerald-50 via-green-50 to-teal-50 border-emerald-200">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <CardTitle className="text-2xl text-emerald-900">Your Perfect Plan is Ready!</CardTitle>
            </div>
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">
                <Package className="w-3 h-3 mr-1" />
                {onboardingPackage.name}
              </Badge>
              <Badge variant="outline" className="border-emerald-200 text-emerald-700">
                {onboardingProfile.deliveryFrequency}
              </Badge>
            </div>
            <p className="text-emerald-700">
              Based on your preferences, we've selected the <strong>{onboardingPackage.name}</strong> for you. 
              Choose your {onboardingPackage.meal_count} meals below and add them to your cart to complete your plan.
            </p>
          </CardHeader>
        </Card>
      )}

      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Fresh Meal Menu</h1>
          <p className="text-muted-foreground text-lg">Choose from our selection of nutritious, chef-prepared meals</p>
        </div>
        
        {/* Create Account CTA - Only show for non-authenticated users */}
        {!user && (
          <div className="flex items-center space-x-3">
            <div className="text-right hidden md:block">
              <p className="text-sm text-gray-600 mb-1">Save 20% on your first order</p>
              <p className="text-xs text-gray-500">Create a free account today</p>
            </div>
            <Button 
              asChild
              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold px-6 py-2 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            >
              <Link to="/auth">Create Account</Link>
            </Button>
          </div>
        )}
      </div>

      {/* Packages at the top */}
      <PackagesBar onSelect={handleSelectPackage} />

      {/* Standard menu below */}
      <MealsGrid />

      {/* Package selection modal */}
      <PackageSelectionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        pkg={selectedPackage}
      />
    </div>
  );
};

export default Menu;