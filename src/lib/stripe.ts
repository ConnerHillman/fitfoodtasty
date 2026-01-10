import { loadStripe } from "@stripe/stripe-js";

// This is your Stripe publishable key - it's safe to expose in the frontend
// Using test mode key for development/testing
const stripePromise = loadStripe("pk_test_51S675rB9XVWvIR2EwRsCL7E8ixnjcfVPNDdMRhB76BZkwRDVQww0tne3BRoffH56UBeBrfBUZ6TNHsWppOQs6Vqw000H89XZkY");

export { stripePromise };