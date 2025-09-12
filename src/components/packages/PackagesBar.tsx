import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package } from "lucide-react";

export interface MealPackage {
  id: string;
  name: string;
  description?: string | null;
  meal_count: number;
  price: number;
  image_url?: string | null;
}

interface PackagesBarProps {
  onSelect: (pkg: MealPackage) => void;
}

const PackagesBar = ({ onSelect }: PackagesBarProps) => {
  const [packages, setPackages] = useState<MealPackage[]>([]);

  useEffect(() => {
    const fetchPackages = async () => {
      const { data, error } = await supabase
        .from("packages")
        .select("id,name,description,meal_count,price,image_url")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      if (!error) setPackages((data || []) as MealPackage[]);
    };
    fetchPackages();
  }, []);

  if (packages.length === 0) return null;

  return (
    <section aria-labelledby="packages-heading" className="mb-8">
      <div className="text-center mb-6">
        <h2 id="packages-heading" className="text-2xl md:text-3xl font-bold text-foreground mb-2">
          Meal Packages
        </h2>
        <p className="text-muted-foreground text-sm md:text-base">
          Save with our curated bundles. Pick your meals after choosing a package.
        </p>
        <div className="w-12 h-1 bg-gradient-to-r from-emerald-400 to-green-500 mx-auto rounded-full mt-3" />
      </div>
      
      {/* Mobile-first compact design */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 max-w-6xl mx-auto">
        {packages.map((pkg) => (
          <div 
            key={pkg.id} 
            className="group relative overflow-hidden rounded-xl border-2 border-muted hover:border-emerald-300 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/20 hover:-translate-y-1 bg-white/50 backdrop-blur-sm"
          >
            {/* Central image taking most space */}
            <div className="p-4 pb-3 relative">
              {pkg.image_url ? (
                <div className="w-full h-20 mb-3 rounded-lg overflow-hidden bg-muted/30">
                  <img 
                    src={pkg.image_url} 
                    alt={pkg.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-full h-20 mb-3 rounded-lg bg-gradient-to-br from-emerald-100 to-green-100 flex items-center justify-center">
                  <Package className="w-8 h-8 text-emerald-600" />
                </div>
              )}
              
              <div className="flex items-center justify-between mb-2">
                <div className="text-right">
                  <div className="text-xl font-bold text-emerald-600">
                    £{pkg.price.toFixed(2)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {pkg.meal_count} meals
                  </div>
                </div>
              </div>
              
              {pkg.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3 text-center">
                  {pkg.description}
                </p>
              )}
              
              <Button 
                onClick={() => onSelect(pkg)} 
                className="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-medium py-2 rounded-lg transition-all duration-200 group-hover:shadow-md"
                aria-label={`Choose ${pkg.name}`}
              >
                <Package className="w-4 h-4 mr-2" />
                Choose Package
              </Button>
            </div>
            
            {/* Subtle gradient overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
          </div>
        ))}
      </div>
    </section>
  );
};

export default PackagesBar;
