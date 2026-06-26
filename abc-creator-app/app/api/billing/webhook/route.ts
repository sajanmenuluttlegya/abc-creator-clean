import { headers } from "next/headers";
import { NextResponse } from "next/server";
import type Stripe from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getStripeClient } from "@/lib/billing/stripe";
import { getPlanCreditGrant } from "@/lib/billing/plan-credits";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

function unixToIso(value: unknown) {
  return typeof value === "number" ? new Date(value * 1000).toISOString() : null;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown webhook error.";
}

function logWebhookError(message: string, error: unknown, extra: Record<string, unknown> = {}) {
  console.error(message, {
    ...extra,
    error,
    errorMessage: getErrorMessage(error),
  });
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

function getInvoiceSubscriptionId(invoice: Stripe.Invoice) {
  const rawInvoice = invoice as unknown as {
    subscription?: string | { id?: string } | null;
    parent?: {
      subscription_details?: {
        subscription?: string | { id?: string } | null;
      } | null;
    } | null;
    lines?: {
      data?: Array<{
        parent?: {
          subscription_item_details?: {
            subscription?: string | { id?: string } | null;
          } | null;
          invoice_item_details?: {
            subscription?: string | { id?: string } | null;
          } | null;
        } | null;
      }>;
    };
  };

  return (
    readStripeId(rawInvoice.subscription) ||
    readStripeId(rawInvoice.parent?.subscription_details?.subscription) ||
    rawInvoice.lines?.data
      ?.map((line) =>
        readStripeId(line.parent?.subscription_item_details?.subscription) ||
        readStripeId(line.parent?.invoice_item_details?.subscription)
      )
      .find(Boolean) ||
    null
  );
}

function getInvoiceSubscriptionMetadata(invoice: Stripe.Invoice) {
  const rawInvoice = invoice as unknown as {
    parent?: {
      subscription_details?: {
        metadata?: Record<string, string> | null;
      } | null;
    } | null;
  };

  return rawInvoice.parent?.subscription_details?.metadata || {};
}

function getInvoicePeriod(invoice: Stripe.Invoice) {
  const rawInvoice = invoice as unknown as {
    period_start?: number;
    period_end?: number;
    lines?: {
      data?: Array<{
        period?: {
          start?: number;
          end?: number;
        };
      }>;
    };
  };

  const linePeriod = rawInvoice.lines?.data?.find(
    (line) => line.period?.start && line.period?.end
  )?.period;

  return {
    periodStart: unixToIso(linePeriod?.start ?? rawInvoice.period_start),
    periodEnd: unixToIso(linePeriod?.end ?? rawInvoice.period_end),
  };
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
    const { data, error: selectError } = await supabase
      .from("stripe_events")
      .select("status")
      .eq("id", event.id)
      .maybeSingle();

    if (selectError) {
      logWebhookError("Stripe webhook duplicate lookup failed", selectError, {
        eventId: event.id,
        eventType: event.type,
      });

      return {
        ok: false as const,
        shouldProcess: false as const,
        error: selectError,
      };
    }

    if (data?.status === "failed") {
      const { error: retryError } = await supabase
        .from("stripe_events")
        .update({
          status: "processing",
          error_message: null,
          updated_at: new Date().toISOString(),
          payload: {
            eventId: event.id,
            eventType: event.type,
            objectId: object.id || null,
            created: event.created,
            livemode: event.livemode,
            retryingFailedEvent: true,
          },
        })
        .eq("id", event.id);

      if (retryError) {
        logWebhookError("Stripe webhook failed-event retry update failed", retryError, {
          eventId: event.id,
          eventType: event.type,
        });

        return {
          ok: false as const,
          shouldProcess: false as const,
          error: retryError,
        };
      }

      return {
        ok: true as const,
        shouldProcess: true as const,
        retryingFailedEvent: true as const,
      };
    }

    return {
      ok: true as const,
      shouldProcess: false as const,
      status: data?.status || "unknown",
    };
  }

  logWebhookError("Stripe webhook event insert failed", error, {
    eventId: event.id,
    eventType: event.type,
  });

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

async function grantSubscriptionCredits(
  supabase: SupabaseClient,
  subscription: Stripe.Subscription,
  invoice: Stripe.Invoice
) {
  const metadata = {
    ...getInvoiceSubscriptionMetadata(invoice),
    ...(subscription.metadata || {}),
  };

  const userId = metadata.userId;
  const planId = metadata.planId;
  const billingInterval = metadata.billingInterval;

  if (!userId || !planId || !billingInterval || !invoice.id) {
    return;
  }

  const rawInvoiceForPayment = invoice as unknown as {
    amount_paid?: number;
  };

  if (
    typeof rawInvoiceForPayment.amount_paid === "number" &&
    rawInvoiceForPayment.amount_paid <= 0
  ) {
    return;
  }

  const creditGrant = getPlanCreditGrant(planId, billingInterval);

  if (!creditGrant.ok) {
    throw new Error(creditGrant.error);
  }

  const rawSubscription = subscription as unknown as {
    current_period_start?: number;
    current_period_end?: number;
  };

  const invoicePeriod = getInvoicePeriod(invoice);

  const periodStart =
    invoicePeriod.periodStart || unixToIso(rawSubscription.current_period_start);
  const periodEnd =
    invoicePeriod.periodEnd || unixToIso(rawSubscription.current_period_end);

  const { error } = await supabase.rpc("grant_subscription_credits", {
    p_user_id: userId,
    p_grant_amount: creditGrant.grantAmount,
    p_monthly_credits: creditGrant.monthlyCredits,
    p_months_granted: creditGrant.monthsGranted,
    p_plan_id: creditGrant.planId,
    p_billing_interval: creditGrant.billingInterval,
    p_stripe_invoice_id: invoice.id,
    p_stripe_subscription_id: subscription.id,
    p_period_start: periodStart,
    p_period_end: periodEnd,
    p_idempotency_key: `stripe_invoice_${invoice.id}`,
  });

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

async function handlePaidInvoice(
  supabase: SupabaseClient,
  stripe: Stripe,
  invoice: Stripe.Invoice
) {
  const subscriptionId = getInvoiceSubscriptionId(invoice);

  if (!subscriptionId) {
    return;
  }

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  await syncSubscription(supabase, subscription);
  await grantSubscriptionCredits(supabase, subscription, invoice);
}

async function handleInvoiceSubscriptionSync(
  supabase: SupabaseClient,
  stripe: Stripe,
  invoice: Stripe.Invoice
) {
  const subscriptionId = getInvoiceSubscriptionId(invoice);

  if (!subscriptionId) {
    return;
  }

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  await syncSubscription(supabase, subscription);
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
    logWebhookError("Stripe webhook registration failed", registration.error, {
      eventId: event.id,
      eventType: event.type,
    });

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

      case "invoice.paid":
      case "invoice.payment_succeeded":
        await handlePaidInvoice(
          supabase,
          stripe,
          event.data.object as Stripe.Invoice
        );
        break;

      case "invoice.payment_failed":
        await handleInvoiceSubscriptionSync(
          supabase,
          stripe,
          event.data.object as Stripe.Invoice
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
    logWebhookError("Stripe webhook processing failed", error, {
      eventId: event.id,
      eventType: event.type,
    });

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
