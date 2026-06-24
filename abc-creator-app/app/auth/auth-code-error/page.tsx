import Link from "next/link";

export default function AuthCodeErrorPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-6 text-white">
      <div className="max-w-md rounded-3xl border border-red-500/25 bg-red-500/10 p-8 text-center">
        <h1 className="mb-3 text-2xl font-bold">Authentication failed</h1>

        <p className="mb-6 text-red-100/80">
          The login link expired or could not be verified. Please try again.
        </p>

        <Link
          href="/login"
          className="inline-flex rounded-full bg-white px-5 py-3 font-semibold text-black"
        >
          Back to login
        </Link>
      </div>
    </main>
  );
}
