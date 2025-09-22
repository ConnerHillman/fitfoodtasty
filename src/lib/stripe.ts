import { loadStripe } from "@stripe/stripe-js";

// This is your Stripe publishable key - it's safe to expose in the frontend
// Updated to use live publishable key to match live secret key
const stripePromise = loadStripe("pk_live_51S675rB9XVWvIR2ED1SQNMRSAQJmJRMhrtUefcALNT8I6FlUkfnu1OBfVa7fTw8RuuEmgklVQisMje4o9k2MZ6Pv00fi2jBN0l");

export { stripePromise };