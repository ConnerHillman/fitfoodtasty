import { Button } from "@/components/ui/button";

interface DeleteDialogProps {
  isVisible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  selectedCoupon: any;
  isSubmitting: boolean;
}

const DeleteDialog = ({
  isVisible,
  onClose,
  onConfirm,
  selectedCoupon,
  isSubmitting
}: DeleteDialogProps) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-sm">
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-2">Delete Coupon</h3>
          <p className="text-muted-foreground mb-4">
            Are you sure you want to delete the coupon "{selectedCoupon?.code}"? This action cannot be undone.
          </p>
          
          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={onConfirm}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteDialog;