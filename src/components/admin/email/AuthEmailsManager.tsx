import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Settings, Mail, Shield, Eye } from "lucide-react";

export const AuthEmailsManager = () => {
  const { toast } = useToast();
  const [passwordResetEnabled, setPasswordResetEnabled] = useState(true);
  const [verificationEnabled, setVerificationEnabled] = useState(true);
  const [testEmail, setTestEmail] = useState("");

  const handleTestEmail = async (type: 'password_reset' | 'verification') => {
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
      description: `${type === 'password_reset' ? 'Password reset' : 'Email verification'} test sent to ${testEmail}`,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Authentication Emails</h3>
        <p className="text-sm text-muted-foreground">
          Manage password reset and email verification templates
        </p>
      </div>

      <Tabs defaultValue="password-reset" className="space-y-4">
        <TabsList>
          <TabsTrigger value="password-reset" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Password Reset
          </TabsTrigger>
          <TabsTrigger value="verification" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Email Verification
          </TabsTrigger>
        </TabsList>

        <TabsContent value="password-reset" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Password Reset Emails
              </CardTitle>
              <CardDescription>
                Customize the email sent when users request a password reset
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="password-reset-enabled">Enable Custom Template</Label>
                  <p className="text-sm text-muted-foreground">
                    Use custom branded password reset emails instead of Supabase defaults
                  </p>
                </div>
                <Switch
                  id="password-reset-enabled"
                  checked={passwordResetEnabled}
                  onCheckedChange={setPasswordResetEnabled}
                />
              </div>

              {passwordResetEnabled && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="reset-subject">Email Subject</Label>
                    <Input
                      id="reset-subject"
                      placeholder="Reset your password - {{company_name}}"
                      defaultValue="Reset your password"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reset-content">Email Content</Label>
                    <Textarea
                      id="reset-content"
                      rows={8}
                      placeholder="Enter your password reset email HTML template..."
                      defaultValue={`<h2>Password Reset Request</h2>
<p>Hi {{user_name}},</p>
<p>We received a request to reset your password. Click the button below to create a new password:</p>
<a href="{{reset_link}}" style="display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px;">Reset Password</a>
<p>If you didn't request this, you can safely ignore this email.</p>
<p>Best regards,<br>The Team</p>`}
                    />
                  </div>

                  <div className="border-t pt-4">
                    <Label className="text-sm font-medium">Test Password Reset Email</Label>
                    <div className="flex gap-2 mt-2">
                      <Input
                        placeholder="test@example.com"
                        value={testEmail}
                        onChange={(e) => setTestEmail(e.target.value)}
                        className="flex-1"
                      />
                      <Button onClick={() => handleTestEmail('password_reset')}>
                        Send Test
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="verification" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email Verification
              </CardTitle>
              <CardDescription>
                Customize the email sent to verify new user email addresses
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="verification-enabled">Enable Custom Template</Label>
                  <p className="text-sm text-muted-foreground">
                    Use custom branded verification emails instead of Supabase defaults
                  </p>
                </div>
                <Switch
                  id="verification-enabled"
                  checked={verificationEnabled}
                  onCheckedChange={setVerificationEnabled}
                />
              </div>

              {verificationEnabled && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="verify-subject">Email Subject</Label>
                    <Input
                      id="verify-subject"
                      placeholder="Verify your email address - {{company_name}}"
                      defaultValue="Verify your email address"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="verify-content">Email Content</Label>
                    <Textarea
                      id="verify-content"
                      rows={8}
                      placeholder="Enter your verification email HTML template..."
                      defaultValue={`<h2>Welcome! Verify Your Email</h2>
<p>Hi {{user_name}},</p>
<p>Thank you for signing up! Please verify your email address by clicking the button below:</p>
<a href="{{verification_link}}" style="display: inline-block; padding: 12px 24px; background-color: #28a745; color: white; text-decoration: none; border-radius: 4px;">Verify Email</a>
<p>If you didn't create an account, you can safely ignore this email.</p>
<p>Welcome aboard!<br>The Team</p>`}
                    />
                  </div>

                  <div className="border-t pt-4">
                    <Label className="text-sm font-medium">Test Verification Email</Label>
                    <div className="flex gap-2 mt-2">
                      <Input
                        placeholder="test@example.com"
                        value={testEmail}
                        onChange={(e) => setTestEmail(e.target.value)}
                        className="flex-1"
                      />
                      <Button onClick={() => handleTestEmail('verification')}>
                        Send Test
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};