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
      
      {/* Mobile-first compact design - 2 per row on mobile */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 max-w-6xl mx-auto">
        {packages.map((pkg) => (
          <div key={pkg.id} className="group text-center">
            {/* Package name above image */}
            <div className="mb-3">
              <h3 className="text-lg font-bold text-foreground mb-1">
                {pkg.name}
              </h3>
            </div>
            
            {/* Full image button */}
            <button
              onClick={() => onSelect(pkg)}
              className="w-full h-32 rounded-xl overflow-hidden border-2 border-muted hover:border-emerald-300 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/20 hover:-translate-y-1 bg-white/50 backdrop-blur-sm cursor-pointer relative"
              aria-label={`Choose ${pkg.name} package for £${pkg.price.toFixed(2)}`}
            >
              {pkg.image_url ? (
                <img 
                  src={pkg.image_url} 
                  alt={pkg.name}
                  className="w-full h-full object-contain p-2"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-emerald-100 to-green-100 flex items-center justify-center">
                  <Package className="w-12 h-12 text-emerald-600" />
                </div>
              )}
              
              {/* Subtle gradient overlay on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            </button>
            
            {/* Price and description underneath */}
            <div className="mt-3">
              <div className="text-xl font-bold text-emerald-600 mb-1">
                £{pkg.price.toFixed(2)}
              </div>
              {pkg.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {pkg.description}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default PackagesBar;
