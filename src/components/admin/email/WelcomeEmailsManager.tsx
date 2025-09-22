import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Settings } from "lucide-react";

export const WelcomeEmailsManager = () => {
  const { toast } = useToast();
  const [isEnabled, setIsEnabled] = useState(false);
  const [timing, setTiming] = useState("immediate");
  const [testEmail, setTestEmail] = useState("");

  const handleTestEmail = async () => {
    if (!testEmail) {
      toast({
        title: "Error",
        description: "Please enter an email address for testing",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Test Email Sent",
      description: `Welcome email test sent to ${testEmail}`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Welcome Email Series</h3>
          <p className="text-sm text-muted-foreground">
            Automated welcome emails for new customers
          </p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          New Welcome Template
        </Button>
      </div>

      {/* Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Welcome Email Settings
          </CardTitle>
          <CardDescription>
            Configure when and how welcome emails are sent to new customers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="welcome-enabled">Enable Welcome Emails</Label>
              <p className="text-sm text-muted-foreground">
                Automatically send welcome emails to new customers
              </p>
            </div>
            <Switch
              id="welcome-enabled"
              checked={isEnabled}
              onCheckedChange={setIsEnabled}
            />
          </div>

          {isEnabled && (
            <>
              <div className="space-y-2">
                <Label htmlFor="timing">Send Timing</Label>
                <Select value={timing} onValueChange={setTiming}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select timing" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="immediate">Immediately after signup</SelectItem>
                    <SelectItem value="1hour">1 hour after signup</SelectItem>
                    <SelectItem value="24hours">24 hours after signup</SelectItem>
                    <SelectItem value="3days">3 days after signup</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="border-t pt-4">
                <Label className="text-sm font-medium">Test Welcome Email</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    placeholder="test@example.com"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={handleTestEmail}>
                    Send Test
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Templates List */}
      <Card>
        <CardHeader>
          <CardTitle>Welcome Email Templates</CardTitle>
          <CardDescription>
            Manage your welcome email sequence
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>No welcome email templates configured yet.</p>
            <Button className="mt-4" variant="outline">
              Create Your First Welcome Template
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};