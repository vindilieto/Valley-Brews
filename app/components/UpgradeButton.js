import { startCheckout } from "@/app/actions/billing";
import { PAID_PLANS } from "@/lib/plans";

// Sends a business to Stripe checkout for the plan.
export default function UpgradeButton({ plan, label }) {
  return (
    <form action={startCheckout}>
      <input type="hidden" name="plan" value={plan} />
      <button className="button primary" type="submit">
        {label}: ${PAID_PLANS[plan].cents / 100}/month
      </button>
    </form>
  );
}
