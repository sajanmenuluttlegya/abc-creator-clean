"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();
  const supabase = createClient();

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <button
      type="button"
      onClick={signOut}
      className="rounded-full border border-purple-400/30 bg-white/[0.04] px-5 py-2 text-sm font-semibold text-purple-100 transition hover:bg-white/[0.08]"
    >
      Sign out
    </button>
  );
}
