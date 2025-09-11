import { useState } from "react";
import MealsGrid from "@/components/MealsGrid";
import PackagesBar, { MealPackage } from "@/components/packages/PackagesBar";
import PackageSelectionDialog from "@/components/packages/PackageSelectionDialog";

const Menu = () => {
  const [selectedPackage, setSelectedPackage] = useState<MealPackage | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleSelectPackage = (pkg: MealPackage) => {
    setSelectedPackage(pkg);
    setDialogOpen(true);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-2">Fresh Meal Menu</h1>
        <p className="text-muted-foreground text-lg">Choose from our selection of nutritious, chef-prepared meals</p>
      </div>

      {/* Packages at the top */}
      <PackagesBar onSelect={handleSelectPackage} />

      {/* Standard menu below */}
      <MealsGrid />

      {/* Package selection modal */}
      <PackageSelectionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        pkg={selectedPackage}
      />
    </div>
  );
};

export default Menu;