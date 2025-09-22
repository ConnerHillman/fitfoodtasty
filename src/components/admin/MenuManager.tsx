import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { ChefHat, Package, Tags, BarChart3 } from "lucide-react";
import { AdminTabsLayout, type TabConfig } from "./common/AdminTabsLayout";
import MealsManager from "./MealsManager";
import PackagesManager from "./PackagesManager";
import CategoriesManager from "./CategoriesManager";
import MealAnalytics from "./MealAnalytics";
import PackageAnalytics from "./PackageAnalytics";

export function MenuManager() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeSubTab, setActiveSubTab] = useState(() => 
    searchParams.get('subtab') || 'meals'
  );

  // Update URL when subtab changes
  const handleSubTabChange = (value: string) => {
    setActiveSubTab(value);
    const newParams = new URLSearchParams(searchParams);
    newParams.set('subtab', value);
    setSearchParams(newParams);
  };

  // Sync with URL changes
  useEffect(() => {
    const subtab = searchParams.get('subtab');
    if (subtab && subtab !== activeSubTab) {
      setActiveSubTab(subtab);
    }
  }, [searchParams, activeSubTab]);

  const tabs: TabConfig[] = [
    {
      value: "meals",
      label: "Meals",
      icon: ChefHat,
      content: <MealsManager />
    },
    {
      value: "packages", 
      label: "Packages",
      icon: Package,
      content: <PackagesManager />
    },
    {
      value: "categories",
      label: "Categories", 
      icon: Tags,
      content: <CategoriesManager />
    },
    {
      value: "analytics",
      label: "Analytics",
      icon: BarChart3,
      content: (
        <div className="space-y-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">Meal Analytics</h3>
            <MealAnalytics />
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Package Analytics</h3>
            <PackageAnalytics />
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Menu Manager</h2>
        <p className="text-muted-foreground">
          Manage your meals, packages, categories, and view comprehensive analytics
        </p>
      </div>

      <AdminTabsLayout
        tabs={tabs}
        value={activeSubTab}
        onValueChange={handleSubTabChange}
        className="space-y-6"
      />
    </div>
  );
}