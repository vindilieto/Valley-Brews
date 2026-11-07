import Link from "next/link";
import { redirect } from "next/navigation";
import TopBar from "@/app/components/TopBar";
import { getCurrentUser } from "@/lib/auth";
import { sql } from "@/lib/db";
import { getStripe } from "@/lib/stripe";

export const metadata = { title: "Welcome to Pro | Valley Brews" };

export default async function UpgradeSuccessPage({ searchParams }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { session_id: sessionId } = await searchParams;
  if (!sessionId) redirect("/dashboard");

  // Ask Stripe directly, so visiting this address can't fake a payment.
  let session = null;
  try {
    session = await getStripe().checkout.sessions.retrieve(sessionId);
  } catch (error) {
    console.error("Couldn't look up checkout session:", error.message);
  }
  const paid = session?.status === "complete" && session.client_reference_id === String(user.id);

  if (paid) {
    await sql`
      UPDATE users
      SET plan = 'pro',
          stripe_customer_id = ${session.customer},
          stripe_subscription_id = ${session.subscription}
      WHERE id = ${user.id}`;
  }

  return (
    <>
      <TopBar user={user} />
      <main className="container dashboard">
        <h1>{paid ? "You're on Pro!" : "We couldn't confirm your payment"}</h1>
        <p className="muted">
          {paid
            ? "The AI specials assistant is ready on your dashboard."
            : "Nothing on your account was changed. Please try again from your dashboard."}
        </p>
        <p><Link href="/dashboard" className="button primary backlink">Go to dashboard</Link></p>
      </main>
    </>
  );
}
