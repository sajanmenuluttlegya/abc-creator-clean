import Link from "next/link";
import { Suspense } from "react";
import { ResendVerificationForm } from "@/components/ResendVerificationForm";

export default function VerifyEmailPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#4c1d95_0%,#16002d_34%,#030006_74%)] opacity-75" />

      <section className="relative z-10 mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center px-8 text-center">
        <img
          src="/abc-logo.png"
          alt="Creator"
          className="mb-8 h-24 w-auto object-contain"
        />

        <div className="rounded-3xl border border-purple-500/25 bg-black/55 p-8 shadow-2xl shadow-purple-950/30 backdrop-blur-xl">
          <h1 className="mb-4 text-3xl font-bold">Verify your email</h1>

          <p className="leading-7 text-purple-100/80">
            We sent you a verification link. Open it from your email to activate
            your account. You cannot enter the dashboard until verification is
            complete.
          </p>

          <Suspense fallback={null}>
            <ResendVerificationForm />
          </Suspense>

          <Link
            href="/login"
            className="mt-5 inline-flex rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-3 font-semibold text-white"
          >
            Back to login
          </Link>
        </div>
      </section>
    </main>
  );
}
