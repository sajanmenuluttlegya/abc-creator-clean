"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

function getAppUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    window.location.origin
  ).replace(/\/$/, "");
}

export function ResendVerificationForm() {
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get("email") ?? "";

  const supabase = createClient();

  const [email, setEmail] = useState(initialEmail);
  const [isBusy, setIsBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [errorText, setErrorText] = useState("");

  const resend = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setIsBusy(true);
    setMessage("");
    setErrorText("");

    const { error } = await supabase.auth.resend({
      type: "signup",
      email: email.trim().toLowerCase(),
      options: {
        emailRedirectTo: `${getAppUrl()}/auth/callback?next=/dashboard`,
      },
    });

    setIsBusy(false);

    if (error) {
      setErrorText(error.message);
      return;
    }

    setMessage("Verification email sent. Check your inbox and spam folder.");
  };

  return (
    <form onSubmit={resend} className="mt-6 space-y-4">
      <input
        type="email"
        required
        placeholder="Your email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        className="w-full rounded-xl border border-purple-500/40 bg-black/45 px-4 py-3 text-white outline-none placeholder:text-purple-100/45 focus:border-purple-400 focus:ring-2 focus:ring-purple-500/40"
      />

      {errorText ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {errorText}
        </div>
      ) : null}

      {message ? (
        <div className="rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-200">
          {message}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={isBusy}
        className="w-full rounded-full border border-purple-400/25 bg-white/[0.05] px-6 py-3 font-semibold text-white transition hover:bg-white/[0.08] disabled:opacity-60"
      >
        {isBusy ? "Sending..." : "Resend verification email"}
      </button>
    </form>
  );
}
