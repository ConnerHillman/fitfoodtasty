import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

const Terms = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        
        {/* Hero Section */}
        <section className="text-center mb-12">
          <h1 className="text-display-md text-primary">TERMS OF SERVICE</h1>
          <p className="text-muted-foreground mt-4">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </section>

        <div className="space-y-8">
          {/* Acceptance */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-heading-lg mb-4">Acceptance of Terms</h2>
              <div className="space-y-4 text-foreground">
                <p>
                  By accessing and using the Fit Food Tasty website and services, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
                </p>
                <p>
                  These terms apply to all visitors, users, and others who access or use our meal prep service.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Service Description */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-heading-lg mb-4">Service Description</h2>
              <div className="space-y-4 text-foreground">
                <p>
                  Fit Food Tasty provides fresh, nutritious meal preparation and delivery services. Our services include:
                </p>
                <ul className="list-disc list-inside space-y-2">
                  <li>Freshly prepared healthy meals</li>
                  <li>Local delivery in Bridgwater, Taunton, Weston Super Mare, and Bristol areas</li>
                  <li>UK nationwide delivery via DPD courier</li>
                  <li>Collection services from our kitchen in Bridgwater</li>
                  <li>Custom meal plans and dietary accommodations</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Age Requirements */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-heading-lg mb-4">Age Requirements</h2>
              <div className="space-y-4 text-foreground">
                <p>
                  You must be at least 18 years old to use our services and place orders. By using our service, you represent and warrant that you are of legal age to form a binding contract.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Orders and Payments */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-heading-lg mb-4">Orders and Payments</h2>
              <div className="space-y-4 text-foreground">
                <p><strong>Order Acceptance:</strong> All orders are subject to availability and confirmation. We reserve the right to refuse or cancel any order for any reason.</p>
                <p><strong>Pricing:</strong> All prices are displayed in GBP and include VAT where applicable. Prices may change without notice.</p>
                <p><strong>Payment:</strong> Payment is required at the time of order. We accept major credit and debit cards through our secure Stripe payment system.</p>
                <p><strong>Order Modifications:</strong> Orders can only be modified or cancelled within 24 hours of placement, subject to preparation schedules.</p>
              </div>
            </CardContent>
          </Card>

          {/* Delivery Terms */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-heading-lg mb-4">Delivery Terms</h2>
              <div className="space-y-4 text-foreground">
                <p><strong>Local Delivery:</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Available Sunday, Monday, and Wednesday between 6pm-8:30pm</li>
                  <li>Free delivery within our local delivery zones</li>
                  <li>You must be available to receive your delivery</li>
                </ul>
                <p><strong>Nationwide Delivery:</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Dispatched on Tuesdays via DPD courier</li>
                  <li>Delivery within 24 hours of collection</li>
                  <li>Tracking information provided via text/email</li>
                  <li>Additional delivery charges apply</li>
                </ul>
                <p><strong>Collection:</strong> Available during business hours from our Bridgwater kitchen location.</p>
              </div>
            </CardContent>
          </Card>

          {/* Food Safety */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-heading-lg mb-4">Food Safety & Storage</h2>
              <div className="space-y-4 text-foreground">
                <p>
                  All meals are prepared in accordance with UK food safety regulations. Upon receipt:
                </p>
                <ul className="list-disc list-inside space-y-2">
                  <li>Refrigerate meals immediately upon delivery</li>
                  <li>Consume within 4-5 days of delivery date</li>
                  <li>Follow reheating instructions provided</li>
                  <li>Check use-by dates on all items</li>
                </ul>
                <p>
                  Please inform us of any food allergies or dietary requirements when placing your order.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Cancellation & Refunds */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-heading-lg mb-4">Cancellation & Refund Policy</h2>
              <div className="space-y-4 text-foreground">
                <p><strong>Cancellations:</strong> Orders may be cancelled up to 24 hours before the scheduled delivery/collection date.</p>
                <p><strong>Refunds:</strong> Refunds will be processed for:</p>
                <ul className="list-disc list-inside space-y-2">
                  <li>Orders cancelled within the allowed timeframe</li>
                  <li>Failed deliveries due to our error</li>
                  <li>Quality issues reported within 24 hours of delivery</li>
                </ul>
                <p>Refunds will be processed to the original payment method within 5-10 business days.</p>
              </div>
            </CardContent>
          </Card>

          {/* Liability */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-heading-lg mb-4">Limitation of Liability</h2>
              <div className="space-y-4 text-foreground">
                <p>
                  To the fullest extent permitted by law, Fit Food Tasty shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of our service.
                </p>
                <p>
                  Our total liability shall not exceed the amount paid for the specific order in question.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Prohibited Uses */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-heading-lg mb-4">Prohibited Uses</h2>
              <div className="space-y-4 text-foreground">
                <p>You may not use our service:</p>
                <ul className="list-disc list-inside space-y-2">
                  <li>For any unlawful purpose or to solicit others to perform unlawful acts</li>
                  <li>To violate any international, federal, provincial, or state regulations, rules, laws, or local ordinances</li>
                  <li>To infringe upon or violate our intellectual property rights or the intellectual property rights of others</li>
                  <li>To submit false or misleading information</li>
                  <li>To interfere with or circumvent the security features of the service</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Changes to Terms */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-heading-lg mb-4">Changes to Terms</h2>
              <div className="space-y-4 text-foreground">
                <p>
                  We reserve the right to update or change our Terms of Service at any time. Any changes will be posted on this page with an updated revision date.
                </p>
                <p>
                  Your continued use of the service after we post any modifications constitutes acceptance of those changes.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Contact */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-heading-lg mb-4">Contact Information</h2>
              <div className="space-y-4 text-foreground">
                <p>
                  If you have any questions about these Terms of Service, please contact us:
                </p>
                <div className="space-y-2">
                  <p><strong>Email:</strong> <a href="mailto:info@fitfoodtasty.co.uk" className="text-primary hover:underline">info@fitfoodtasty.co.uk</a></p>
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

export default Terms;