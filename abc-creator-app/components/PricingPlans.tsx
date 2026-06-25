"use client";

import { useMemo, useState } from "react";
import { CheckoutButton } from "@/components/CheckoutButton";

type BillingInterval = "monthly" | "yearly";

type Plan = {
  id: string;
  name: string;
  monthlyPrice?: string;
  yearlyPrice?: string;
  monthlyCredits: number;
  features: string[];
  highlight?: boolean;
};

const plans: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    monthlyPrice: "$39/mo",
    yearlyPrice: "$36/year",
    monthlyCredits: 150,
    features: ["Core writing tools", "Light creator usage"],
  },
  {
    id: "plus",
    name: "Plus",
    monthlyPrice: "$69/mo",
    yearlyPrice: "$468/year",
    monthlyCredits: 400,
    features: ["All current writing tools", "Best everyday creator plan"],
    highlight: true,
  },
  {
    id: "bundle",
    name: "Bundle",
    yearlyPrice: "$129/year",
    monthlyCredits: 1400,
    features: ["Yearly creator bundle", "High monthly credit allowance"],
  },
  {
    id: "pro",
    name: "Pro",
    monthlyPrice: "$199/mo",
    yearlyPrice: "$1,788/year",
    monthlyCredits: 2500,
    features: ["Professional workflows", "Higher monthly usage"],
  },
  {
    id: "agency",
    name: "Agency",
    monthlyPrice: "$549/mo",
    yearlyPrice: "$5,988/year",
    monthlyCredits: 9000,
    features: ["Client content workflows", "Agency-level credits"],
  },
  {
    id: "business",
    name: "Business",
    monthlyPrice: "$1,049/mo",
    yearlyPrice: "$11,988/year",
    monthlyCredits: 20000,
    features: ["Business-scale usage", "High-output workflows"],
  },
  {
    id: "scale",
    name: "Scale",
    monthlyPrice: "$1,549/mo",
    monthlyCredits: 35000,
    features: ["Highest credit allowance", "Scale-level production"],
  },
];

export function PricingPlans() {
  const [billingInterval, setBillingInterval] =
    useState<BillingInterval>("monthly");

  const visiblePlans = useMemo(() => {
    return plans.filter((plan) =>
      billingInterval === "monthly" ? plan.monthlyPrice : plan.yearlyPrice
    );
  }, [billingInterval]);

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
            Yearly
          </button>
        </div>
      </div>

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {visiblePlans.map((plan) => {
          const price =
            billingInterval === "monthly"
              ? plan.monthlyPrice
              : plan.yearlyPrice;

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
              {plan.highlight && (
                <div className="mb-5 inline-flex rounded-full border border-purple-300/30 bg-purple-300/10 px-3 py-1 text-xs font-semibold text-purple-100">
                  Popular
                </div>
              )}

              <h2 className="text-2xl font-bold">{plan.name}</h2>

              <div className="mt-8">
                <div className="text-5xl font-black tracking-tight">
                  {price}
                </div>

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
