import Link from "next/link";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/SignOutButton";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  if (!user.email_confirmed_at) {
    redirect("/verify-email");
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <nav className="sticky top-0 z-50 border-b border-purple-500/10 bg-black/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            <img src="/abc-logo.png" alt="Creator" className="h-12 w-auto" />
            <span className="text-xl font-semibold">Creator</span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/tools"
              className="rounded-full px-5 py-2 text-sm text-gray-300 transition hover:text-white"
            >
              Tools
            </Link>
            <SignOutButton />
          </div>
        </div>
      </nav>

      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="rounded-3xl border border-purple-500/20 bg-white/[0.04] p-8 shadow-2xl shadow-purple-950/25">
          <p className="mb-2 text-sm text-purple-200">Signed in as</p>
          <h1 className="mb-6 text-3xl font-bold">{user.email}</h1>

          <div className="grid gap-5 md:grid-cols-3">
            <div className="rounded-2xl border border-purple-500/20 bg-black/40 p-6">
              <p className="text-sm text-gray-400">Current plan</p>
              <h2 className="mt-2 text-2xl font-bold">Free</h2>
              <p className="mt-2 text-sm text-gray-400">
                Credits system comes next.
              </p>
            </div>

            <div className="rounded-2xl border border-purple-500/20 bg-black/40 p-6">
              <p className="text-sm text-gray-400">Free credits</p>
              <h2 className="mt-2 text-2xl font-bold">10 lifetime</h2>
              <p className="mt-2 text-sm text-gray-400">
                Final ledger will be server-side only.
              </p>
            </div>

            <div className="rounded-2xl border border-purple-500/20 bg-black/40 p-6">
              <p className="text-sm text-gray-400">Status</p>
              <h2 className="mt-2 text-2xl font-bold text-green-300">
                Verified
              </h2>
              <p className="mt-2 text-sm text-gray-400">
                Email verified. Dashboard unlocked.
              </p>
            </div>
          </div>

          <Link
            href="/tools"
            className="mt-8 inline-flex rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-3 font-semibold text-white shadow-lg shadow-purple-600/20"
          >
            Open tools
          </Link>
        </div>
      </section>
    </main>
  );
}
