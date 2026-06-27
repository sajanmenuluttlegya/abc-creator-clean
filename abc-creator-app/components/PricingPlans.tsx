"use client";

import { useMemo, useState } from "react";
import { CheckoutButton } from "@/components/CheckoutButton";

type BillingInterval = "monthly" | "yearly";

type Plan = {
  id: string;
  name: string;
  monthlyPrice?: number;
  yearlyPrice?: number;
  monthlyCredits: number;
  features: string[];
  highlight?: boolean;
};

const plans: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    monthlyPrice: 39,
    yearlyPrice: 36,
    monthlyCredits: 150,
    features: ["Core writing tools", "Light creator usage"],
  },
  {
    id: "plus",
    name: "Plus",
    monthlyPrice: 69,
    yearlyPrice: 468,
    monthlyCredits: 400,
    features: ["All current writing tools", "Best everyday creator plan"],
    highlight: true,
  },
  {
    id: "bundle",
    name: "Bundle",
    yearlyPrice: 129,
    monthlyCredits: 1400,
    features: ["Yearly creator bundle", "High monthly credit allowance"],
  },
  {
    id: "pro",
    name: "Pro",
    monthlyPrice: 199,
    yearlyPrice: 1788,
    monthlyCredits: 2500,
    features: ["Professional workflows", "Higher monthly usage"],
  },
  {
    id: "agency",
    name: "Agency",
    monthlyPrice: 549,
    yearlyPrice: 5988,
    monthlyCredits: 9000,
    features: ["Client content workflows", "Agency-level credits"],
  },
  {
    id: "business",
    name: "Business",
    monthlyPrice: 1049,
    yearlyPrice: 11988,
    monthlyCredits: 20000,
    features: ["Business-scale usage", "High-output workflows"],
  },
  {
    id: "scale",
    name: "Scale",
    monthlyPrice: 1549,
    monthlyCredits: 35000,
    features: ["Highest credit allowance", "Scale-level production"],
  },
];

function formatMoney(value: number) {
  const hasCents = !Number.isInteger(value);

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: hasCents ? 2 : 0,
  }).format(value);
}

function getMonthlyDisplayPrice(plan: Plan, billingInterval: BillingInterval) {
  if (billingInterval === "monthly") {
    return plan.monthlyPrice;
  }

  if (typeof plan.yearlyPrice !== "number") {
    return undefined;
  }

  return plan.yearlyPrice / 12;
}

function getYearlyDiscount(plan: Plan) {
  if (
    typeof plan.monthlyPrice !== "number" ||
    typeof plan.yearlyPrice !== "number"
  ) {
    return null;
  }

  const normalYearlyCost = plan.monthlyPrice * 12;
  const discount = Math.round(
    ((normalYearlyCost - plan.yearlyPrice) / normalYearlyCost) * 100
  );

  return discount > 0 ? discount : null;
}

export function PricingPlans() {
  const [billingInterval, setBillingInterval] =
    useState<BillingInterval>("monthly");

  const visiblePlans = useMemo(() => {
    return plans.filter((plan) =>
      billingInterval === "monthly"
        ? typeof plan.monthlyPrice === "number"
        : typeof plan.yearlyPrice === "number"
    );
  }, [billingInterval]);

  const maxYearlyDiscount = Math.max(
    0,
    ...plans
      .map((plan) => getYearlyDiscount(plan))
      .filter((discount): discount is number => typeof discount === "number")
  );

  return (
    <>
      <h1 className="sr-only">Pricing</h1>

      <div className="mb-12 flex justify-center">
        <div className="inline-flex rounded-full border border-purple-400/30 bg-white/5 p-1 backdrop-blur-sm">
          <button
            type="button"
            aria-pressed={billingInterval === "monthly"}
            onClick={() => setBillingInterval("monthly")}
            className={[
              "rounded-full px-7 py-3 text-sm font-bold transition",
              billingInterval === "monthly"
                ? "bg-white text-black shadow-lg"
                : "text-purple-100 hover:bg-white/10",
            ].join(" ")}
          >
            Monthly
          </button>

          <button
            type="button"
            aria-pressed={billingInterval === "yearly"}
            onClick={() => setBillingInterval("yearly")}
            className={[
              "rounded-full px-7 py-3 text-sm font-bold transition",
              billingInterval === "yearly"
                ? "bg-white text-black shadow-lg"
                : "text-purple-100 hover:bg-white/10",
            ].join(" ")}
          >
            Yearly ({maxYearlyDiscount}% off)
          </button>
        </div>
      </div>

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {visiblePlans.map((plan) => {
          const price = getMonthlyDisplayPrice(plan, billingInterval);

          if (typeof price !== "number") {
            return null;
          }

          const yearlyDiscount =
            billingInterval === "yearly" ? getYearlyDiscount(plan) : null;

          return (
            <div
              key={plan.id}
              className={[
                "group rounded-3xl border p-8 backdrop-blur-sm transition-all duration-300 hover:-translate-y-2 hover:scale-[1.015] hover:shadow-2xl hover:shadow-purple-600/20",
                plan.highlight
                  ? "border-purple-400/60 bg-purple-500/15 shadow-xl shadow-purple-500/15"
                  : "border-purple-500/20 bg-white/5 hover:border-purple-400/60",
              ].join(" ")}
            >
              <div className="flex min-h-9 flex-wrap items-center gap-3">
                {plan.highlight && (
                  <div className="inline-flex rounded-full border border-purple-300/30 bg-purple-300/10 px-3 py-1 text-xs font-semibold text-purple-100">
                    Popular
                  </div>
                )}

                {billingInterval === "yearly" && (
                  <div className="inline-flex rounded-full border border-emerald-300/30 bg-emerald-300/10 px-3 py-1 text-xs font-semibold text-emerald-100">
                    {yearlyDiscount ? `${yearlyDiscount}% off` : "Yearly only"}
                  </div>
                )}
              </div>

              <h2 className="mt-5 text-2xl font-bold">{plan.name}</h2>

              <div className="mt-8">
                <div className="text-5xl font-black tracking-tight">
                  {formatMoney(price)}/mo
                </div>

                {billingInterval === "yearly" &&
                  typeof plan.yearlyPrice === "number" && (
                    <div className="mt-2 text-sm font-semibold text-purple-100/70">
                      Billed annually at {formatMoney(plan.yearlyPrice)}
                    </div>
                  )}

                <div className="mt-5 inline-flex rounded-full border border-emerald-400/25 bg-emerald-400/10 px-4 py-1.5 text-sm font-semibold text-emerald-200">
                  {plan.monthlyCredits} credits / month
                </div>
              </div>

              <ul className="mt-8 space-y-3 text-sm text-gray-300">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-3">
                    <span className="text-emerald-300">✓</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-8">
                <CheckoutButton
                  planId={plan.id}
                  billingInterval={billingInterval}
                  label="Checkout"
                />
              </div>
            </div>
          );
        })}
      </section>
    </>
  );
}
