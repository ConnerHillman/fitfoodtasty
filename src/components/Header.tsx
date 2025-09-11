import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  NavigationMenu, 
  NavigationMenuContent, 
  NavigationMenuItem, 
  NavigationMenuLink, 
  NavigationMenuList, 
  NavigationMenuTrigger 
} from "@/components/ui/navigation-menu";
import { Star, ChevronDown } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const Header = () => {
  const location = useLocation();

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-green-100">
      {/* Promo Banner */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white py-2 px-4 text-center text-sm font-medium">
        <span className="font-bold">WELCOME OFFER: SAVE20</span> - Save 20% on your first box, 10% on your second box
      </div>
      
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              FIT FOOD TASTY
            </div>
            <Badge className="bg-green-100 text-green-800 text-xs">PREMIUM MEAL PREP</Badge>
          </Link>

          {/* Navigation */}
          <NavigationMenu className="hidden md:flex">
            <NavigationMenuList className="space-x-6">
              <NavigationMenuItem>
                <NavigationMenuTrigger className="text-gray-700 hover:text-green-600 font-medium">
                  OUR MENU
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="grid gap-3 p-6 w-[400px]">
                    <NavigationMenuLink asChild>
                      <Link to="/menu" className="block p-3 rounded-lg hover:bg-green-50 transition-colors">
                        <div className="font-semibold text-green-700">All Meals</div>
                        <p className="text-sm text-gray-600">Browse our complete menu</p>
                      </Link>
                    </NavigationMenuLink>
                    <NavigationMenuLink asChild>
                      <Link to="/packages" className="block p-3 rounded-lg hover:bg-green-50 transition-colors">
                        <div className="font-semibold text-green-700">Meal Packages</div>
                        <p className="text-sm text-gray-600">Curated meal combinations</p>
                      </Link>
                    </NavigationMenuLink>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuTrigger className="text-gray-700 hover:text-green-600 font-medium">
                  EXPLORE
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="grid gap-3 p-6 w-[300px]">
                    <NavigationMenuLink asChild>
                      <Link to="/about" className="block p-3 rounded-lg hover:bg-green-50 transition-colors">
                        <div className="font-semibold text-green-700">About Us</div>
                        <p className="text-sm text-gray-600">Our story and mission</p>
                      </Link>
                    </NavigationMenuLink>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link to="/business" className="text-gray-700 hover:text-green-600 font-medium">
                    FOR BUSINESS
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>

          {/* Trust & Actions */}
          <div className="flex items-center space-x-4">
            {/* Trustpilot */}
            <div className="hidden lg:flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={14} className="fill-green-500 text-green-500" />
                ))}
              </div>
              <span className="text-sm font-medium text-gray-700">4.7/5</span>
              <span className="text-xs text-gray-500">Trustpilot</span>
            </div>

            {/* User Actions */}
            <Link to="/auth" className="text-gray-700 hover:text-green-600 font-medium hidden md:block">
              LOGIN
            </Link>
            
            <Button 
              asChild
              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold px-6 py-2 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            >
              <Link to="/menu">ORDER NOW</Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;