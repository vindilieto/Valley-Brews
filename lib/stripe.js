import Stripe from "stripe";

export const PRO_PRICE_CENTS = 3500;

export function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY);
}
