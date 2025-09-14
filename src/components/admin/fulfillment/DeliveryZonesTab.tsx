import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Edit } from "lucide-react";
import { DeliveryZoneForm } from "./DeliveryZoneForm";
import type { DeliveryZone, GlobalSchedule } from "@/types/fulfillment";

interface DeliveryZonesTabProps {
  deliveryZones: DeliveryZone[];
  globalSchedule: GlobalSchedule[];
  onZoneSubmit: (data: any) => void;
}

export function DeliveryZonesTab({ deliveryZones, globalSchedule, onZoneSubmit }: DeliveryZonesTabProps) {
  const [showZoneDialog, setShowZoneDialog] = useState(false);
  const [editingZone, setEditingZone] = useState<DeliveryZone | null>(null);

  const handleZoneSubmit = (data: any) => {
    onZoneSubmit(data);
    setShowZoneDialog(false);
    setEditingZone(null);
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Delivery Zones</CardTitle>
            <CardDescription>
              Configure different delivery areas with custom schedules and fees
            </CardDescription>
          </div>
          <Button onClick={() => {
            setEditingZone(null);
            setShowZoneDialog(true);
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Zone
          </Button>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Zone Name</TableHead>
                  <TableHead>Delivery Days</TableHead>
                  <TableHead>Fee</TableHead>
                  <TableHead>Min Order</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deliveryZones.map((zone) => (
                  <TableRow key={zone.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {zone.zone_name}
                        {zone.business_hours_override && Object.keys(zone.business_hours_override).length > 0 && (
                          <Badge variant="outline" className="text-xs">Override</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {zone.delivery_days.map((day, index) => (
                          <Badge key={index} variant="secondary" className="text-xs capitalize">
                            {day.substring(0, 3)}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>£{zone.delivery_fee.toFixed(2)}</TableCell>
                    <TableCell>£{zone.minimum_order.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant={zone.is_active ? "default" : "secondary"}>
                        {zone.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingZone(zone);
                            setShowZoneDialog(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
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

      <Dialog open={showZoneDialog} onOpenChange={setShowZoneDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingZone ? 'Edit' : 'Add'} Delivery Zone
            </DialogTitle>
          </DialogHeader>
          <DeliveryZoneForm
            zone={editingZone}
            globalSchedule={globalSchedule}
            onSubmit={handleZoneSubmit}
            onClose={() => setShowZoneDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}