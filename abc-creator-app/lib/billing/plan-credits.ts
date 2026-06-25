import type { BillingInterval, BillingPlanId } from "./stripe-price-map";

const monthlyCreditsByPlan: Record<BillingPlanId, number> = {
  starter: 150,
  plus: 400,
  bundle: 1400,
  pro: 2500,
  agency: 9000,
  business: 20000,
  scale: 35000,
};

export function getPlanCreditGrant(
  planId: string,
  billingInterval: string
):
  | {
      ok: true;
      planId: BillingPlanId;
      billingInterval: BillingInterval;
      monthlyCredits: number;
      monthsGranted: number;
      grantAmount: number;
    }
  | {
      ok: false;
      error: string;
      code: string;
    } {
  const normalizedPlan = planId.toLowerCase() as BillingPlanId;
  const normalizedInterval = billingInterval.toLowerCase() as BillingInterval;

  const monthlyCredits = monthlyCreditsByPlan[normalizedPlan];

  if (!monthlyCredits) {
    return {
      ok: false,
      error: "Unknown billing plan.",
      code: "UNKNOWN_BILLING_PLAN",
    };
  }

  if (normalizedInterval !== "monthly" && normalizedInterval !== "yearly") {
    return {
      ok: false,
      error: "Unknown billing interval.",
      code: "UNKNOWN_BILLING_INTERVAL",
    };
  }

  const monthsGranted = normalizedInterval === "yearly" ? 12 : 1;

  return {
    ok: true,
    planId: normalizedPlan,
    billingInterval: normalizedInterval,
    monthlyCredits,
    monthsGranted,
    grantAmount: monthlyCredits * monthsGranted,
  };
}
