import { Link } from "react-router-dom";
import HeroSection from '@/components/HeroSection';
import Menu from './Menu';

const Index = () => {
  return (
    <div className="min-h-screen">
      <HeroSection />
      <div className="container mx-auto px-4 py-16">
        <Menu />
      </div>
      <div className="fixed bottom-4 right-4 z-40">
        <Link to="/auth">
          <button className="text-xs bg-primary/10 text-primary px-3 py-2 rounded-md hover:bg-primary/20 transition-colors">
            Business Login
          </button>
        </Link>
      </div>
    </div>
  );
};

export default Index;
