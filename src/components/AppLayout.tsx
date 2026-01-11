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
    <div className="min-h-screen bg-background overflow-x-hidden">
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
                <li><Link to="/faq" className="text-muted-foreground hover:text-foreground transition-colors">FAQ</Link></li>
                <li><Link to="/contact" className="text-muted-foreground hover:text-foreground transition-colors">Contact Us</Link></li>
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
                <div className="flex items-center gap-3">
                  {/* Visa */}
                  <div className="bg-white rounded-md px-3 py-2 flex items-center justify-center h-10 w-14 shadow-sm">
                    <svg viewBox="0 0 38 24" className="h-6 w-auto" aria-label="Visa">
                      <path fill="#1434CB" d="M35 0H3C1.3 0 0 1.3 0 3v18c0 1.7 1.4 3 3 3h32c1.7 0 3-1.3 3-3V3c0-1.7-1.4-3-3-3z"/>
                      <path fill="#fff" d="M15.8 15.6l1.4-8.1h2.2l-1.4 8.1h-2.2zm9.8-7.9c-.4-.2-1.1-.4-1.9-.4-2.1 0-3.6 1.1-3.6 2.6 0 1.1 1.1 1.7 1.9 2.1.8.4 1.1.6 1.1 1 0 .5-.7.8-1.3.8-.9 0-1.3-.1-2.1-.5l-.3-.1-.3 1.8c.5.2 1.5.4 2.5.4 2.2 0 3.7-1.1 3.7-2.7 0-.9-.6-1.6-1.8-2.2-.8-.4-1.2-.6-1.2-1 0-.3.4-.7 1.2-.7.7 0 1.2.1 1.6.3l.2.1.3-1.5zm5.4-.2h-1.6c-.5 0-.9.1-1.1.6l-3.2 7.5h2.2l.4-1.2h2.7l.3 1.2h2l-1.7-8.1zm-2.6 5.2c.2-.5.8-2.2.8-2.2l.5 2.2h-1.3zM13.7 7.5L11.6 13l-.2-1.2c-.4-1.3-1.6-2.7-2.9-3.4l1.9 7.1h2.3l3.4-8h-2.4z"/>
                      <path fill="#F9A533" d="M9.6 7.5H6.2l-.1.2c2.7.7 4.5 2.3 5.2 4.3l-.7-3.9c-.1-.5-.5-.6-1-.6z"/>
                    </svg>
                  </div>
                  {/* Mastercard */}
                  <div className="bg-white rounded-md px-3 py-2 flex items-center justify-center h-10 w-14 shadow-sm">
                    <svg viewBox="0 0 38 24" className="h-6 w-auto" aria-label="Mastercard">
                      <path fill="#000" d="M35 0H3C1.3 0 0 1.3 0 3v18c0 1.7 1.4 3 3 3h32c1.7 0 3-1.3 3-3V3c0-1.7-1.4-3-3-3z"/>
                      <circle fill="#EB001B" cx="15" cy="12" r="7"/>
                      <circle fill="#F79E1B" cx="23" cy="12" r="7"/>
                      <path fill="#FF5F00" d="M19 7.2c1.5 1.2 2.5 3 2.5 5s-1 3.8-2.5 5c-1.5-1.2-2.5-3-2.5-5s1-3.8 2.5-5z"/>
                    </svg>
                  </div>
                  {/* Amex */}
                  <div className="bg-[#006FCF] rounded-md px-3 py-2 flex items-center justify-center h-10 w-14 shadow-sm">
                    <svg viewBox="0 0 38 24" className="h-6 w-auto" aria-label="American Express">
                      <path fill="#fff" d="M8.5 11.2l-.8-2-.8 2h1.6zm18.1-1.4v-.6h-2.2v1.2h2.1v-.6zm0 2.4v-.6h-2.2v1.2h2.1v-.6zm-18.1 0l-.8-2-.8 2h1.6zM35 0H3C1.3 0 0 1.3 0 3v18c0 1.7 1.4 3 3 3h32c1.7 0 3-1.3 3-3V3c0-1.7-1.4-3-3-3zm-3 15.5h-1.7l-1.5-2.2-1.5 2.2h-4.2v-7h4.2l1.5 2.2 1.5-2.2h3.6l-2.7 3.5 2.8 3.5zm-13.9 0H15l-.5-1.2h-2.6l-.5 1.2H8.3l2.9-7h2.9l3 7zm-9.6 0H5.4v-7h3.1c1.5 0 2.5.9 2.5 2.2 0 1.1-.7 1.9-1.7 2.1l2.2 2.7z"/>
                    </svg>
                  </div>
                  {/* Apple Pay */}
                  <div className="bg-black rounded-md px-3 py-2 flex items-center justify-center h-10 w-14 shadow-sm">
                    <svg viewBox="0 0 38 24" className="h-6 w-auto" aria-label="Apple Pay">
                      <path fill="#fff" d="M11.2 7.8c-.4.5-1 .8-1.6.8-.1-.6.2-1.3.5-1.7.4-.5 1-.8 1.5-.8.1.6-.1 1.2-.4 1.7zm.4 1c-.9 0-1.6.5-2 .5s-1.1-.5-1.8-.5c-.9 0-1.8.5-2.3 1.4-.9 1.6-.2 4 .7 5.3.5.7 1 1.4 1.8 1.4.7 0 1-.5 1.8-.5s1.1.5 1.8.5 1.2-.7 1.7-1.4c.5-.8.7-1.6.7-1.6-.1 0-1.4-.5-1.4-2.1 0-1.3 1.1-2 1.2-2-.7-1-1.7-1-2.2-1zm9.3.3v7h1.3v-2.4h1.8c1.6 0 2.8-1.1 2.8-2.8s-1.1-2.8-2.8-2.8h-3.1zm1.3 1.1h1.5c1.1 0 1.7.6 1.7 1.7s-.6 1.7-1.7 1.7h-1.5V10.2zm6.4 6c.8 0 1.5-.4 1.9-1.1h.1v1h1.2v-3.5c0-1.2-1-2-2.5-2s-2.4.8-2.4 2h1.2c.1-.6.6-.9 1.2-.9.7 0 1.1.4 1.1 1v.5l-1.5.1c-1.4.1-2.1.7-2.1 1.8 0 1.1.8 1.9 1.8 2.1zm.4-1c-.6 0-1-.3-1-1 0-.6.4-.9 1.2-1l1.3-.1v.5c0 1-.6 1.6-1.5 1.6zm5.1 2.7c1.2 0 1.8-.5 2.3-1.9l2.2-6.2h-1.3l-1.4 4.7h-.1l-1.4-4.7h-1.4l2.1 6 .1.3c-.2.6-.5.8-1 .8h-.3v1h.2z"/>
                    </svg>
                  </div>
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
