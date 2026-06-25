"use client";

import { useState } from "react";

export function BillingPortalButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function openBillingPortal() {
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/billing/portal", {
        method: "POST",
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.url) {
        setError(data?.error || "Could not open billing portal.");
        return;
      }

      window.location.href = data.url;
    } catch {
      setError("Could not open billing portal.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={openBillingPortal}
        disabled={isLoading}
        className="rounded-full border border-purple-400/30 px-4 py-2 text-sm font-semibold text-purple-100 transition hover:border-purple-300 hover:bg-purple-500/10 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isLoading ? "Opening..." : "Manage billing"}
      </button>

      {error && <p className="mt-3 text-xs text-red-300">{error}</p>}
    </div>
  );
}
