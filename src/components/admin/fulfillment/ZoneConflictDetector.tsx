import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, RefreshCw, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ZoneConflict {
  postcode: string;
  zone_count: number;
  zones: string;
}

export function ZoneConflictDetector() {
  const [conflicts, setConflicts] = useState<ZoneConflict[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const { toast } = useToast();

  const detectConflicts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .rpc('detect_zone_conflicts');

      if (error) throw error;

      setConflicts(data || []);
      setLastChecked(new Date());
      
      if (!data || data.length === 0) {
        toast({
          title: "No conflicts detected",
          description: "All postcodes are properly assigned to single zones",
        });
      } else {
        toast({
          title: `${data.length} conflicts detected`,
          description: "Some postcodes are assigned to multiple zones",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error detecting conflicts:', error);
      toast({
        title: "Error",
        description: "Failed to detect zone conflicts. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    detectConflicts();
  }, []);

  const getConflictSeverity = (zoneCount: number) => {
    if (zoneCount >= 4) return { color: 'bg-red-100 text-red-800', label: 'High' };
    if (zoneCount >= 3) return { color: 'bg-orange-100 text-orange-800', label: 'Medium' };
    return { color: 'bg-yellow-100 text-yellow-800', label: 'Low' };
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Zone Conflict Detection
          </CardTitle>
          <Button 
            onClick={detectConflicts} 
            disabled={loading}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Scan for Conflicts
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {lastChecked && (
          <div className="text-sm text-muted-foreground">
            Last checked: {lastChecked.toLocaleString()}
          </div>
        )}

        {conflicts.length === 0 && lastChecked && !loading && (
          <Alert className="border-green-200 bg-green-50">
            <Shield className="h-4 w-4" />
            <AlertDescription>
              No zone conflicts detected. All postcodes are properly assigned to single delivery zones.
            </AlertDescription>
          </Alert>
        )}

        {conflicts.length > 0 && (
          <>
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>{conflicts.length} postcode conflicts detected.</strong> These postcodes are assigned to multiple zones, which may cause delivery confusion.
              </AlertDescription>
            </Alert>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Postcode</TableHead>
                    <TableHead>Conflicts</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Assigned Zones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {conflicts.map((conflict) => {
                    const severity = getConflictSeverity(conflict.zone_count);
                    return (
                      <TableRow key={conflict.postcode}>
                        <TableCell className="font-mono font-medium">
                          {conflict.postcode}
                        </TableCell>
                        <TableCell>
                          <Badge variant="destructive">
                            {conflict.zone_count} zones
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={severity.color}>
                            {severity.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-md">
                          <div className="text-sm">
                            {conflict.zones}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            <Alert className="border-blue-200 bg-blue-50">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Recommended Actions:</strong>
                <ul className="mt-2 list-disc list-inside space-y-1 text-sm">
                  <li>Review zone assignments and remove postcodes from lower-priority zones</li>
                  <li>Consider adjusting zone priorities to ensure correct delivery assignments</li>
                  <li>Use the Postcode Testing Tool to verify changes</li>
                </ul>
              </AlertDescription>
            </Alert>
          </>
        )}
      </CardContent>
    </Card>
  );
}