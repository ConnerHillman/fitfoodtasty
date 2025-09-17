import React from 'react';
import { Link } from 'react-router-dom';
import Header from '@/components/Header';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
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