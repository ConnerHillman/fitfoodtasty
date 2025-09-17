import { ReactNode, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Search, 
  MoreHorizontal, 
  SortAsc, 
  SortDesc, 
  Filter,
  Download,
  RefreshCw,
  Eye,
  Edit,
  Trash2
} from "lucide-react";

export interface ColumnDef<T> {
  key: keyof T | string;
  header: string;
  accessor?: (item: T) => ReactNode;
  cell?: (value: any, item: T) => ReactNode;
  sortable?: boolean;
  width?: string;
  className?: string;
}

export interface ActionItem<T> {
  label: string;
  icon?: any;
  onClick: (item: T) => void;
  variant?: "default" | "outline" | "secondary" | "destructive" | "ghost";
  condition?: (item: T) => boolean;
}

interface AdminTableProps<T extends { id: string }> {
  title: string;
  data: T[];
  columns: ColumnDef<T>[];
  actions?: ActionItem<T>[];
  loading?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  onRefresh?: () => void;
  onExport?: () => void;
  emptyMessage?: string;
  emptyDescription?: string;
  className?: string;
  getRowId?: (item: T) => string;
  onRowClick?: (item: T) => void;
}

export function AdminTable<T extends { id: string }>({
  title,
  data,
  columns,
  actions = [],
  loading = false,
  searchable = true,
  searchPlaceholder = "Search...",
  onRefresh,
  onExport,
  emptyMessage = "No data found",
  emptyDescription = "Get started by adding your first item",
  className = "",
  getRowId = (item) => item.id,
  onRowClick
}: AdminTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Filter data based on search
  const filteredData = searchable && searchTerm
    ? data.filter(item =>
        Object.values(item).some(value =>
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    : data;

  // Sort data
  const sortedData = sortColumn
    ? [...filteredData].sort((a, b) => {
        const aValue = (a as any)[sortColumn];
        const bValue = (b as any)[sortColumn];
        
        if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
        if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
        return 0;
      })
    : filteredData;

  const handleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(columnKey);
      setSortDirection("asc");
    }
  };

  const renderCellContent = (column: ColumnDef<T>, item: T) => {
    if (column.accessor) {
      return column.accessor(item);
    }
    
    const value = (item as any)[column.key];
    
    if (column.cell) {
      return column.cell(value, item);
    }
    
    // Default rendering based on value type
    if (typeof value === "boolean") {
      return (
        <Badge variant={value ? "default" : "secondary"}>
          {value ? "Active" : "Inactive"}
        </Badge>
      );
    }
    
    return value;
  };

  return (
    <Card className={`overflow-hidden border-0 shadow-sm ${className}`}>
      <CardHeader className="bg-muted/30 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            {title} ({filteredData.length})
          </CardTitle>
          
          <div className="flex items-center gap-2">
            {searchable && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
            )}
            
            {onRefresh && (
              <Button variant="outline" size="sm" onClick={onRefresh}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            )}
            
            {onExport && (
              <Button variant="outline" size="sm" onClick={onExport}>
                <Download className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading...</span>
          </div>
        ) : sortedData.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-lg font-medium text-muted-foreground">{emptyMessage}</p>
            <p className="text-sm text-muted-foreground mt-1">{emptyDescription}</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column) => (
                  <TableHead 
                    key={String(column.key)}
                    className={`${column.className || ""} ${column.sortable ? "cursor-pointer hover:bg-muted/50" : ""}`}
                    style={column.width ? { width: column.width } : undefined}
                    onClick={column.sortable ? () => handleSort(String(column.key)) : undefined}
                  >
                    <div className="flex items-center gap-2">
                      {column.header}
                      {column.sortable && sortColumn === column.key && (
                        sortDirection === "asc" ? 
                        <SortAsc className="h-4 w-4" /> : 
                        <SortDesc className="h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                ))}
                {actions.length > 0 && (
                  <TableHead className="w-16">Actions</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedData.map((item) => (
                <TableRow 
                  key={getRowId(item)}
                  className={onRowClick ? "cursor-pointer hover:bg-muted/50" : ""}
                  onClick={onRowClick ? () => onRowClick(item) : undefined}
                >
                  {columns.map((column) => (
                    <TableCell 
                      key={String(column.key)}
                      className={column.className || ""}
                    >
                      {renderCellContent(column, item)}
                    </TableCell>
                  ))}
                  {actions.length > 0 && (
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {actions
                            .filter(action => !action.condition || action.condition(item))
                            .map((action, index) => (
                            <DropdownMenuItem
                              key={index}
                              onClick={(e) => {
                                e.stopPropagation();
                                action.onClick(item);
                              }}
                              className="flex items-center gap-2"
                            >
                              {action.icon && <action.icon className="h-4 w-4" />}
                              {action.label}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}