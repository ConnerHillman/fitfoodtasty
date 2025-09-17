import { loadStripe } from "@stripe/stripe-js";

// This is your Stripe publishable key - it's safe to expose in the frontend
const stripePromise = loadStripe("pk_live_51S675yPc19yGyC87TKJ4Nz8JZYQy2q9YtE9JFxYL2HdCj3iNlMjKcjWkP1oiNDjA8z4r7FjL1SqkWRtI2FQ2jY2M00xEF6jQ6J");

export { stripePromise };