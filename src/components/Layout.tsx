import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Calendar, BarChart3, Settings, ChefHat, Package } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  const isBusinessRoute = location.pathname.startsWith('/business');

  const customerNavItems = [
    { to: '/', label: 'Menu', icon: ChefHat },
    { to: '/orders', label: 'My Orders', icon: Package },
    { to: '/subscription', label: 'Subscription', icon: Calendar },
  ];

  const businessNavItems = [
    { to: '/business', label: 'Dashboard', icon: BarChart3 },
    { to: '/business/orders', label: 'Orders', icon: Package },
    { to: '/business/kitchen', label: 'Kitchen', icon: ChefHat },
    { to: '/business/analytics', label: 'Analytics', icon: BarChart3 },
    { to: '/business/settings', label: 'Settings', icon: Settings },
  ];

  const navItems = isBusinessRoute ? businessNavItems : customerNavItems;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <Link to="/" className="text-2xl font-bold text-primary">
                MealPrep Pro
              </Link>
              <nav className="hidden md:flex space-x-6">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-colors ${
                        location.pathname === item.to
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
            
            <div className="flex items-center space-x-4">
              {!isBusinessRoute && (
                <Button variant="outline" size="sm">
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Cart (0)
                </Button>
              )}
              <Button 
                variant={isBusinessRoute ? "outline" : "default"}
                size="sm"
                asChild
              >
                <Link to={isBusinessRoute ? "/" : "/business"}>
                  {isBusinessRoute ? "Customer View" : "Business Dashboard"}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </header>
      
      <main>{children}</main>
    </div>
  );
};

export default Layout;