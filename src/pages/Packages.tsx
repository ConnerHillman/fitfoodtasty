import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import PackagesBar from "@/components/packages/PackagesBar";
import PackageSelectionDialog from "@/components/packages/PackageSelectionDialog";
import { MealPackage } from "@/components/packages/PackagesBar";

const Packages = () => {
  const [selectedPackage, setSelectedPackage] = useState<MealPackage | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handlePackageSelect = (pkg: MealPackage) => {
    setSelectedPackage(pkg);
    setIsDialogOpen(true);
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-4">
            Meal Packages
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Choose from our curated meal packages designed to meet your nutritional goals. 
            Each package offers the perfect combination of variety, nutrition, and convenience.
          </p>
        </div>

        <PackagesBar onSelect={handlePackageSelect} />

        <PackageSelectionDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          pkg={selectedPackage}
        />
      </div>
    </AppLayout>
  );
};

export default Packages;