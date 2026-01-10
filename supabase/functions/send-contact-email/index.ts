import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY") ?? "");

interface ContactFormRequest {
  name: string;
  email: string;
  subject: string;
  message: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Processing contact form submission...");
    
    const { name, email, subject, message }: ContactFormRequest = await req.json();

    // Validate required fields
    if (!name || !email || !subject || !message) {
      throw new Error("All fields are required");
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error("Invalid email address");
    }

    console.log(`Contact form from: ${name} <${email}>, Subject: ${subject}`);

    // Send email to the business
    const businessEmailResponse = await resend.emails.send({
      from: "Fit Food Tasty Website <orders@orders.fitfoodtasty.co.uk>",
      to: ["info@fitfoodtasty.co.uk"],
      replyTo: email,
      subject: `[Website Contact] ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">
            New Contact Form Submission
          </h1>
          
          <div style="background: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <p><strong>From:</strong> ${name}</p>
            <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
            <p><strong>Subject:</strong> ${subject}</p>
          </div>
          
          <div style="margin: 20px 0;">
            <h3 style="color: #1e293b;">Message:</h3>
            <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; white-space: pre-wrap;">
${message}
            </div>
          </div>
          
          <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 30px; color: #64748b; font-size: 12px;">
            <p>This message was sent via the Fit Food Tasty website contact form.</p>
            <p>You can reply directly to this email to respond to the customer.</p>
          </div>
        </div>
      `,
    });

    console.log("Business notification email sent:", businessEmailResponse);

    // Send confirmation email to the customer
    const customerEmailResponse = await resend.emails.send({
      from: "Fit Food Tasty <orders@orders.fitfoodtasty.co.uk>",
      to: [email],
      subject: "We've received your message - Fit Food Tasty",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb;">Thank You for Contacting Us!</h1>
          </div>
          
          <p>Hi ${name},</p>
          
          <p>Thank you for reaching out to Fit Food Tasty. We've received your message and our team will get back to you within 24 hours.</p>
          
          <div style="background: #f1f5f9; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #1e293b;">Your Message Summary:</h3>
            <p><strong>Subject:</strong> ${subject}</p>
            <p style="white-space: pre-wrap; color: #475569;">${message}</p>
          </div>
          
          <p>In the meantime, feel free to:</p>
          <ul style="color: #475569;">
            <li>Browse our <a href="https://fitfoodtasty.co.uk/menu" style="color: #2563eb;">delicious meal menu</a></li>
            <li>Check out our <a href="https://fitfoodtasty.co.uk/faq" style="color: #2563eb;">FAQ page</a> for quick answers</li>
            <li>Follow us on social media for updates and offers</li>
          </ul>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://fitfoodtasty.co.uk" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Visit Our Website
            </a>
          </div>
          
          <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 30px; color: #64748b; font-size: 14px;">
            <p>Best regards,<br><strong>The Fit Food Tasty Team</strong></p>
            <p style="font-size: 12px; margin-top: 20px;">
              Bridgwater, Somerset, UK<br>
              <a href="mailto:info@fitfoodtasty.co.uk" style="color: #2563eb;">info@fitfoodtasty.co.uk</a>
            </p>
          </div>
        </div>
      `,
    });

    console.log("Customer confirmation email sent:", customerEmailResponse);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Message sent successfully"
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error("Error sending contact email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);
