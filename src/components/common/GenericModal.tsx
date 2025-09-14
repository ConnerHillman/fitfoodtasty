import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, RefreshCw } from "lucide-react";
import { ReactNode } from "react";

export interface GenericModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  
  // Header configuration
  title: string;
  description?: string;
  
  // Content
  children: ReactNode;
  
  // Size and styling
  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl" | "6xl" | "full";
  className?: string;
  
  // Actions
  showRefresh?: boolean;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  
  // Footer actions
  footer?: ReactNode;
  
  // Scrollable content
  scrollable?: boolean;
  maxHeight?: string;
}

const sizeClasses = {
  sm: "max-w-sm",
  md: "max-w-md", 
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  "3xl": "max-w-3xl",
  "4xl": "max-w-4xl",
  "5xl": "max-w-5xl",
  "6xl": "max-w-6xl",
  full: "max-w-full mx-4"
};

export const GenericModal = ({
  open,
  onOpenChange,
  title,
  description,
  children,
  size = "lg",
  className = "",
  showRefresh = false,
  onRefresh,
  isRefreshing = false,
  footer,
  scrollable = true,
  maxHeight = "90vh"
}: GenericModalProps) => {
  
  const containerClasses = [
    sizeClasses[size],
    scrollable && `max-h-[${maxHeight}] overflow-hidden`,
    className
  ].filter(Boolean).join(" ");

  const contentClasses = scrollable 
    ? `h-[calc(${maxHeight}-8rem)]` 
    : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={containerClasses}>
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-xl font-semibold truncate">
                {title}
              </DialogTitle>
              {description && (
                <DialogDescription className="mt-1">
                  {description}
                </DialogDescription>
              )}
            </div>
            
            <div className="flex items-center gap-2 ml-4">
              {showRefresh && onRefresh && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={onRefresh}
                  disabled={isRefreshing}
                  className="shrink-0"
                >
                  <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        {scrollable ? (
          <ScrollArea className={contentClasses}>
            <div className="pr-6">
              {children}
            </div>
          </ScrollArea>
        ) : (
          <div className="space-y-6">
            {children}
          </div>
        )}

        {footer && (
          <div className="flex items-center justify-end gap-2 pt-4 border-t">
            {footer}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

// Specialized variants for common use cases
export const ConfirmationModal = ({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  onCancel,
  confirmText = "Confirm",
  cancelText = "Cancel",
  isLoading = false,
  variant = "default"
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  onConfirm: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
  variant?: "default" | "destructive";
}) => {
  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false);
  };

  return (
    <GenericModal
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      size="sm"
      scrollable={false}
      footer={
        <>
          <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
            {cancelText}
          </Button>
          <Button 
            variant={variant === "destructive" ? "destructive" : "default"} 
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
            {confirmText}
          </Button>
        </>
      }
    >
      {/* Empty children for confirmation modal */}
      <div />
    </GenericModal>
  );
};