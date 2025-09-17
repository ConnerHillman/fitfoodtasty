import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

const Privacy = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        
        {/* Hero Section */}
        <section className="text-center mb-12">
          <h1 className="text-display-md text-primary">PRIVACY POLICY</h1>
          <p className="text-muted-foreground mt-4">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </section>

        <div className="space-y-8">
          {/* Data Collection */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-heading-lg mb-4">Information We Collect</h2>
              <div className="space-y-4 text-foreground">
                <p>
                  <strong>Personal Information:</strong> When you create an account or place an order, we collect your name, email address, phone number, delivery address, and dietary preferences.
                </p>
                <p>
                  <strong>Payment Information:</strong> Payment details are securely processed through Stripe. We do not store your full payment card details on our servers.
                </p>
                <p>
                  <strong>Usage Data:</strong> We collect information about how you use our website, including pages visited, time spent, and interactions with our services.
                </p>
                <p>
                  <strong>Cookies:</strong> We use cookies to enhance your browsing experience, remember your preferences, and analyze website traffic.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* How We Use Data */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-heading-lg mb-4">How We Use Your Information</h2>
              <div className="space-y-4 text-foreground">
                <ul className="list-disc list-inside space-y-2">
                  <li>Process and fulfill your meal prep orders</li>
                  <li>Communicate about your orders, deliveries, and account</li>
                  <li>Provide customer support and respond to inquiries</li>
                  <li>Improve our services and develop new features</li>
                  <li>Send marketing communications (with your consent)</li>
                  <li>Ensure food safety and quality standards</li>
                  <li>Comply with legal obligations</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Data Storage */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-heading-lg mb-4">Data Storage & Security</h2>
              <div className="space-y-4 text-foreground">
                <p>
                  Your data is securely stored using Supabase, a trusted cloud database provider. We implement industry-standard security measures including encryption, secure connections, and regular security updates.
                </p>
                <p>
                  We retain your personal information for as long as necessary to provide our services, comply with legal obligations, and resolve disputes.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Sharing Information */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-heading-lg mb-4">Information Sharing</h2>
              <div className="space-y-4 text-foreground">
                <p>We may share your information with:</p>
                <ul className="list-disc list-inside space-y-2">
                  <li><strong>Delivery Partners:</strong> To fulfill your orders (DPD for nationwide delivery)</li>
                  <li><strong>Payment Processors:</strong> Stripe for secure payment processing</li>
                  <li><strong>Service Providers:</strong> Third-party services that help us operate our business</li>
                  <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
                </ul>
                <p>We never sell your personal information to third parties.</p>
              </div>
            </CardContent>
          </Card>

          {/* Your Rights */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-heading-lg mb-4">Your Rights (GDPR)</h2>
              <div className="space-y-4 text-foreground">
                <p>Under GDPR, you have the right to:</p>
                <ul className="list-disc list-inside space-y-2">
                  <li><strong>Access:</strong> Request a copy of your personal data</li>
                  <li><strong>Rectification:</strong> Correct inaccurate or incomplete data</li>
                  <li><strong>Erasure:</strong> Request deletion of your personal data</li>
                  <li><strong>Portability:</strong> Receive your data in a machine-readable format</li>
                  <li><strong>Objection:</strong> Object to processing of your personal data</li>
                  <li><strong>Restriction:</strong> Request restriction of processing</li>
                  <li><strong>Withdraw Consent:</strong> Withdraw consent for marketing communications</li>
                </ul>
                <p>To exercise these rights, contact us at <a href="mailto:privacy@fitfoodtasty.co.uk" className="text-primary hover:underline">privacy@fitfoodtasty.co.uk</a></p>
              </div>
            </CardContent>
          </Card>

          {/* Cookies */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-heading-lg mb-4">Cookies Policy</h2>
              <div className="space-y-4 text-foreground">
                <p>
                  We use cookies to improve your experience on our website. This includes:
                </p>
                <ul className="list-disc list-inside space-y-2">
                  <li><strong>Essential Cookies:</strong> Required for website functionality</li>
                  <li><strong>Analytics Cookies:</strong> Help us understand how visitors use our site</li>
                  <li><strong>Preference Cookies:</strong> Remember your settings and preferences</li>
                </ul>
                <p>
                  You can control cookies through your browser settings, but disabling some cookies may affect website functionality.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Contact */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-heading-lg mb-4">Contact Us</h2>
              <div className="space-y-4 text-foreground">
                <p>
                  If you have any questions about this Privacy Policy or our data practices, please contact us:
                </p>
                <div className="space-y-2">
                  <p><strong>Email:</strong> <a href="mailto:privacy@fitfoodtasty.co.uk" className="text-primary hover:underline">privacy@fitfoodtasty.co.uk</a></p>
                  <p><strong>Address:</strong> Fit Food Tasty, Bridgwater, Somerset, UK</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Privacy;