import Link from "next/link";
import { HeroVideoBackground } from "@/components/HeroVideoBackground";

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-black/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link
            href="/"
            className="flex items-center gap-3 transition-opacity hover:opacity-90"
          >
            <img
              src="/abc-logo.png"
              alt="Creator Logo"
              className="h-20 w-auto flex-shrink-0 object-contain"
            />
            <span className="creator-wordmark inline-block -translate-y-[2px] text-[32px] text-white">
              Creator
            </span>
          </Link>

          <div className="flex items-center gap-4">
            <Link
              href="/tools"
              className="rounded-full px-6 py-2 text-sm font-medium text-gray-300 transition-colors hover:text-white"
            >
              Tools
            </Link>
            <Link
              href="/dashboard"
              className="rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-500/20 transition-all duration-200 hover:from-indigo-500 hover:to-purple-500 hover:shadow-purple-500/40"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-[calc(100vh-96px)] overflow-hidden bg-black">
        <HeroVideoBackground />

        <div className="relative z-10 mx-auto flex max-w-7xl flex-col items-center px-6 py-32 text-center">
          <div className="mb-16 space-y-8">
            <h1 className="text-6xl font-bold leading-tight text-white md:text-7xl">
              AI Content
              <br />
              <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Made Effortless
              </span>
            </h1>

            <p className="creator-subheadline mx-auto max-w-3xl text-xl leading-relaxed text-gray-300">
              Generate compelling content in seconds with our AI-powered tools.
              From ideas to copy, we&apos;ve got your creative workflow covered.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="mb-20 flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              href="/tools"
              className="inline-block rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-4 font-semibold text-white shadow-lg shadow-purple-500/25 transition-all duration-200 hover:from-indigo-500 hover:to-purple-500 hover:shadow-purple-500/45"
            >
              Explore Tools →
            </Link>

            <Link
              href="/dashboard"
              className="inline-block rounded-full border border-purple-500/30 bg-black/35 px-8 py-4 font-semibold text-gray-200 backdrop-blur-sm transition-all duration-200 hover:border-purple-500/60 hover:bg-white/10"
            >
              View Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="relative z-20 -mt-10 bg-transparent px-6 pb-28 md:-mt-20">
        <div className="mx-auto grid max-w-7xl gap-6 md:grid-cols-3">
          {[
            {
              icon: "⚡",
              title: "Lightning Fast",
              description: "Generate content in seconds",
            },
            {
              icon: "🎯",
              title: "AI-Powered",
              description: "Advanced workflows for better results",
            },
            {
              icon: "🔒",
              title: "Secure & Private",
              description: "Your creative data stays protected",
            },
          ].map((feature, idx) => (
            <div
              key={idx}
              className="rounded-[2rem] border border-purple-400/25 bg-black/45 p-8 shadow-2xl shadow-purple-950/30 backdrop-blur-2xl transition-all duration-300 hover:-translate-y-1 hover:border-purple-400/45 hover:bg-black/55 hover:shadow-purple-700/20"
            >
              <div className="mb-4 text-5xl">{feature.icon}</div>
              <h3 className="mb-2 text-lg font-semibold text-white">
                {feature.title}
              </h3>
              <p className="text-sm text-gray-300">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-purple-500/10 bg-black py-8 text-center text-sm text-gray-500">
        <p>Creator © 2024. All rights reserved.</p>
      </footer>
    </main>
  );
}
