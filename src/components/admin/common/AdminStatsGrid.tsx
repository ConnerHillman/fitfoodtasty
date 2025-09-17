import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export interface StatCard {
  id: string;
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: string;
  trend?: {
    value: number;
    direction: "up" | "down";
  };
}

interface AdminStatsGridProps {
  stats: StatCard[];
  loading?: boolean;
  columns?: 2 | 3 | 4;
  className?: string;
}

export function AdminStatsGrid({ 
  stats, 
  loading = false, 
  columns = 4,
  className = ""
}: AdminStatsGridProps) {
  const gridClass = {
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
  }[columns];

  if (loading) {
    return (
      <div className={`grid ${gridClass} gap-4 ${className}`}>
        {Array.from({ length: columns }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className={`grid ${gridClass} gap-4 ${className}`}>
      {stats.map((stat) => (
        <Card key={stat.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <stat.icon className={`h-4 w-4 ${stat.iconColor || 'text-muted-foreground'}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            {stat.subtitle && (
              <p className="text-xs text-muted-foreground">
                {stat.subtitle}
              </p>
            )}
            {stat.trend && (
              <p className={`text-xs flex items-center gap-1 mt-1 ${
                stat.trend.direction === 'up' ? 'text-green-600' : 'text-red-600'
              }`}>
                <span className={stat.trend.direction === 'up' ? '↑' : '↓'}>
                  {Math.abs(stat.trend.value)}%
                </span>
                from last month
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}