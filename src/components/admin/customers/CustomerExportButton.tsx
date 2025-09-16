import { useState } from "react";
import { Download, FileText, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { exportCustomers, exportCustomerStats, type ExportFormat } from "@/lib/customerExport";
import type { Customer, CustomerStats } from "@/types/customer";

interface CustomerExportButtonProps {
  customers: Customer[];
  filteredCustomers: Customer[];
  stats: CustomerStats;
  disabled?: boolean;
}

export function CustomerExportButton({
  customers,
  filteredCustomers,
  stats,
  disabled = false
}: CustomerExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const handleExport = async (
    data: Customer[],
    format: ExportFormat,
    filename: string
  ) => {
    if (data.length === 0) {
      toast({
        title: "No Data",
        description: "No customers to export",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);
    try {
      await exportCustomers(data, { format, filename });
      toast({
        title: "Export Successful",
        description: `Exported ${data.length} customers as ${format.toUpperCase()}`,
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: error instanceof Error ? error.message : "Failed to export customers",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleStatsExport = async (format: ExportFormat) => {
    setIsExporting(true);
    try {
      await exportCustomerStats(stats, { format });
      toast({
        title: "Export Successful",
        description: `Exported customer statistics as ${format.toUpperCase()}`,
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: error instanceof Error ? error.message : "Failed to export statistics",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          disabled={disabled || isExporting}
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          {isExporting ? "Exporting..." : "Export"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-2 py-1.5 text-sm font-semibold">Customer Data</div>
        <DropdownMenuItem
          onClick={() => handleExport(filteredCustomers, 'csv', `filtered-customers-${filteredCustomers.length}`)}
          className="flex items-center gap-2"
        >
          <FileText className="h-4 w-4" />
          Export Filtered (CSV)
          <span className="ml-auto text-xs text-muted-foreground">
            {filteredCustomers.length} customers
          </span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleExport(filteredCustomers, 'json', `filtered-customers-${filteredCustomers.length}`)}
          className="flex items-center gap-2"
        >
          <Database className="h-4 w-4" />
          Export Filtered (JSON)
          <span className="ml-auto text-xs text-muted-foreground">
            {filteredCustomers.length} customers
          </span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem
          onClick={() => handleExport(customers, 'csv', `all-customers-${customers.length}`)}
          className="flex items-center gap-2"
        >
          <FileText className="h-4 w-4" />
          Export All (CSV)
          <span className="ml-auto text-xs text-muted-foreground">
            {customers.length} customers
          </span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleExport(customers, 'json', `all-customers-${customers.length}`)}
          className="flex items-center gap-2"
        >
          <Database className="h-4 w-4" />
          Export All (JSON)
          <span className="ml-auto text-xs text-muted-foreground">
            {customers.length} customers
          </span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        
        <div className="px-2 py-1.5 text-sm font-semibold">Statistics</div>
        <DropdownMenuItem
          onClick={() => handleStatsExport('csv')}
          className="flex items-center gap-2"
        >
          <FileText className="h-4 w-4" />
          Export Stats (CSV)
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleStatsExport('json')}
          className="flex items-center gap-2"
        >
          <Database className="h-4 w-4" />
          Export Stats (JSON)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}