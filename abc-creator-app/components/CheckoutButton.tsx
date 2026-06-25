"use client";

import { useState } from "react";

type CheckoutButtonProps = {
  planId: string;
  billingInterval: "monthly" | "yearly";
  label: string;
};

export function CheckoutButton({
  planId,
  billingInterval,
  label,
}: CheckoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function startCheckout() {
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          planId,
          billingInterval,
        }),
      });

      const data = await res.json().catch(() => null);

      if (res.status === 401) {
        window.location.href = "/login?next=/pricing";
        return;
      }

      if (!res.ok || !data?.url) {
        setError(data?.error || "Could not start checkout.");
        return;
      }

      window.location.href = data.url;
    } catch {
      setError("Could not start checkout.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={startCheckout}
        disabled={isLoading}
        className="w-full rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-600/20 transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isLoading ? "Opening checkout..." : label}
      </button>

      {error && <p className="mt-3 text-xs text-red-300">{error}</p>}
    </div>
  );
}
