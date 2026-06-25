import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripeClient } from "@/lib/billing/stripe";
import { getStripePriceId } from "@/lib/billing/stripe-price-map";

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: "Login required.", code: "AUTH_REQUIRED" },
      { status: 401 }
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body.", code: "INVALID_JSON" },
      { status: 400 }
    );
  }

  const payload = body as {
    planId?: unknown;
    billingInterval?: unknown;
  };

  if (
    typeof payload.planId !== "string" ||
    typeof payload.billingInterval !== "string"
  ) {
    return NextResponse.json(
      {
        error: "planId and billingInterval are required.",
        code: "MISSING_BILLING_FIELDS",
      },
      { status: 400 }
    );
  }

  const priceResult = getStripePriceId(
    payload.planId,
    payload.billingInterval
  );

  if (!priceResult.ok) {
    return NextResponse.json(
      {
        error: priceResult.error,
        code: priceResult.code,
      },
      { status: priceResult.code === "BILLING_NOT_CONFIGURED" ? 501 : 400 }
    );
  }

  const stripe = getStripeClient();

  if (!stripe) {
    return NextResponse.json(
      {
        error: "Billing is not configured yet.",
        code: "BILLING_NOT_CONFIGURED",
      },
      { status: 501 }
    );
  }

  const forwardedProto = request.headers.get("x-forwarded-proto") ?? "https";
  const forwardedHost = request.headers.get("x-forwarded-host");
  const appUrl = forwardedHost
    ? `${forwardedProto}://${forwardedHost}`
    : new URL(request.url).origin;

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer_email: user.email || undefined,
    client_reference_id: user.id,
    line_items: [
      {
        price: priceResult.priceId,
        quantity: 1,
      },
    ],
    success_url: `${appUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/pricing?billing=cancelled`,
    metadata: {
      userId: user.id,
      planId: priceResult.planId,
      billingInterval: priceResult.billingInterval,
    },
    subscription_data: {
      metadata: {
        userId: user.id,
        planId: priceResult.planId,
        billingInterval: priceResult.billingInterval,
      },
    },
    allow_promotion_codes: false,
  });

  if (!session.url) {
    return NextResponse.json(
      {
        error: "Could not create checkout session.",
        code: "CHECKOUT_SESSION_FAILED",
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    url: session.url,
  });
}
