import { loadStripe } from "@stripe/stripe-js";

// This is your Stripe publishable key - it's safe to expose in the frontend
const stripePromise = loadStripe("pk_test_51S675yPc19yGyC87Q2jWBGALqIWgPERheQTCkH3HpzoYln6XQ8CZq5o0QEeVcPSqmFFoYkYNsx0IOeKtgeonNt9q00HjU2be3j");

export { stripePromise };