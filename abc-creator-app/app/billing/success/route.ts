import { NextResponse } from "next/server";
import type Stripe from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getStripeClient } from "@/lib/billing/stripe";

export const runtime = "nodejs";

function getAppUrl(request: Request) {
  const forwardedProto = request.headers.get("x-forwarded-proto") ?? "https";
  const forwardedHost = request.headers.get("x-forwarded-host");

  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }

  return new URL(request.url).origin;
}

function unixToIso(value: unknown) {
  return typeof value === "number" ? new Date(value * 1000).toISOString() : null;
}

function readStripeId(value: unknown) {
  if (typeof value === "string") {
    return value;
  }

  if (
    value &&
    typeof value === "object" &&
    "id" in value &&
    typeof (value as { id?: unknown }).id === "string"
  ) {
    return (value as { id: string }).id;
  }

  return null;
}

async function getSubscriptionFromCheckoutSession(
  stripe: Stripe,
  session: Stripe.Checkout.Session
) {
  const subscriptionValue = session.subscription as unknown;
  const subscriptionId = readStripeId(subscriptionValue);

  if (!subscriptionId) {
    return null;
  }

  if (typeof subscriptionValue === "object" && subscriptionValue) {
    return subscriptionValue as Stripe.Subscription;
  }

  return await stripe.subscriptions.retrieve(subscriptionId);
}

async function syncSubscription(
  supabase: SupabaseClient,
  subscription: Stripe.Subscription,
  fallbackMetadata: Record<string, string> = {}
) {
  const rawSubscription = subscription as unknown as {
    current_period_start?: number;
    current_period_end?: number;
    cancel_at_period_end?: boolean;
  };

  const metadata = {
    ...fallbackMetadata,
    ...(subscription.metadata || {}),
  };

  const userId = metadata.userId;

  if (!userId) {
    return;
  }

  const customer =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer && "id" in subscription.customer
        ? subscription.customer.id
        : null;

  const priceId = subscription.items?.data?.[0]?.price?.id || null;

  const { error } = await supabase.from("subscriptions").upsert(
    {
      user_id: userId,
      stripe_customer_id: customer,
      stripe_subscription_id: subscription.id,
      stripe_price_id: priceId,
      plan_id: metadata.planId || null,
      billing_interval: metadata.billingInterval || null,
      status: subscription.status,
      current_period_start: unixToIso(rawSubscription.current_period_start),
      current_period_end: unixToIso(rawSubscription.current_period_end),
      cancel_at_period_end: Boolean(rawSubscription.cancel_at_period_end),
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "user_id",
    }
  );

  if (error) {
    throw error;
  }
}

export async function GET(request: Request) {
  const appUrl = getAppUrl(request);
  const redirectToDashboard = (billing: string) =>
    NextResponse.redirect(`${appUrl}/dashboard?billing=${billing}`);

  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("session_id");

  if (!sessionId) {
    return redirectToDashboard("missing_session");
  }

  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    const loginUrl = new URL(`${appUrl}/login`);
    loginUrl.searchParams.set(
      "next",
      `/billing/success?session_id=${encodeURIComponent(sessionId)}`
    );
    return NextResponse.redirect(loginUrl);
  }

  const stripe = getStripeClient();
  const admin = createSupabaseAdminClient();

  if (!stripe || !admin) {
    return redirectToDashboard("sync_not_configured");
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription"],
    });

    const sessionUserId = session.client_reference_id || session.metadata?.userId;

    if (session.mode !== "subscription" || sessionUserId !== user.id) {
      return redirectToDashboard("session_mismatch");
    }

    const subscription = await getSubscriptionFromCheckoutSession(stripe, session);

    if (!subscription) {
      return redirectToDashboard("missing_subscription");
    }

    await syncSubscription(
      admin,
      subscription,
      (session.metadata || {}) as Record<string, string>
    );

    return redirectToDashboard(
      session.payment_status === "paid" ? "synced" : "awaiting_payment"
    );
  } catch (error) {
    console.error("Billing success sync failed:", error);
    return redirectToDashboard("sync_failed");
  }
}
