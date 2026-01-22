import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import { Plus, Edit, Trash2 } from "lucide-react";
import { CollectionPointForm } from "./CollectionPointForm";
import type { CollectionPoint, GlobalSchedule } from "@/types/fulfillment";

interface CollectionPointsTabProps {
  collectionPoints: CollectionPoint[];
  globalSchedule: GlobalSchedule[];
  onCollectionPointSubmit: (data: any) => void;
  onCollectionPointDelete?: (id: string) => void;
}

export function CollectionPointsTab({ 
  collectionPoints, 
  globalSchedule, 
  onCollectionPointSubmit,
  onCollectionPointDelete 
}: CollectionPointsTabProps) {
  const [showCollectionPointDialog, setShowCollectionPointDialog] = useState(false);
  const [editingCollectionPoint, setEditingCollectionPoint] = useState<CollectionPoint | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CollectionPoint | null>(null);

  const handleCollectionPointSubmit = (data: any) => {
    onCollectionPointSubmit(data);
    setShowCollectionPointDialog(false);
    setEditingCollectionPoint(null);
  };

  const handleDelete = () => {
    if (deleteTarget && onCollectionPointDelete) {
      onCollectionPointDelete(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Collection Points</CardTitle>
            <CardDescription>
              Manage locations where customers can collect their orders
            </CardDescription>
          </div>
          <Button onClick={() => {
            setEditingCollectionPoint(null);
            setShowCollectionPointDialog(true);
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Collection Point
          </Button>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Collection Days</TableHead>
                  <TableHead>Fee</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {collectionPoints.map((point) => (
                  <TableRow key={point.id}>
                    <TableCell>{point.point_name}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{point.address}</div>
                        <div className="text-muted-foreground">{point.city}, {point.postcode}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {point.collection_days.map((day, index) => (
                          <Badge key={index} variant="secondary" className="text-xs capitalize">
                            {day.substring(0, 3)}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>£{point.collection_fee.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant={point.is_active ? "default" : "secondary"}>
                        {point.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingCollectionPoint(point);
                            setShowCollectionPointDialog(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => setDeleteTarget(point)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showCollectionPointDialog} onOpenChange={setShowCollectionPointDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCollectionPoint ? 'Edit' : 'Add'} Collection Point
            </DialogTitle>
          </DialogHeader>
          <CollectionPointForm
            collectionPoint={editingCollectionPoint}
            globalSchedule={globalSchedule}
            onSubmit={handleCollectionPointSubmit}
            onClose={() => setShowCollectionPointDialog(false)}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Collection Point</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteTarget?.point_name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}