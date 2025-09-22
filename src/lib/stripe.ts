import { loadStripe } from "@stripe/stripe-js";

// This is your Stripe publishable key - it's safe to expose in the frontend
// Updated to match the account that has the secret key in environment variables
const stripePromise = loadStripe("pk_test_51QEUc8KKgCb14dQXGXXGMRyFwQhjFZVsNKbUSwLjJOtNdGHy8MAdNP1YO3ZCQkGo7jTKTeSUt9vN9BmS8Q3Bge8o00HImQKYu3");

export { stripePromise };