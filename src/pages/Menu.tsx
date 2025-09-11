import MealsGrid from "@/components/MealsGrid";

const Menu = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-2">Fresh Meal Menu</h1>
        <p className="text-muted-foreground text-lg">Choose from our selection of nutritious, chef-prepared meals</p>
      </div>

      <MealsGrid />
    </div>
  );
};

export default Menu;