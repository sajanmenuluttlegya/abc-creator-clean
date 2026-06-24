import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function getAppUrl(request: Request) {
  const configuredAppUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (configuredAppUrl) {
    return configuredAppUrl.replace(/\/$/, "");
  }

  const forwardedProto = request.headers.get("x-forwarded-proto") ?? "https";
  const forwardedHost = request.headers.get("x-forwarded-host");

  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }

  return new URL(request.url).origin;
}

function readableError(error: unknown) {
  console.error("Email auth route error:", error);

  if (!error) return "Something went wrong. Please try again.";
  if (typeof error === "string") return error;

  if (typeof error === "object") {
    const err = error as {
      message?: unknown;
      error_description?: unknown;
      code?: unknown;
      status?: unknown;
      name?: unknown;
    };

    const message =
      typeof err.message === "string" ? err.message.trim() : "";

    if (message && message !== "{}") {
      return message;
    }

    if (
      typeof err.error_description === "string" &&
      err.error_description.trim()
    ) {
      return err.error_description;
    }

    if (
      err.name === "AuthRetryableFetchError" ||
      err.status === 500 ||
      message === "{}"
    ) {
      return "Supabase could not send the confirmation email. Check SMTP settings or turn custom SMTP off.";
    }

    if (typeof err.code === "string" && err.code.trim()) {
      return `Auth error: ${err.code}`;
    }

    if (typeof err.status === "number") {
      return `Auth failed with status ${err.status}.`;
    }
  }

  return "Auth failed. Check Supabase Auth logs.";
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const mode = String(body.mode ?? "");
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    const fullName = String(body.fullName ?? "").trim();

    if (mode !== "signup" && mode !== "login") {
      return NextResponse.json(
        { ok: false, error: "Invalid auth mode." },
        { status: 400 }
      );
    }

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { ok: false, error: "Enter a valid email address." },
        { status: 400 }
      );
    }

    if (!password || password.length < 8) {
      return NextResponse.json(
        { ok: false, error: "Password must be at least 8 characters." },
        { status: 400 }
      );
    }

    if (mode === "signup" && fullName.length < 2) {
      return NextResponse.json(
        { ok: false, error: "Full name must be at least 2 characters." },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const appUrl = getAppUrl(request);

    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${appUrl}/auth/callback?next=/dashboard`,
          data: {
            full_name: fullName,
            name: fullName,
          },
        },
      });

      if (error) {
        return NextResponse.json(
          { ok: false, error: readableError(error) },
          { status: 400 }
        );
      }

      return NextResponse.json({
        ok: true,
        needsVerification: !data.session || !data.user?.email_confirmed_at,
      });
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      const msg = readableError(error);
      const lower = msg.toLowerCase();

      if (lower.includes("email not confirmed") || lower.includes("confirm")) {
        return NextResponse.json({
          ok: true,
          needsVerification: true,
        });
      }

      return NextResponse.json({ ok: false, error: msg }, { status: 401 });
    }

    if (!data.user) {
      return NextResponse.json(
        { ok: false, error: "Login failed. Please try again." },
        { status: 401 }
      );
    }

    if (!data.user.email_confirmed_at) {
      return NextResponse.json({
        ok: true,
        needsVerification: true,
      });
    }

    return NextResponse.json({
      ok: true,
      needsVerification: false,
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: readableError(error) },
      { status: 500 }
    );
  }
}
