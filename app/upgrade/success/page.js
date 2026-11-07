import Link from "next/link";
import { redirect } from "next/navigation";
import TopBar from "@/app/components/TopBar";
import { getCurrentUser } from "@/lib/auth";
import { sql } from "@/lib/db";
import { hasAI, PAID_PLANS, planName } from "@/lib/plans";
import { getStripe } from "@/lib/stripe";

export const metadata = { title: "Welcome | Valley Brews" };

export default async function UpgradeSuccessPage({ searchParams }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { session_id: sessionId } = await searchParams;
  if (!sessionId) redirect("/dashboard");

  // Ask Stripe directly, so visiting this address can't fake a payment.
  const stripe = getStripe();
  let session = null;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId);
  } catch (error) {
    console.error("Couldn't look up checkout session:", error.message);
  }
  const plan = session?.metadata?.plan;
  const paid =
    session?.status === "complete" && session.client_reference_id === String(user.id) && plan in PAID_PLANS;

  if (paid) {
    const [old] = await sql`SELECT stripe_subscription_id FROM users WHERE id = ${user.id}`;

    await sql`
      UPDATE users
      SET plan = ${plan},
          stripe_customer_id = ${session.customer},
          stripe_subscription_id = ${session.subscription}
      WHERE id = ${user.id}`;

    // Moving from Plus to Pro: stop the old Plus subscription so they aren't charged twice.
    if (old?.stripe_subscription_id && old.stripe_subscription_id !== session.subscription) {
      try {
        await stripe.subscriptions.cancel(old.stripe_subscription_id);
      } catch (error) {
        console.error("Couldn't cancel old subscription:", error.message);
      }
    }
  }

  return (
    <>
      <TopBar user={user} />
      <main className="container dashboard">
        <h1>{paid ? `You're on ${planName(plan)}!` : "We couldn't confirm your payment"}</h1>
        <p className="muted">
          {!paid
            ? "Nothing on your account was changed. Please try again from your dashboard."
            : hasAI(plan)
              ? "The AI specials assistant and repeating posts are ready on your dashboard."
              : "Unlimited and repeating posts are ready on your dashboard."}
        </p>
        <p><Link href="/dashboard" className="button primary backlink">Go to dashboard</Link></p>
      </main>
    </>
  );
}
