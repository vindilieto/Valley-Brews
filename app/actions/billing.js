"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { isUpgrade, PAID_PLANS } from "@/lib/plans";
import { getStripe } from "@/lib/stripe";

// Sends the user to Stripe's hosted payment page for the plan they picked.
export async function startCheckout(formData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const plan = String(formData.get("plan") ?? "");
  if (user.role !== "business" || !isUpgrade(user.plan, plan)) redirect("/dashboard");

  const headerList = await headers();
  const protocol = headerList.get("x-forwarded-proto") ?? "http";
  const siteUrl = `${protocol}://${headerList.get("host")}`;

  const session = await getStripe().checkout.sessions.create({
    mode: "subscription",
    customer_email: user.email,
    client_reference_id: String(user.id),
    metadata: { plan },
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: PAID_PLANS[plan].cents,
          recurring: { interval: "month" },
          product_data: { name: `Valley Brews ${PAID_PLANS[plan].name}` },
        },
      },
    ],
    success_url: `${siteUrl}/upgrade/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl}/dashboard`,
  });

  redirect(session.url);
}
