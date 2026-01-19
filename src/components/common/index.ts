// Export all reusable component patterns
export { GenericFiltersBar } from './GenericFiltersBar';
export { StatsCardsGrid, StatCard } from './StatsCards';
export { GenericDataTable } from './GenericDataTable';
export { GenericModal, ConfirmationModal } from './GenericModal';
export { ClickableStatusBadge } from './ClickableStatusBadge';
export { default as ErrorBoundary } from './ErrorBoundary';
export { CustomerErrorBoundary } from './CustomerErrorBoundary';
export { SafeHtml } from './SafeHtml';

// Export types for component consumers
export type { 
  StatCardData,
  StatsCardsGridProps 
} from './StatsCards';

export type {
  ColumnDef,
  ActionItem,
  GenericDataTableProps
} from './GenericDataTable';

export type {
  GenericModalProps
} from './GenericModal';