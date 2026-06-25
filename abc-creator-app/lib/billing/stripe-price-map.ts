export type BillingPlanId =
  | "starter"
  | "plus"
  | "bundle"
  | "pro"
  | "agency"
  | "business"
  | "scale";

export type BillingInterval = "monthly" | "yearly";

type StripePriceEnvMap = Record<
  BillingPlanId,
  Partial<Record<BillingInterval, string>>
>;

const stripePriceEnvMap: StripePriceEnvMap = {
  starter: {
    monthly: "STRIPE_PRICE_STARTER_MONTHLY",
    yearly: "STRIPE_PRICE_STARTER_YEARLY",
  },
  plus: {
    monthly: "STRIPE_PRICE_PLUS_MONTHLY",
    yearly: "STRIPE_PRICE_PLUS_YEARLY",
  },
  bundle: {
    yearly: "STRIPE_PRICE_BUNDLE_YEARLY",
  },
  pro: {
    monthly: "STRIPE_PRICE_PRO_MONTHLY",
    yearly: "STRIPE_PRICE_PRO_YEARLY",
  },
  agency: {
    monthly: "STRIPE_PRICE_AGENCY_MONTHLY",
    yearly: "STRIPE_PRICE_AGENCY_YEARLY",
  },
  business: {
    monthly: "STRIPE_PRICE_BUSINESS_MONTHLY",
    yearly: "STRIPE_PRICE_BUSINESS_YEARLY",
  },
  scale: {
    monthly: "STRIPE_PRICE_SCALE_MONTHLY",
  },
};

export function getStripePriceId(
  planId: string,
  billingInterval: string
): {
  ok: true;
  planId: BillingPlanId;
  billingInterval: BillingInterval;
  priceId: string;
} | {
  ok: false;
  error: string;
  code: string;
  missingEnv?: string;
} {
  const normalizedPlan = planId.toLowerCase() as BillingPlanId;
  const normalizedInterval = billingInterval.toLowerCase() as BillingInterval;

  const envName = stripePriceEnvMap[normalizedPlan]?.[normalizedInterval];

  if (!envName) {
    return {
      ok: false,
      error: "This plan and billing interval is not available.",
      code: "INVALID_BILLING_PLAN",
    };
  }

  const priceId = process.env[envName];

  if (!priceId) {
    return {
      ok: false,
      error: "Billing is not configured yet.",
      code: "BILLING_NOT_CONFIGURED",
      missingEnv: envName,
    };
  }

  return {
    ok: true,
    planId: normalizedPlan,
    billingInterval: normalizedInterval,
    priceId,
  };
}
