import Link from "next/link";
import { PricingPlans } from "@/components/PricingPlans";

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#4c1d95_0%,#160029_35%,#030006_75%)] opacity-80" />

      <div className="relative z-10 mx-auto max-w-7xl px-6 py-10">
        <div className="mb-10 flex items-center justify-between gap-6">
          <Link href="/" className="flex items-center gap-3">
            <img src="/abc-logo.png" alt="Creator" className="h-12 w-auto" />
            <span className="text-lg font-semibold">Creator</span>
          </Link>

          <Link
            href="/dashboard"
            className="rounded-full border border-purple-400/30 px-5 py-2 text-sm font-medium text-purple-100 transition hover:border-purple-300 hover:bg-purple-500/10"
          >
            Dashboard
          </Link>
        </div>

        <PricingPlans />
      </div>
    </main>
  );
}
