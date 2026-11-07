"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getStripe, PRO_PRICE_CENTS } from "@/lib/stripe";

// Sends the user to Stripe's hosted payment page for the Pro plan.
export async function startCheckout() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.plan === "pro") redirect("/dashboard");

  const headerList = await headers();
  const protocol = headerList.get("x-forwarded-proto") ?? "http";
  const siteUrl = `${protocol}://${headerList.get("host")}`;

  const session = await getStripe().checkout.sessions.create({
    mode: "subscription",
    customer_email: user.email,
    client_reference_id: String(user.id),
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: PRO_PRICE_CENTS,
          recurring: { interval: "month" },
          product_data: { name: "Valley Brews Pro" },
        },
      },
    ],
    success_url: `${siteUrl}/upgrade/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl}/dashboard`,
  });

  redirect(session.url);
}
