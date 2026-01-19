import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ClickableStatusBadgeProps<T> {
  item: T;
  isActive: boolean;
  itemName: string;
  onToggle: (item: T) => void;
  activeLabel?: string;
  inactiveLabel?: string;
  activateMessage?: string;
  deactivateMessage?: string;
  /** Optional callback before showing toggle dialog. If returns { showCustomDialog: true }, the default dialog won't show */
  onBeforeToggle?: (item: T, isActive: boolean) => Promise<boolean | { showCustomDialog: true }>;
}

export function ClickableStatusBadge<T>({
  item,
  isActive,
  itemName,
  onToggle,
  activeLabel = "Active",
  inactiveLabel = "Inactive",
  activateMessage,
  deactivateMessage,
  onBeforeToggle,
}: ClickableStatusBadgeProps<T>) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const defaultActivateMessage = `Are you sure you want to activate "${itemName}"? It will be visible on the menu.`;
  const defaultDeactivateMessage = `Are you sure you want to deactivate "${itemName}"? It will be hidden from the menu.`;

  const handleBadgeClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // If onBeforeToggle is provided and we're deactivating, call it first
    if (onBeforeToggle && isActive) {
      const result = await onBeforeToggle(item, isActive);
      if (result === false) {
        // Cancelled
        return;
      }
      if (typeof result === 'object' && result.showCustomDialog) {
        // Custom dialog will be shown by parent
        return;
      }
    }
    
    setIsDialogOpen(true);
  };

  const handleConfirm = () => {
    onToggle(item);
    setIsDialogOpen(false);
  };

  return (
    <>
      <Badge
        variant={isActive ? "default" : "secondary"}
        className="cursor-pointer hover:opacity-80 transition-opacity select-none"
        onClick={handleBadgeClick}
      >
        {isActive ? activeLabel : inactiveLabel}
      </Badge>

      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isActive ? "Deactivate" : "Activate"} {itemName}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isActive
                ? (deactivateMessage || defaultDeactivateMessage)
                : (activateMessage || defaultActivateMessage)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={(e) => e.stopPropagation()}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.stopPropagation();
                handleConfirm();
              }}
            >
              {isActive ? "Deactivate" : "Activate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
