import { headers } from "next/headers";
import { NextResponse } from "next/server";
import type Stripe from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getStripeClient } from "@/lib/billing/stripe";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

function unixToIso(value: unknown) {
  return typeof value === "number" ? new Date(value * 1000).toISOString() : null;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown webhook error.";
}

async function markEventProcessed(supabase: SupabaseClient, eventId: string) {
  await supabase
    .from("stripe_events")
    .update({
      status: "processed",
      processed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", eventId);
}

async function markEventFailed(
  supabase: SupabaseClient,
  eventId: string,
  error: unknown
) {
  await supabase
    .from("stripe_events")
    .update({
      status: "failed",
      error_message: getErrorMessage(error),
      updated_at: new Date().toISOString(),
    })
    .eq("id", eventId);
}

async function registerStripeEvent(
  supabase: SupabaseClient,
  event: Stripe.Event
) {
  const object = event.data.object as { id?: string };

  const { error } = await supabase.from("stripe_events").insert({
    id: event.id,
    event_type: event.type,
    status: "processing",
    payload: {
      eventId: event.id,
      eventType: event.type,
      objectId: object.id || null,
      created: event.created,
      livemode: event.livemode,
    },
  });

  if (!error) {
    return { ok: true as const, shouldProcess: true as const };
  }

  if (error.code === "23505") {
    const { data } = await supabase
      .from("stripe_events")
      .select("status")
      .eq("id", event.id)
      .maybeSingle();

    return {
      ok: true as const,
      shouldProcess: false as const,
      status: data?.status || "unknown",
    };
  }

  return {
    ok: false as const,
    shouldProcess: false as const,
    error,
  };
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
      : subscription.customer?.id || null;

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

async function handleCheckoutCompleted(
  supabase: SupabaseClient,
  stripe: Stripe,
  session: Stripe.Checkout.Session
) {
  if (session.mode !== "subscription") {
    return;
  }

  if (typeof session.subscription !== "string") {
    return;
  }

  const subscription = await stripe.subscriptions.retrieve(session.subscription);

  await syncSubscription(
    supabase,
    subscription,
    (session.metadata || {}) as Record<string, string>
  );
}

export async function POST(request: Request) {
  const stripe = getStripeClient();
  const supabase = createSupabaseAdminClient();

  if (!stripe || !supabase) {
    return NextResponse.json(
      {
        error: "Billing webhook is not configured.",
        code: "BILLING_WEBHOOK_NOT_CONFIGURED",
      },
      { status: 500 }
    );
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return NextResponse.json(
      {
        error: "Stripe webhook secret is missing.",
        code: "STRIPE_WEBHOOK_SECRET_MISSING",
      },
      { status: 500 }
    );
  }

  const headerStore = await headers();
  const signature = headerStore.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      {
        error: "Missing Stripe signature.",
        code: "STRIPE_SIGNATURE_MISSING",
      },
      { status: 400 }
    );
  }

  const payload = await request.text();

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch {
    return NextResponse.json(
      {
        error: "Invalid Stripe webhook signature.",
        code: "INVALID_STRIPE_SIGNATURE",
      },
      { status: 400 }
    );
  }

  const registration = await registerStripeEvent(supabase, event);

  if (!registration.ok) {
    return NextResponse.json(
      {
        error: "Could not register Stripe event.",
        code: "STRIPE_EVENT_REGISTER_FAILED",
      },
      { status: 500 }
    );
  }

  if (!registration.shouldProcess) {
    return NextResponse.json({
      ok: true,
      duplicate: true,
      status: registration.status,
    });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(
          supabase,
          stripe,
          event.data.object as Stripe.Checkout.Session
        );
        break;

      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await syncSubscription(
          supabase,
          event.data.object as Stripe.Subscription
        );
        break;

      default:
        break;
    }

    await markEventProcessed(supabase, event.id);

    return NextResponse.json({
      ok: true,
      received: true,
    });
  } catch (error) {
    await markEventFailed(supabase, event.id, error);

    return NextResponse.json(
      {
        error: "Stripe webhook processing failed.",
        code: "STRIPE_WEBHOOK_PROCESSING_FAILED",
      },
      { status: 500 }
    );
  }
}
