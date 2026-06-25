import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripeClient } from "@/lib/billing/stripe";

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

  const { data: subscription, error: subscriptionError } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (subscriptionError) {
    return NextResponse.json(
      {
        error: "Could not load billing profile.",
        code: "BILLING_PROFILE_LOAD_FAILED",
      },
      { status: 500 }
    );
  }

  if (!subscription?.stripe_customer_id) {
    return NextResponse.json(
      {
        error: "No Stripe billing customer found for this account.",
        code: "NO_BILLING_CUSTOMER",
      },
      { status: 404 }
    );
  }

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    new URL(request.url).origin;

  try {
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: `${appUrl}/dashboard?billing=portal_return`,
    });

    if (!portalSession.url) {
      return NextResponse.json(
        {
          error: "Could not create billing portal session.",
          code: "BILLING_PORTAL_SESSION_FAILED",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      url: portalSession.url,
    });
  } catch {
    return NextResponse.json(
      {
        error: "Could not create billing portal session.",
        code: "BILLING_PORTAL_SESSION_FAILED",
      },
      { status: 500 }
    );
  }
}
