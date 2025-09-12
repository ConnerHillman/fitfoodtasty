import { cn } from "@/lib/utils";

interface Category {
  value: string;
  label: string;
}

interface LuxuryCategorySelectorProps {
  categories: Category[];
  selectedCategory: string;
  onCategorySelect: (category: string) => void;
  className?: string;
}

const getCategoryGradient = (categoryValue: string) => {
  switch (categoryValue.toLowerCase()) {
    case 'breakfast':
      return 'from-orange-400 via-amber-500 to-yellow-500';
    case 'lunch':
      return 'from-blue-400 via-cyan-500 to-teal-500';
    case 'dinner':
      return 'from-purple-400 via-violet-500 to-indigo-500';
    case 'all':
      return 'from-emerald-400 via-green-500 to-emerald-600';
    default:
      return 'from-gray-400 via-slate-500 to-gray-600';
  }
};

const getCategoryShadow = (categoryValue: string) => {
  switch (categoryValue.toLowerCase()) {
    case 'breakfast':
      return 'shadow-orange-500/30 hover:shadow-orange-500/50';
    case 'lunch':
      return 'shadow-blue-500/30 hover:shadow-blue-500/50';
    case 'dinner':
      return 'shadow-purple-500/30 hover:shadow-purple-500/50';
    case 'all':
      return 'shadow-emerald-500/30 hover:shadow-emerald-500/50';
    default:
      return 'shadow-gray-500/30 hover:shadow-gray-500/50';
  }
};

const LuxuryCategorySelector = ({ 
  categories, 
  selectedCategory, 
  onCategorySelect, 
  className 
}: LuxuryCategorySelectorProps) => {
  return (
    <div className={cn("w-full mb-8 md:mb-12", className)}>
      {/* Section Header */}
      <div className="text-center mb-4 md:mb-8">
        <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-2">
          Choose Your Category
        </h2>
        <p className="text-muted-foreground text-base md:text-lg">
          Select from our curated collection of premium meals
        </p>
      </div>

      {/* Category Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 max-w-6xl mx-auto px-4">
        {categories.map((category) => {
          const isSelected = selectedCategory === category.value;
          const gradient = getCategoryGradient(category.value);
          const shadow = getCategoryShadow(category.value);
          
          return (
            <button
              key={category.value}
              onClick={() => onCategorySelect(category.value)}
              className={cn(
                "group relative overflow-hidden rounded-xl md:rounded-2xl p-4 md:p-6 lg:p-8 transition-all duration-300 ease-out",
                "transform hover:scale-105 hover:-translate-y-1 md:hover:-translate-y-2",
                "border-2 backdrop-blur-sm",
                shadow,
                isSelected 
                  ? `bg-gradient-to-br ${gradient} border-white shadow-2xl scale-105 -translate-y-1` 
                  : "bg-white/5 border-muted hover:bg-white/10 hover:border-primary/60"
              )}
            >
              {/* Background Overlay */}
              <div 
                className={cn(
                  "absolute inset-0 opacity-0 transition-opacity duration-300",
                  `bg-gradient-to-br ${gradient}`,
                  isSelected ? "opacity-100" : "group-hover:opacity-80"
                )} 
              />
              
              {/* Content */}
              <div className="relative z-10 flex flex-col items-center justify-center min-h-[80px] md:min-h-[120px]">
                <h3 className={cn(
                  "text-lg md:text-2xl lg:text-3xl font-bold tracking-wide transition-colors duration-300",
                  isSelected 
                    ? "text-white drop-shadow-lg" 
                    : "text-foreground group-hover:text-white"
                )}>
                  {category.label}
                </h3>
                
                {/* Decorative Element */}
                <div className={cn(
                  "mt-3 h-1 rounded-full transition-all duration-300",
                  "bg-gradient-to-r from-transparent via-current to-transparent",
                  isSelected 
                    ? "w-16 text-white/80" 
                    : "w-8 text-muted-foreground/40 group-hover:w-12 group-hover:text-white/60"
                )} />
              </div>

              {/* Selection Indicator */}
              {isSelected && (
                <div className="absolute top-3 right-3 w-3 h-3 bg-white rounded-full shadow-lg opacity-90" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default LuxuryCategorySelector;