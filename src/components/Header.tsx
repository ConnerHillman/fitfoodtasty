import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger } from "@/components/ui/navigation-menu";
import { Star, ChevronDown, User, LogOut, Settings, Shield, Menu, X, ShoppingCart } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useCart } from "@/contexts/CartContext";
import { useState } from "react";

const Header = () => {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const { getTotalItems } = useCart();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  return <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-green-100">
      {/* Promo Banner */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white py-2 px-4 text-center text-body-sm font-medium">
        <span className="font-bold">WELCOME OFFER: SAVE20</span> - Save 20% on your first box, 10% on your second box
      </div>
      
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <img 
              src="/lovable-uploads/a4f5ea12-e388-48b6-abc3-4e7e0ec80763.png" 
              alt="FIT FOOD TASTY Logo" 
              className="h-10 w-auto"
            />
            <Badge className="bg-green-100 text-green-800 text-caption">PREMIUM MEAL PREP</Badge>
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
                        <p className="text-body-sm text-gray-600">Browse our complete menu</p>
                      </Link>
                    </NavigationMenuLink>
                    <NavigationMenuLink asChild>
                      <Link to="/packages" className="block p-3 rounded-lg hover:bg-green-50 transition-colors">
                        <div className="font-semibold text-green-700">Meal Packages</div>
                        <p className="text-body-sm text-gray-600">Curated meal combinations</p>
                      </Link>
                    </NavigationMenuLink>
                    <NavigationMenuLink asChild>
                      <Link to="/subscriptions" className="block p-3 rounded-lg hover:bg-green-50 transition-colors">
                        <div className="font-semibold text-green-700">Subscriptions</div>
                        <p className="text-body-sm text-gray-600">Regular meal delivery plans</p>
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
                        <p className="text-body-sm text-gray-600">Our story and mission</p>
                      </Link>
                    </NavigationMenuLink>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>

              
            </NavigationMenuList>
          </NavigationMenu>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            {/* User Actions */}
            {user ? (
              <div className="flex items-center space-x-4">
                {!roleLoading && isAdmin() && (
                  <Button 
                    asChild 
                    className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold px-4 py-2 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                  >
                    <Link to="/admin" className="flex items-center space-x-2">
                      <Shield className="h-4 w-4" />
                      <span>ADMIN</span>
                    </Link>
                  </Button>
                )}
                {!isAdmin() && (
                  <span className="text-body-sm text-gray-600">
                    Welcome back!
                  </span>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center space-x-2 h-11 px-3">
                      <User className="h-4 w-4" />
                      <span>{user.email}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link to="/orders" className="flex items-center">
                        <User className="mr-2 h-4 w-4" />
                        My Orders
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/my-subscription" className="flex items-center">
                        <Star className="mr-2 h-4 w-4" />
                        My Subscription
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/account" className="flex items-center">
                        <Settings className="mr-2 h-4 w-4" />
                        Account Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={signOut} className="flex items-center">
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <>
                <Link to="/auth" className="text-gray-700 hover:text-green-600 font-medium">
                  LOGIN
                </Link>
                
                <Button asChild variant="outline" className="border-green-500 text-green-600 hover:bg-green-50 font-bold px-4 py-2 rounded-full transition-all duration-200">
                  <Link to="/auth">CREATE ACCOUNT</Link>
                </Button>
              </>
            )}
            
            {/* Cart Button - Primary CTA */}
            <Button asChild className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold px-6 py-2 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200">
              <Link to="/cart" className="flex items-center space-x-2">
                <ShoppingCart className="h-4 w-4" />
                <span>CART</span>
                {getTotalItems() > 0 && (
                  <Badge className="bg-white text-green-600 text-xs rounded-full min-w-[1.25rem] h-5 flex items-center justify-center ml-2">
                    {getTotalItems()}
                  </Badge>
                )}
              </Link>
            </Button>
          </div>

          {/* Mobile Actions */}
          <div className="flex md:hidden items-center space-x-2">
            {/* Mobile Cart Button - Primary CTA */}
            <Button asChild className="h-12 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold px-4 py-2 rounded-full">
              <Link to="/cart" className="flex items-center space-x-1">
                <ShoppingCart className="h-4 w-4" />
                <span>CART</span>
                {getTotalItems() > 0 && (
                  <Badge className="bg-white text-green-600 text-xs rounded-full min-w-[1rem] h-4 flex items-center justify-center ml-1">
                    {getTotalItems()}
                  </Badge>
                )}
              </Link>
            </Button>
            
            {/* Mobile Menu */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" className="h-12 w-12 p-2">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <nav className="flex flex-col space-y-4">
                  <div className="flex items-center justify-between">
                    <img 
                      src="/lovable-uploads/a4f5ea12-e388-48b6-abc3-4e7e0ec80763.png" 
                      alt="FIT FOOD TASTY Logo" 
                      className="h-8 w-auto"
                    />
                  </div>
                  
                  <div className="border-t pt-4 space-y-4">
                    <Link 
                      to="/menu" 
                      className="block text-heading-sm font-medium text-gray-700 hover:text-green-600 py-3 px-2 min-h-[44px] flex items-center"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Our Menu
                    </Link>
                    <Link 
                      to="/packages" 
                      className="block text-heading-sm font-medium text-gray-700 hover:text-green-600 py-3 px-2 min-h-[44px] flex items-center"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Meal Packages
                    </Link>
                    <Link 
                      to="/about" 
                      className="block text-heading-sm font-medium text-gray-700 hover:text-green-600 py-3 px-2 min-h-[44px] flex items-center"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      About Us
                    </Link>
                  </div>

                  {user ? (
                    <div className="border-t pt-4 space-y-4">
                      {!roleLoading && isAdmin() && (
                        <Link 
                          to="/admin" 
                          className="flex items-center space-x-2 text-red-600 font-medium py-2"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <Shield className="h-4 w-4" />
                          <span>ADMIN</span>
                        </Link>
                      )}
                      <Link 
                        to="/orders" 
                        className="flex items-center space-x-2 text-gray-700 hover:text-green-600 py-3 px-2 min-h-[44px]"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <User className="h-4 w-4" />
                        <span>My Orders</span>
                      </Link>
                      <Link 
                        to="/account" 
                        className="flex items-center space-x-2 text-gray-700 hover:text-green-600 py-3 px-2 min-h-[44px]"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <Settings className="h-4 w-4" />
                        <span>Account Settings</span>
                      </Link>
                      <button 
                        onClick={() => {
                          signOut();
                          setIsMobileMenuOpen(false);
                        }}
                        className="flex items-center space-x-2 text-gray-700 hover:text-red-600 py-3 px-2 w-full text-left min-h-[44px]"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  ) : (
                    <div className="border-t pt-4 space-y-4">
                      <Link 
                        to="/auth" 
                        className="block text-heading-sm font-medium text-gray-700 hover:text-green-600 py-3 px-2 min-h-[44px] flex items-center"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        Login
                      </Link>
                      <Button 
                        asChild 
                        variant="outline" 
                        className="w-full border-green-500 text-green-600 hover:bg-green-50 font-bold rounded-full h-12"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <Link to="/auth">CREATE ACCOUNT</Link>
                      </Button>
                    </div>
                  )}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>;
};
export default Header;