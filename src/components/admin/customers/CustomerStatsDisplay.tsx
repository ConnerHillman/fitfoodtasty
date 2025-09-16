import { Users, UserPlus, RefreshCw, Download } from "lucide-react";
import { StatsCardsGrid } from "@/components/common/StatsCards";
import type { CustomerStats } from "@/types/customer";

interface CustomerStatsDisplayProps {
  stats: CustomerStats;
}

export function CustomerStatsDisplay({ stats }: CustomerStatsDisplayProps) {
  const statsData = [
    {
      id: "total-customers",
      title: "Total Customers",
      value: stats.total.toString(),
      subtitle: "Active customer accounts",
      icon: Users,
    },
    {
      id: "active-customers",
      title: "Active Customers", 
      value: stats.activeCustomers.toString(),
      subtitle: "Customers with recent activity",
      icon: UserPlus,
    },
    {
      id: "customers-with-orders",
      title: "With Orders",
      value: stats.withOrders.toString(),
      subtitle: "Customers with pending orders",
      icon: RefreshCw,
    },
    {
      id: "total-revenue",
      title: "Total Revenue",
      value: `£${stats.totalRevenue.toFixed(2)}`,
      subtitle: "Combined customer revenue",
      icon: Download,
    },
  ];

  return <StatsCardsGrid stats={statsData} />;
}