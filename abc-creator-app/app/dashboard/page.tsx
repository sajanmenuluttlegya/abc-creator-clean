import Link from "next/link";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/SignOutButton";
import { BillingPortalButton } from "@/components/BillingPortalButton";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type SubscriptionSummary = {
  stripe_customer_id?: string | null;
  plan_id?: string | null;
  billing_interval?: string | null;
  status?: string | null;
  current_period_end?: string | null;
  cancel_at_period_end?: boolean | null;
};

function titleCasePlan(planId?: string | null) {
  if (!planId) return "Free";

  return planId
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatBillingStatus(status?: string | null) {
  if (!status) return "No paid subscription";

  return status
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDate(value?: string | null) {
  if (!value) return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(date);
}

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  if (!user.email_confirmed_at) {
    redirect("/verify-email");
  }

  const creditResult = await supabase.rpc("ensure_credit_account");
  const creditData = creditResult.data as { ok?: boolean; balance?: number } | null;
  const creditBalance =
    !creditResult.error && typeof creditData?.balance === "number"
      ? creditData.balance
      : 0;

  const subscriptionResult = await supabase
    .from("subscriptions")
    .select(
      "stripe_customer_id, plan_id, billing_interval, status, current_period_end, cancel_at_period_end"
    )
    .eq("user_id", user.id)
    .maybeSingle();

  const subscription =
    !subscriptionResult.error && subscriptionResult.data
      ? (subscriptionResult.data as SubscriptionSummary)
      : null;

  const hasActivePaidPlan = subscription?.status === "active";
  const currentPlan = hasActivePaidPlan
    ? titleCasePlan(subscription?.plan_id)
    : "Free";

  const billingStatus = formatBillingStatus(subscription?.status);
  const periodEnd = formatDate(subscription?.current_period_end);

  return (
    <main className="min-h-screen bg-black text-white">
      <nav className="sticky top-0 z-50 border-b border-purple-500/10 bg-black/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            <img src="/abc-logo.png" alt="Creator" className="h-12 w-auto" />
            <span className="text-xl font-semibold">Creator</span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/tools"
              className="rounded-full px-5 py-2 text-sm text-gray-300 transition hover:text-white"
            >
              Tools
            </Link>

            <Link
              href="/pricing"
              className="rounded-full border border-emerald-400/30 px-5 py-2 text-sm font-medium text-emerald-100 transition hover:border-emerald-300 hover:bg-emerald-500/10"
            >
              Get credits
            </Link>

            <SignOutButton />
          </div>
        </div>
      </nav>

      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="rounded-3xl border border-purple-500/20 bg-white/[0.04] p-8 shadow-2xl shadow-purple-950/25">
          <p className="mb-2 text-sm text-purple-200">Signed in as</p>
          <h1 className="mb-6 text-3xl font-bold">{user.email}</h1>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-purple-500/20 bg-black/40 p-6">
              <p className="text-sm text-gray-400">Current plan</p>
              <h2 className="mt-2 text-2xl font-bold">{currentPlan}</h2>
              <p className="mt-2 text-sm text-gray-400">
                {hasActivePaidPlan
                  ? "Paid plan confirmed by Stripe webhook."
                  : "No active paid subscription."}
              </p>
            </div>

            <div className="rounded-2xl border border-purple-500/20 bg-black/40 p-6">
              <p className="text-sm text-gray-400">Credits remaining</p>
              <h2 className="mt-2 text-2xl font-bold">{creditBalance}</h2>
              <p className="mt-2 text-sm text-gray-400">
                Credits are granted only after successful payment confirmation.
              </p>
            </div>

            <div className="rounded-2xl border border-purple-500/20 bg-black/40 p-6">
              <p className="text-sm text-gray-400">Account status</p>
              <h2 className="mt-2 text-2xl font-bold text-green-300">
                Verified
              </h2>
              <p className="mt-2 text-sm text-gray-400">
                Email verified. Dashboard unlocked.
              </p>
            </div>

            <div className="rounded-2xl border border-purple-500/20 bg-black/40 p-6">
              <p className="text-sm text-gray-400">Billing</p>
              <h2 className="mt-2 text-2xl font-bold">{billingStatus}</h2>

              {periodEnd && (
                <p className="mt-2 text-sm text-gray-400">
                  Current period ends {periodEnd}.
                </p>
              )}

              {subscription?.cancel_at_period_end && (
                <p className="mt-2 text-sm text-amber-300">
                  Cancelled. Access continues until the current period ends.
                </p>
              )}

              {subscription?.stripe_customer_id ? (
                <BillingPortalButton />
              ) : (
                <Link
                  href="/pricing"
                  className="mt-4 inline-flex rounded-full border border-emerald-400/30 px-4 py-2 text-sm font-semibold text-emerald-100 transition hover:border-emerald-300 hover:bg-emerald-500/10"
                >
                  View plans
                </Link>
              )}
            </div>
          </div>

          <p className="mt-6 text-sm text-gray-500">
            No free trial. No money refunds after payment. Cancelling stops future renewals.
          </p>

          <Link
            href="/tools"
            className="mt-8 inline-flex rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-3 font-semibold text-white shadow-lg shadow-purple-600/20"
          >
            Open tools
          </Link>
        </div>
      </section>
    </main>
  );
}
