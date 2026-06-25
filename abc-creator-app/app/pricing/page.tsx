import Link from "next/link";

const plans = [
  {
    name: "Free",
    price: "$0",
    note: "Start testing Creator",
    credits: "10 lifetime credits",
    highlight: false,
    features: [
      "Try core AI writing tools",
      "No credit card required",
      "Email verification required",
    ],
    cta: "Current free starter",
  },
  {
    name: "Plus",
    price: "Coming soon",
    note: "For regular creators",
    credits: "400 credits / month",
    highlight: true,
    features: [
      "More monthly generations",
      "Use all available writing tools",
      "Designed for creators and small businesses",
    ],
    cta: "Payments coming soon",
  },
  {
    name: "Yearly Creator Bundle",
    price: "$129 / year",
    note: "Best value for heavy users",
    credits: "1400 credits / month",
    highlight: false,
    features: [
      "Large monthly credit allowance",
      "Best for teams, agencies, and daily creators",
      "Stripe and Razorpay support planned",
    ],
    cta: "Payments coming soon",
  },
];

const usageCosts = [
  ["Blog Topic Ideas", "2 credits"],
  ["Product Description", "3 credits"],
  ["Facebook Ad Copy", "4 credits"],
  ["AI Image Generation", "46 credits"],
  ["AI Video — 4 seconds", "98 credits"],
  ["AI Video — 8 seconds", "198 credits"],
];

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#4c1d95_0%,#160029_35%,#030006_75%)] opacity-80" />
      <div className="relative z-10 mx-auto max-w-7xl px-6 py-12">
        <div className="mb-10 flex items-center justify-between gap-6">
          <Link href="/" className="flex items-center gap-3">
            <img src="/abc-logo.png" alt="Creator" className="h-12 w-auto" />
            <span className="text-lg font-semibold">Creator</span>
          </Link>

          <Link
            href="/dashboard"
            className="rounded-full border border-purple-400/30 px-5 py-2 text-sm font-medium text-purple-100 transition hover:border-purple-300 hover:bg-purple-500/10"
          >
            Back to dashboard
          </Link>
        </div>

        <section className="mb-14 text-center">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.35em] text-purple-300">
            Pricing
          </p>
          <h1 className="mx-auto max-w-3xl text-4xl font-bold leading-tight md:text-6xl">
            Choose the credits that match your creative workload.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-gray-300">
            Credits are spent only when you generate content. Failed generations are refunded automatically.
          </p>
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={[
                "rounded-3xl border p-8 backdrop-blur-sm",
                plan.highlight
                  ? "border-purple-400/60 bg-purple-500/15 shadow-2xl shadow-purple-500/20"
                  : "border-purple-500/20 bg-white/5",
              ].join(" ")}
            >
              {plan.highlight && (
                <div className="mb-5 inline-flex rounded-full border border-purple-300/30 bg-purple-300/10 px-3 py-1 text-xs font-semibold text-purple-100">
                  Most flexible
                </div>
              )}

              <h2 className="text-2xl font-bold">{plan.name}</h2>
              <p className="mt-2 text-sm text-gray-400">{plan.note}</p>

              <div className="mt-7">
                <div className="text-4xl font-bold">{plan.price}</div>
                <div className="mt-3 inline-flex rounded-full border border-emerald-400/25 bg-emerald-400/10 px-4 py-1.5 text-sm font-semibold text-emerald-200">
                  {plan.credits}
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

              <button
                disabled
                className="mt-8 w-full rounded-full border border-white/10 bg-white/10 px-5 py-3 text-sm font-semibold text-white/70"
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </section>

        <section className="mt-14 rounded-3xl border border-purple-500/20 bg-white/5 p-8 backdrop-blur-sm">
          <h2 className="text-2xl font-bold">Credit usage</h2>
          <p className="mt-2 text-sm text-gray-400">
            Different tools use different credit amounts based on generation cost.
          </p>

          <div className="mt-6 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {usageCosts.map(([name, cost]) => (
              <div
                key={name}
                className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/30 px-5 py-4"
              >
                <span className="text-sm text-gray-200">{name}</span>
                <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-200">
                  {cost}
                </span>
              </div>
            ))}
          </div>
        </section>

        <p className="mt-10 text-center text-sm text-gray-500">
          Stripe and Razorpay checkout will be added after the credit purchase flow is finalized.
        </p>
      </div>
    </main>
  );
}
