// The paid plans. Free is everyone else.
export const PAID_PLANS = {
  plus: { name: "Plus", cents: 1500 },
  pro: { name: "Pro", cents: 3000 },
};

const RANK = { free: 0, plus: 1, pro: 2 };

export function planName(plan) {
  return PAID_PLANS[plan]?.name ?? "Free";
}

// Plus and Pro: unlimited posts and repeating posts.
export function hasPaidPlan(plan) {
  return RANK[plan] >= RANK.plus;
}

// Pro only: the AI specials assistant.
export function hasAI(plan) {
  return plan === "pro";
}

export function isUpgrade(currentPlan, newPlan) {
  return newPlan in PAID_PLANS && RANK[newPlan] > (RANK[currentPlan] ?? 0);
}
