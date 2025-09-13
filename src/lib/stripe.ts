import { loadStripe } from "@stripe/stripe-js";

// This is your Stripe publishable key - it's safe to expose in the frontend
const stripePromise = loadStripe("pk_test_51S675yPc19yGyC87P9vf4VvpIQxIJowKRHyKBqyC5nPfvz8SnWCgvNMhWxiMPPKGnQlNGfJ7CJuqPT5tZJJZJuWpzJQfJ00JJZJZJqT");

export { stripePromise };