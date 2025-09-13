import { loadStripe } from "@stripe/stripe-js";

// This is your Stripe publishable key - it's safe to expose in the frontend
const stripePromise = loadStripe("pk_test_51QcOxJBQqO6mN4PFZ8IwsR98IqQFp6ynHPIRQEqUmPpBzLgqNKBOjQZYH0tWb5t4Y9uaKh9T2U8hUOFJjGkqFJSS00yJhkPYL9");

export { stripePromise };