import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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
      <h2 id="packages-heading" className="text-2xl font-semibold mb-3">Meal Packages</h2>
      <p className="text-muted-foreground mb-4">Save with our curated bundles. Pick your meals after choosing a package.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {packages.map((pkg) => (
          <Card key={pkg.id} className="relative overflow-hidden hover:shadow-lg transition-shadow">
            {pkg.image_url && (
              <div className="w-full overflow-hidden bg-muted">
                <img 
                  src={pkg.image_url} 
                  alt={pkg.name}
                  className="w-full h-auto object-contain"
                />
              </div>
            )}
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{pkg.name}</CardTitle>
                <Badge variant="secondary">{pkg.meal_count} meals</Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {pkg.description && (
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{pkg.description}</p>
              )}
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold text-primary">£{pkg.price.toFixed(2)}</div>
                <Button onClick={() => onSelect(pkg)} aria-label={`Choose ${pkg.name}`}>
                  Choose
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
};

export default PackagesBar;
