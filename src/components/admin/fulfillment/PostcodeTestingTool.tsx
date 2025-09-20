import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Search, AlertTriangle, CheckCircle, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ZoneMatch {
  zone_id: string;
  zone_name: string;
  delivery_fee: number;
  delivery_days: string[];
  priority: number;
  match_type: string;
}

export function PostcodeTestingTool() {
  const [postcodeInput, setPostcodeInput] = useState("");
  const [matches, setMatches] = useState<ZoneMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastTested, setLastTested] = useState("");
  const { toast } = useToast();

  const runPostcodeTest = async () => {
    if (!postcodeInput.trim()) {
      toast({
        title: "Error",
        description: "Please enter a postcode to test",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .rpc('get_delivery_zone_for_postcode_prioritized', {
          customer_postcode: postcodeInput.trim()
        });

      if (error) throw error;

      setMatches(data || []);
      setLastTested(postcodeInput.trim().toUpperCase());
      
      if (!data || data.length === 0) {
        toast({
          title: "No matches found",
          description: `No delivery zones found for postcode ${postcodeInput.trim().toUpperCase()}`,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error testing postcode:', error);
      toast({
        title: "Error",
        description: "Failed to test postcode. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getMatchTypeColor = (matchType: string) => {
    switch (matchType) {
      case 'exact': return 'default';
      case 'prefix': return 'secondary';
      default: return 'outline';
    }
  };

  const getPriorityColor = (priority: number) => {
    if (priority <= 20) return 'bg-green-100 text-green-800';
    if (priority <= 50) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Postcode Testing Tool
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Enter postcode (e.g., BS22 8EN)"
            value={postcodeInput}
            onChange={(e) => setPostcodeInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && runPostcodeTest()}
          />
          <Button onClick={runPostcodeTest} disabled={loading}>
            {loading ? "Testing..." : "Test"}
          </Button>
        </div>

        {lastTested && (
          <Alert className="border-blue-200 bg-blue-50">
            <Info className="h-4 w-4" />
            <AlertDescription>
              Testing results for: <strong>{lastTested}</strong>
            </AlertDescription>
          </Alert>
        )}

        {matches.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium">
              Found {matches.length} matching zone{matches.length > 1 ? 's' : ''}:
            </h4>
            
            {matches.length > 1 && (
              <Alert className="border-amber-200 bg-amber-50">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Multiple zones found! The first zone (highest priority) will be used for delivery.
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              {matches.map((match, index) => (
                <Card key={match.zone_id} className={index === 0 ? "border-green-200 bg-green-50" : "border-gray-200"}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h5 className="font-medium">{match.zone_name}</h5>
                          {index === 0 && (
                            <Badge variant="default" className="bg-green-600">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Selected
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm">
                          <Badge variant={getMatchTypeColor(match.match_type)}>
                            {match.match_type} match
                          </Badge>
                          <Badge className={getPriorityColor(match.priority)}>
                            Priority: {match.priority}
                          </Badge>
                        </div>
                        
                        <div className="text-sm text-muted-foreground">
                          <p>Delivery fee: £{match.delivery_fee.toFixed(2)}</p>
                          <p>Available days: {match.delivery_days.join(', ')}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {lastTested && matches.length === 0 && (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              No delivery zones found for this postcode. This customer will not be able to place orders for delivery.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}