import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface CategoryTagProps {
  category: string | null | undefined;
  size?: "sm" | "md" | "lg";
  variant?: "subtle" | "bold" | "outline";
  className?: string;
}

const CategoryTag = ({ 
  category, 
  size = "md", 
  variant = "bold",
  className 
}: CategoryTagProps) => {
  // Handle null/undefined category gracefully
  if (!category) {
    return (
      <Badge className="bg-muted text-muted-foreground px-2 py-1 text-xs font-medium rounded-full">
        Uncategorized
      </Badge>
    );
  }
  const getCategoryStyles = (categoryName: string) => {
    const normalizedCategory = (categoryName || '').toLowerCase();
    
    switch (normalizedCategory) {
      case 'breakfast':
        return {
          gradient: 'bg-gradient-to-r from-orange-500 to-amber-500',
          shadow: 'shadow-orange-500/25',
          text: 'text-white',
          glow: 'hover:shadow-orange-500/40'
        };
      case 'lunch':
        return {
          gradient: 'bg-gradient-to-r from-blue-500 to-sky-500',
          shadow: 'shadow-blue-500/25',
          text: 'text-white',
          glow: 'hover:shadow-blue-500/40'
        };
      case 'dinner':
        return {
          gradient: 'bg-gradient-to-r from-purple-500 to-violet-500',
          shadow: 'shadow-purple-500/25',
          text: 'text-white',
          glow: 'hover:shadow-purple-500/40'
        };
      case 'all meals (regular size)':
        return {
          gradient: 'bg-gradient-to-r from-orange-500 to-amber-500',
          shadow: 'shadow-orange-500/25',
          text: 'text-white',
          glow: 'hover:shadow-orange-500/40'
        };
      case 'massive meals':
        return {
          gradient: 'bg-gradient-to-r from-blue-500 to-sky-500',
          shadow: 'shadow-blue-500/25',
          text: 'text-white',
          glow: 'hover:shadow-blue-500/40'
        };
      case '(lowcal)':
        return {
          gradient: 'bg-gradient-to-r from-cyan-400 to-teal-400',
          shadow: 'shadow-cyan-400/25',
          text: 'text-white',
          glow: 'hover:shadow-cyan-400/40'
        };
      default:
        return {
          gradient: 'bg-gradient-to-r from-gray-500 to-slate-500',
          shadow: 'shadow-gray-500/25',
          text: 'text-white',
          glow: 'hover:shadow-gray-500/40'
        };
    }
  };

  const styles = getCategoryStyles(category);
  
  const sizeClasses = {
    sm: "px-2 py-1 text-xs font-medium",
    md: "px-3 py-1.5 text-sm font-semibold",
    lg: "px-4 py-2 text-base font-bold"
  };

  const variantClasses = {
    subtle: `${styles.gradient} ${styles.text} bg-opacity-80 backdrop-blur-sm`,
    bold: `${styles.gradient} ${styles.text} shadow-lg ${styles.shadow}`,
    outline: `border-2 bg-card/95 backdrop-blur-sm text-foreground`
  };

  const formatDisplayName = (name: string) => {
    if (!name) return 'Uncategorized';
    // Handle special cases
    if (name === '(lowcal)') return 'Low Cal';
    if (name === 'all meals (regular size)') return 'Regular';
    if (name === 'massive meals') return 'Massive';
    
    // Capitalize first letter of each word
    return name.split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <Badge
      className={cn(
        "relative overflow-hidden transition-all duration-300 border-0 rounded-full",
        "hover:scale-105 hover:shadow-xl",
        sizeClasses[size],
        variantClasses[variant],
        variant === "bold" && styles.glow,
        "before:absolute before:inset-0 before:bg-white/10 before:rounded-full before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300",
        className
      )}
    >
      <span className="relative z-10 tracking-wide">
        {formatDisplayName(category)}
      </span>
    </Badge>
  );
};

export default CategoryTag;