import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Calendar, BarChart3, Settings, ChefHat, Package, Info, Shield } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  const { getTotalItems } = useCart();
  const customerNavItems = [
    { to: '/', label: 'Menu', icon: ChefHat },
    { to: '/about', label: 'About Us', icon: Info },
    { to: '/orders', label: 'My Orders', icon: Package },
    { to: '/subscription', label: 'Subscription', icon: Calendar },
  ];

  const navItems = customerNavItems;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <Link to="/" className="flex items-center">
                <img 
                  src="/lovable-uploads/10536b16-bcbb-425b-ad58-6c366dfcc3a9.png" 
                  alt="Fit Food Tasty" 
                  className="h-8 w-auto"
                />
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
              <Button variant="outline" size="sm" asChild>
                <Link to="/cart">
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Cart ({getTotalItems()})
                </Link>
              </Button>
              <Button 
                asChild 
                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold px-4 py-2 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
              >
                <Link to="/admin" className="flex items-center space-x-2">
                  <Shield className="h-4 w-4" />
                  <span>ADMIN</span>
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </header>
      
      <main>{children}</main>
      
      {/* Footer */}
      <footer className="bg-card border-t border-border mt-auto">
        <div className="container mx-auto px-4 py-8">
          <div className="grid md:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="space-y-4">
              <img 
                src="/lovable-uploads/10536b16-bcbb-425b-ad58-6c366dfcc3a9.png" 
                alt="Fit Food Tasty" 
                className="h-8 w-auto"
              />
              <p className="text-sm text-muted-foreground">
                Fresh, nutritious meal prep delivered to your door. Quality ingredients, expert preparation, exceptional taste.
              </p>
            </div>
            
            {/* Quick Links */}
            <div>
              <h3 className="font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-sm">
                <li><Link to="/menu" className="text-muted-foreground hover:text-foreground">Menu</Link></li>
                <li><Link to="/about" className="text-muted-foreground hover:text-foreground">About Us</Link></li>
                <li><Link to="/orders" className="text-muted-foreground hover:text-foreground">My Orders</Link></li>
                <li><Link to="/contact" className="text-muted-foreground hover:text-foreground">Contact</Link></li>
              </ul>
            </div>
            
            {/* Legal */}
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm">
                <li><Link to="/privacy" className="text-muted-foreground hover:text-foreground">Privacy Policy</Link></li>
                <li><Link to="/terms" className="text-muted-foreground hover:text-foreground">Terms of Service</Link></li>
                <li><a href="mailto:info@fitfoodtasty.co.uk" className="text-muted-foreground hover:text-foreground">Support</a></li>
              </ul>
            </div>
            
            {/* Contact */}
            <div>
              <h3 className="font-semibold mb-4">Get in Touch</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>Bridgwater, Somerset, UK</p>
                <a href="mailto:info@fitfoodtasty.co.uk" className="hover:text-foreground">
                  info@fitfoodtasty.co.uk
                </a>
              </div>
            </div>
          </div>
          
          <div className="border-t border-border mt-8 pt-6 text-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} Fit Food Tasty. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;