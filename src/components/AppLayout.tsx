import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  ShieldCheck, 
  User, 
  Facebook, 
  Instagram, 
  Youtube, 
  CreditCard, 
  Shield,
  Truck,
  Mail
} from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/hooks/use-toast';
import Header from './Header';

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const [searchParams] = useSearchParams();
  const { adminOrderData } = useCart();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [isSubscribing, setIsSubscribing] = useState(false);
  const isAdminMode = searchParams.get('admin_order') === 'true' || adminOrderData;

  const handleNewsletterSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    
    setIsSubscribing(true);
    // Simulate subscription (would connect to email service in production)
    await new Promise(resolve => setTimeout(resolve, 500));
    toast({
      title: "Subscribed!",
      description: "You'll receive updates on new meals and offers.",
    });
    setEmail('');
    setIsSubscribing(false);
  };

  const socialLinks = [
    { icon: Facebook, href: "https://www.facebook.com/FitFoodTastyBridgwater", label: "Facebook" },
    { icon: Instagram, href: "https://www.instagram.com/fitfood.tasty/", label: "Instagram" },
    { icon: Youtube, href: "https://www.youtube.com/channel/UCBZqk7QRvDrzXsay5fdfQTw", label: "YouTube" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Admin Mode Banner */}
      {isAdminMode && adminOrderData && (
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4">
          <div className="container mx-auto flex items-center justify-center gap-3">
            <ShieldCheck className="h-5 w-5" />
            <span className="font-medium">Admin Mode Active</span>
            <Badge variant="secondary" className="bg-card/20 text-primary-foreground border-primary-foreground/30">
              <User className="h-3 w-3 mr-1" />
              {adminOrderData.customerName}
            </Badge>
            <span className="text-sm opacity-90">
              Creating manual order
            </span>
          </div>
        </div>
      )}
      
      <main>{children}</main>
      
      {/* Enhanced Footer */}
      <footer className="bg-card border-t border-border mt-auto">
        <div className="container mx-auto px-4 py-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8">
            {/* Brand & Newsletter */}
            <div className="sm:col-span-2 lg:col-span-2 space-y-5">
              <img 
                src="/lovable-uploads/a4f5ea12-e388-48b6-abc3-4e7e0ec80763.png" 
                alt="Fit Food Tasty" 
                className="h-8 w-auto"
              />
              <p className="text-sm text-muted-foreground">
                Fresh, nutritious meal prep delivered to your door. Quality ingredients, expert preparation, exceptional taste.
              </p>
              
              {/* Newsletter Signup */}
              <div className="space-y-2">
                <p className="text-sm font-medium flex items-center gap-2">
                  <Mail className="h-4 w-4 text-primary" />
                  Stay updated with new meals & offers
                </p>
                <form onSubmit={handleNewsletterSubscribe} className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="max-w-[220px] h-9 text-sm"
                    required
                  />
                  <Button 
                    type="submit" 
                    size="sm" 
                    disabled={isSubscribing}
                    className="h-9"
                  >
                    {isSubscribing ? "..." : "Subscribe"}
                  </Button>
                </form>
              </div>
            </div>
            
            {/* Quick Links */}
            <div>
              <h3 className="font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-sm">
                <li><Link to="/menu" className="text-muted-foreground hover:text-foreground transition-colors">Menu</Link></li>
                <li><Link to="/packages" className="text-muted-foreground hover:text-foreground transition-colors">Packages</Link></li>
                <li><Link to="/about" className="text-muted-foreground hover:text-foreground transition-colors">About Us</Link></li>
                <li><Link to="/orders" className="text-muted-foreground hover:text-foreground transition-colors">My Orders</Link></li>
                <li><Link to="/contact" className="text-muted-foreground hover:text-foreground transition-colors">Contact</Link></li>
              </ul>
            </div>
            
            {/* Support & Legal */}
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-sm">
                <li><Link to="/contact" className="text-muted-foreground hover:text-foreground transition-colors">Help & FAQ</Link></li>
                <li><Link to="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</Link></li>
                <li><Link to="/terms" className="text-muted-foreground hover:text-foreground transition-colors">Terms of Service</Link></li>
                <li><a href="mailto:info@fitfoodtasty.co.uk" className="text-muted-foreground hover:text-foreground transition-colors">Email Support</a></li>
              </ul>
            </div>
            
            {/* Social & Trust */}
            <div className="space-y-5">
              {/* Contact Info */}
              <div>
                <h3 className="font-semibold mb-3">Get in Touch</h3>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>Bridgwater, Somerset, UK</p>
                  <a href="mailto:info@fitfoodtasty.co.uk" className="hover:text-foreground transition-colors">
                    info@fitfoodtasty.co.uk
                  </a>
                </div>
              </div>

              {/* Social Links */}
              <div>
                <p className="text-sm font-medium mb-3">Follow Us</p>
                <div className="flex gap-3">
                  {socialLinks.map(({ icon: Icon, href, label }) => (
                    <a
                      key={label}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-full bg-muted hover:bg-primary hover:text-primary-foreground transition-colors"
                      aria-label={label}
                    >
                      <Icon className="h-4 w-4" />
                    </a>
                  ))}
                </div>
              </div>

              {/* Delivery Info Teaser */}
              <div className="flex items-start gap-2 text-xs text-muted-foreground">
                <Truck className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                <span>Local delivery Sun/Mon/Wed • Nationwide via DPD • Free collection available</span>
              </div>
            </div>
          </div>
          
          {/* Payment & Security Badges */}
          <div className="border-t border-border mt-8 pt-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* Payment Methods */}
              <div className="flex items-center gap-4">
                <span className="text-xs text-muted-foreground">We accept:</span>
                <div className="flex items-center gap-2">
                  <div className="px-2 py-1 bg-muted rounded text-xs font-medium">Visa</div>
                  <div className="px-2 py-1 bg-muted rounded text-xs font-medium">Mastercard</div>
                  <div className="px-2 py-1 bg-muted rounded text-xs font-medium">Amex</div>
                  <div className="px-2 py-1 bg-muted rounded text-xs font-medium">Apple Pay</div>
                </div>
              </div>

              {/* Security Badge */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Shield className="h-4 w-4 text-green-600" />
                <span>Secure checkout powered by Stripe</span>
              </div>
            </div>
          </div>
          
          {/* Copyright */}
          <div className="border-t border-border mt-6 pt-6 text-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} Fit Food Tasty. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AppLayout;
