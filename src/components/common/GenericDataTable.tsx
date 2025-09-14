import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ReactNode } from "react";
import { LucideIcon, MoreHorizontal } from "lucide-react";

export interface ColumnDef<T> {
  key: string;
  header: string;
  accessor?: (item: T) => ReactNode;
  cell?: (value: any, item: T) => ReactNode;
  sortable?: boolean;
  className?: string;
  width?: string;
}

export interface ActionItem<T> {
  label: string;
  icon?: LucideIcon;
  onClick: (item: T) => void;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  className?: string;
  hidden?: (item: T) => boolean;
}

export interface GenericDataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  actions?: ActionItem<T>[];
  
  // Table configuration
  title?: string;
  description?: string;
  
  // Loading states
  loading?: boolean;
  loadingRows?: number;
  
  // Empty state
  emptyMessage?: string;
  emptyDescription?: string;
  emptyAction?: {
    label: string;
    onClick: () => void;
  };
  
  // Row configuration
  getRowId?: (item: T) => string;
  onRowClick?: (item: T) => void;
  
  // Styling
  className?: string;
  bordered?: boolean;
  
  // Pagination (to be implemented with the table)
  pagination?: {
    current: number;
    total: number;
    pageSize: number;
    onChange: (page: number) => void;
  };
}

export function GenericDataTable<T>({
  data,
  columns,
  actions,
  title,
  description,
  loading = false,
  loadingRows = 5,
  emptyMessage = "No data found",
  emptyDescription,
  emptyAction,
  getRowId,
  onRowClick,
  className,
  bordered = true
}: GenericDataTableProps<T>) {
  
  const TableWrapper = title || description ? Card : 'div';
  const TableContainer = title || description ? CardContent : 'div';

  const renderCell = (column: ColumnDef<T>, item: T) => {
    if (column.accessor) {
      return column.accessor(item);
    }
    
    if (column.cell) {
      const value = (item as any)[column.key];
      return column.cell(value, item);
    }
    
    return (item as any)[column.key];
  };

  const renderActions = (item: T) => {
    if (!actions || actions.length === 0) return null;

    const visibleActions = actions.filter(action => !action.hidden?.(item));
    
    if (visibleActions.length === 0) return null;

    if (visibleActions.length === 1) {
      const action = visibleActions[0];
      const Icon = action.icon;
      
      return (
        <Button
          variant={action.variant || "ghost"}
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            action.onClick(item);
          }}
          className={action.className}
        >
          {Icon && <Icon className="h-4 w-4 mr-1" />}
          {action.label}
        </Button>
      );
    }

    // Multiple actions - show dropdown menu here if needed
    return (
      <div className="flex gap-1">
        {visibleActions.slice(0, 2).map((action, index) => {
          const Icon = action.icon;
          return (
            <Button
              key={index}
              variant={action.variant || "ghost"}
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                action.onClick(item);
              }}
              className={action.className}
            >
              {Icon && <Icon className="h-4 w-4" />}
            </Button>
          );
        })}
        {visibleActions.length > 2 && (
          <Button variant="ghost" size="sm">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <TableWrapper className={className}>
        {title && (
          <CardHeader>
            <CardTitle>{title}</CardTitle>
            {description && <p className="text-sm text-muted-foreground">{description}</p>}
          </CardHeader>
        )}
        <TableContainer>
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column) => (
                  <TableHead key={column.key} className={column.className} style={{ width: column.width }}>
                    {column.header}
                  </TableHead>
                ))}
                {actions && actions.length > 0 && (
                  <TableHead className="w-[100px]">Actions</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: loadingRows }).map((_, index) => (
                <TableRow key={index}>
                  {columns.map((column) => (
                    <TableCell key={column.key}>
                      <div className="h-4 bg-muted rounded animate-pulse" />
                    </TableCell>
                  ))}
                  {actions && actions.length > 0 && (
                    <TableCell>
                      <div className="h-8 w-16 bg-muted rounded animate-pulse" />
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </TableWrapper>
    );
  }

  return (
    <TableWrapper className={className}>
      {title && (
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </CardHeader>
      )}
      <TableContainer>
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.key} className={column.className} style={{ width: column.width }}>
                  {column.header}
                </TableHead>
              ))}
              {actions && actions.length > 0 && (
                <TableHead className="w-[100px]">Actions</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell 
                  colSpan={columns.length + (actions?.length ? 1 : 0)} 
                  className="text-center py-8"
                >
                  <div className="space-y-2">
                    <p className="text-muted-foreground">{emptyMessage}</p>
                    {emptyDescription && (
                      <p className="text-sm text-muted-foreground">{emptyDescription}</p>
                    )}
                    {emptyAction && (
                      <Button variant="outline" onClick={emptyAction.onClick}>
                        {emptyAction.label}
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              data.map((item, index) => {
                const rowId = getRowId ? getRowId(item) : index.toString();
                return (
                  <TableRow 
                    key={rowId}
                    className={onRowClick ? "cursor-pointer hover:bg-muted/50" : ""}
                    onClick={() => onRowClick?.(item)}
                  >
                    {columns.map((column) => (
                      <TableCell key={column.key} className={column.className}>
                        {renderCell(column, item)}
                      </TableCell>
                    ))}
                    {actions && actions.length > 0 && (
                      <TableCell>
                        {renderActions(item)}
                      </TableCell>
                    )}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </TableWrapper>
  );
}