import Link from "next/link";

const plans = [
  {
    name: "Starter",
    monthly: "$39/mo",
    yearly: "$36/year",
    credits: "150 credits / month",
    description: "For beginners and light creators starting with ABC Creator.",
    features: ["Core AI writing tools", "Monthly credit allowance", "Good for light content work"],
  },
  {
    name: "Plus",
    monthly: "$69/mo",
    yearly: "$468/year",
    credits: "400 credits / month",
    description: "For regular creators, freelancers, and small businesses.",
    features: ["More monthly credits", "All current writing tools", "Best everyday creator plan"],
    highlight: true,
  },
  {
    name: "Bundle",
    monthly: "Yearly only",
    yearly: "$129/year",
    credits: "1400 credits / month",
    description: "A special yearly creator bundle with high monthly credits.",
    features: ["Large monthly credit allowance", "Best low-cost yearly option", "Built for serious creators"],
  },
  {
    name: "Pro",
    monthly: "$199/mo",
    yearly: "$1,788/year",
    credits: "2500 credits / month",
    description: "For professional creators, marketers, and content teams.",
    features: ["High-volume generation", "Professional content workflows", "More room for long-form tools"],
  },
  {
    name: "Agency",
    monthly: "$549/mo",
    yearly: "$5,988/year",
    credits: "9000 credits / month",
    description: "For agencies handling multiple brands or clients.",
    features: ["Agency-level credit allowance", "Client content workflows", "Designed for scale"],
  },
  {
    name: "Business",
    monthly: "$1,049/mo",
    yearly: "$11,988/year",
    credits: "20000 credits / month",
    description: "For high-volume business teams and advanced usage.",
    features: ["Large team usage", "Business-scale monthly credits", "High-output generation workflows"],
  },
  {
    name: "Scale",
    monthly: "$1,549/mo",
    yearly: "Monthly only",
    credits: "35000 credits / month",
    description: "For maximum-volume teams and large-scale content operations.",
    features: ["Highest monthly credit allowance", "Built for heavy usage", "Scale-level production workflow"],
  },
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
            Choose the plan that fits your content workflow.
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-gray-300">
            Every paid plan includes a monthly credit allowance for ABC Creator tools. No free trial. Credits are granted only after successful payment confirmation.
          </p>
        </section>

        <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={[
                "rounded-3xl border p-8 backdrop-blur-sm transition",
                plan.highlight
                  ? "border-purple-400/60 bg-purple-500/15 shadow-2xl shadow-purple-500/20"
                  : "border-purple-500/20 bg-white/5",
              ].join(" ")}
            >
              {plan.highlight && (
                <div className="mb-5 inline-flex rounded-full border border-purple-300/30 bg-purple-300/10 px-3 py-1 text-xs font-semibold text-purple-100">
                  Popular
                </div>
              )}

              <h2 className="text-2xl font-bold">{plan.name}</h2>

              <p className="mt-2 min-h-[52px] text-sm leading-6 text-gray-400">
                {plan.description}
              </p>

              <div className="mt-7">
                <div className="text-4xl font-bold">{plan.monthly}</div>
                <div className="mt-2 text-sm text-gray-400">{plan.yearly}</div>

                <div className="mt-5 inline-flex rounded-full border border-emerald-400/25 bg-emerald-400/10 px-4 py-1.5 text-sm font-semibold text-emerald-200">
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
                Payments coming soon
              </button>
            </div>
          ))}
        </section>

        <p className="mt-10 text-center text-sm text-gray-500">
          No money refunds are provided after payment. Cancelling a subscription stops future renewals. Stripe and Razorpay checkout will be connected after the billing flow is finalized.
        </p>
      </div>
    </main>
  );
}
