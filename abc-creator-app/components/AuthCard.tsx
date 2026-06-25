"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Provider } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

type AuthCardProps = {
  mode: "login" | "signup";
};

function getAppUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    window.location.origin
  ).replace(/\/$/, "");
}

function readableAuthError(error: unknown) {
  console.error("Supabase auth error:", error);

  if (!error) {
    return "Something went wrong. Please try again.";
  }

  if (typeof error === "string") {
    return error;
  }

  if (typeof error === "object") {
    const anyError = error as {
      message?: unknown;
      error_description?: unknown;
      code?: unknown;
      status?: unknown;
      name?: unknown;
    };

    if (typeof anyError.message === "string" && anyError.message.trim()) {
      return anyError.message;
    }

    if (
      typeof anyError.error_description === "string" &&
      anyError.error_description.trim()
    ) {
      return anyError.error_description;
    }

    if (typeof anyError.code === "string" && anyError.code.trim()) {
      return `Auth error: ${anyError.code}`;
    }

    if (typeof anyError.status === "number") {
      return `Auth failed with status ${anyError.status}. Check Supabase email provider settings.`;
    }
  }

  return "Auth failed, but Supabase did not return a readable message. Check browser console and Supabase Auth logs.";
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}


async function readJsonResponse(response: Response) {
  try {
    return await response.json();
  } catch {
    return {
      ok: false,
      error: "Server returned an unreadable auth response.",
    };
  }
}
export function AuthCard({ mode }: AuthCardProps) {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [errorText, setErrorText] = useState("");

  const isSignup = mode === "signup";

  const handleOAuth = async (provider: Provider) => {
    setIsBusy(true);
    setErrorText("");

    const redirectTo = `${getAppUrl()}/auth/callback?next=/dashboard`;

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo },
    });

    if (error) {
      setErrorText(readableAuthError(error));
      setIsBusy(false);
    }
  };

  const handleEmailSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const cleanEmail = email.trim().toLowerCase();

    setIsBusy(true);
    setErrorText("");

    try {
      const response = await fetch("/api/auth/email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mode: isSignup ? "signup" : "login",
          email: cleanEmail,
          password,
          fullName: fullName.trim(),
        }),
      });

      const result = await readJsonResponse(response);

      setIsBusy(false);

      if (!response.ok || !result.ok) {
        setErrorText(
          result.error || "Email authentication failed. Check Supabase Auth logs."
        );
        return;
      }

      if (result.needsVerification) {
        router.push(`/verify-email?email=${encodeURIComponent(cleanEmail)}`);
        return;
      }

      window.location.href = "/dashboard";
      router.refresh();
    } catch (error) {
      console.error("Email auth client error:", error);
      setIsBusy(false);
      setErrorText(
        "Could not contact the auth server. Check the dev server and try again."
      );
    }
  };

  return (
    <main className="min-h-screen overflow-hidden bg-black text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#4c1d95_0%,#18002f_34%,#030006_74%)] opacity-75" />
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.20),rgba(0,0,0,0.88))]" />

      <section className="relative z-10 mx-auto flex min-h-screen w-full max-w-xl flex-col items-center justify-center px-8 py-12">
        <Link href="/" className="mb-8 flex flex-col items-center gap-5">
          <img
            src="/abc-logo.png"
            alt="Creator"
            className="h-28 w-auto object-contain drop-shadow-[0_0_28px_rgba(168,85,247,0.35)]"
          />

          <h1 className="max-w-lg text-center text-4xl font-bold leading-tight tracking-tight md:text-5xl">
            Build publish-ready AI content in minutes
          </h1>
        </Link>

        <div className="w-full">
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleOAuth("google")}
              disabled={isBusy}
              className="flex items-center justify-center gap-3 rounded-full border border-purple-400/25 bg-white/[0.03] px-5 py-3 font-semibold text-white transition hover:bg-white/[0.07] disabled:opacity-50"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-lg font-black text-black">
                G
              </span>
              Google
            </button>

            <button
              type="button"
              onClick={() => handleOAuth("github")}
              disabled={isBusy}
              className="flex items-center justify-center gap-3 rounded-full border border-purple-400/25 bg-white/[0.03] px-5 py-3 font-semibold text-white transition hover:bg-white/[0.07] disabled:opacity-50"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-xs font-black text-black">
                GH
              </span>
              GitHub
            </button>
          </div>

          <div className="my-8 flex items-center gap-4">
            <div className="h-px flex-1 bg-purple-300/20" />
            <span className="text-sm text-purple-100/75">
              or continue with email
            </span>
            <div className="h-px flex-1 bg-purple-300/20" />
          </div>

          <form onSubmit={handleEmailSubmit} className="space-y-4">
            {isSignup ? (
              <input
                type="text"
                required
                minLength={2}
                placeholder="Full name"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                className="w-full rounded-xl border border-purple-500/40 bg-black/45 px-4 py-4 text-white outline-none placeholder:text-purple-100/45 focus:border-purple-400 focus:ring-2 focus:ring-purple-500/40"
              />
            ) : null}

            <input
              type="email"
              required
              placeholder="Work email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-xl border border-purple-500/40 bg-black/45 px-4 py-4 text-white outline-none placeholder:text-purple-100/45 focus:border-purple-400 focus:ring-2 focus:ring-purple-500/40"
            />

            <input
              type="password"
              required
              minLength={8}
              placeholder="Password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-xl border border-purple-500/40 bg-black/45 px-4 py-4 text-white outline-none placeholder:text-purple-100/45 focus:border-purple-400 focus:ring-2 focus:ring-purple-500/40"
            />

            {errorText ? (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {errorText}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isBusy}
              className="mt-4 w-full rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 text-base font-bold text-white shadow-lg shadow-purple-600/25 transition hover:from-blue-500 hover:to-fuchsia-600 disabled:opacity-60"
            >
              {isBusy
                ? "Please wait..."
                : isSignup
                  ? "Create account"
                  : "Continue to dashboard"}
            </button>
          </form>

          <div className="mt-7 flex items-center justify-between text-sm text-purple-100">
            <Link href="/forgot-password" className="hover:text-white">
              Forgot password?
            </Link>

            {isSignup ? (
              <Link href="/login" className="font-semibold hover:text-white">
                Already have an account? Log in
              </Link>
            ) : (
              <Link href="/signup" className="font-semibold hover:text-white">
                New here? Create account
              </Link>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
