import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Mail, Phone, MapPin, Clock, Facebook, Instagram, Youtube, MessageSquare, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke('send-contact-email', {
        body: formData
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Message Sent!",
        description: "Thank you for your message. We'll get back to you within 24 hours.",
      });
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (error: any) {
      console.error('Error sending contact form:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to send message. Please try again or email us directly.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        
        {/* Hero Section */}
        <section className="text-center mb-12">
          <h1 className="text-display-md text-primary">CONTACT US</h1>
          <p className="text-heading-md text-muted-foreground mt-4">
            Get in touch with the Fit Food Tasty team
          </p>
        </section>

        <div className="grid lg:grid-cols-2 gap-12">
          
          {/* Contact Form */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Send us a Message
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium mb-2">
                        Full Name *
                      </label>
                      <Input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        placeholder="Your full name"
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium mb-2">
                        Email Address *
                      </label>
                      <Input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        placeholder="your.email@example.com"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium mb-2">
                      Subject *
                    </label>
                    <Input
                      type="text"
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      placeholder="What can we help you with?"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="message" className="block text-sm font-medium mb-2">
                      Message *
                    </label>
                    <Textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows={6}
                      placeholder="Tell us more about your inquiry, dietary requirements, or feedback..."
                    />
                  </div>
                  
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      'Send Message'
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Contact Information */}
          <div className="space-y-6">
            
            {/* Main Contact */}
            <Card>
              <CardHeader>
                <CardTitle>Get in Touch</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Mail className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Email</p>
                    <a 
                      href="mailto:info@fitfoodtasty.co.uk"
                      className="text-primary hover:underline"
                    >
                      info@fitfoodtasty.co.uk
                    </a>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <MapPin className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Address</p>
                    <p className="text-muted-foreground">Bridgwater, Somerset, UK</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Clock className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Business Hours</p>
                    <p className="text-muted-foreground">Monday - Friday: 9am - 6pm</p>
                    <p className="text-muted-foreground">Saturday: 9am - 4pm</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Delivery Information */}
            <Card>
              <CardHeader>
                <CardTitle>Delivery Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Local Delivery Areas</h4>
                  <p className="text-sm text-muted-foreground">
                    Bridgwater, Taunton, Weston Super Mare, Bristol
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Delivery: Sunday, Monday, Wednesday (6pm-8:30pm)
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Nationwide Delivery</h4>
                  <p className="text-sm text-muted-foreground">
                    UK-wide delivery via DPD courier
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Dispatched: Tuesdays
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Collection</h4>
                  <p className="text-sm text-muted-foreground">
                    Available during business hours from our Bridgwater kitchen
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Social Media */}
            <Card>
              <CardHeader>
                <CardTitle>Follow Us</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex space-x-4">
                  <Button variant="outline" size="sm" asChild>
                    <a 
                      href="https://www.facebook.com/FitFoodTastyBridgwater" 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      <Facebook className="h-4 w-4 mr-2" />
                      Facebook
                    </a>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <a 
                      href="https://www.instagram.com/fitfood.tasty/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      <Instagram className="h-4 w-4 mr-2" />
                      Instagram
                    </a>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <a 
                      href="https://www.youtube.com/channel/UCBZqk7QRvDrzXsay5fdfQTw" 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      <Youtube className="h-4 w-4 mr-2" />
                      YouTube
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* FAQ Quick Links */}
            <Card>
              <CardHeader>
                <CardTitle>Frequently Asked Questions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <h4 className="font-medium">How do I modify my order?</h4>
                  <p className="text-sm text-muted-foreground">
                    Orders can be modified up to 24 hours before delivery. Contact us via email for changes.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium">What if I have dietary requirements?</h4>
                  <p className="text-sm text-muted-foreground">
                    We accommodate most dietary requirements. Please specify your needs when placing your order.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium">How long do meals last?</h4>
                  <p className="text-sm text-muted-foreground">
                    Our meals can be safely consumed within 4-5 days when properly refrigerated.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium">Do you offer refunds?</h4>
                  <p className="text-sm text-muted-foreground">
                    Yes, we offer refunds for cancellations within 24 hours or quality issues.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;