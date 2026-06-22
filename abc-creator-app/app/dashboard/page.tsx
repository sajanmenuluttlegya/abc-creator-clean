"use client";

import Link from "next/link";
import { publicTools } from "@/lib/tools/public-tools";

export default function DashboardPage() {
  // Placeholder statistics
  const stats = [
    { label: "Total Generations", value: "0", icon: "✨" },
    { label: "Content Created", value: "0", icon: "📄" },
    { label: "Time Saved", value: "0h", icon: "⏱️" },
  ];

  return (
    <main className="min-h-screen bg-black">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-black/50 backdrop-blur-xl border-b border-purple-500/10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
            <img
              src="/abc-logo.png"
              alt="Creator Logo"
              className="h-14 object-contain flex-shrink-0"
            />
            <span className="text-2xl font-semibold text-white">Creator</span>
          </Link>
          <div className="flex gap-3">
            <Link
              href="/tools"
              className="px-6 py-2 text-gray-300 hover:text-white transition-colors text-sm"
            >
              Tools
            </Link>
            <Link
              href="/dashboard"
              className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-full transition-all duration-200 text-sm font-medium"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-gray-400">Welcome to your Creator dashboard</p>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {stats.map((stat, idx) => (
            <div
              key={idx}
              className="rounded-2xl bg-white/5 border border-purple-500/20 p-8 backdrop-blur-sm hover:border-purple-500/40 transition-all duration-200"
            >
              <div className="text-4xl mb-4">{stat.icon}</div>
              <div className="text-gray-400 text-sm mb-2">{stat.label}</div>
              <div className="text-3xl font-bold text-white">{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Recent Tools Section */}
        <div className="rounded-2xl bg-white/5 border border-purple-500/20 p-8 backdrop-blur-sm hover:border-purple-500/40 transition-all duration-200">
          <h2 className="text-2xl font-semibold text-white mb-8">Quick Access</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {publicTools.map((tool) => (
              <Link
                key={tool.id}
                href={`/tools/${tool.slug}`}
                className="group p-6 rounded-xl bg-white/5 border border-purple-500/20 hover:border-purple-500/50 hover:bg-white/10 transition-all duration-200"
              >
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">{tool.icon}</span>
                  <h3 className="font-semibold text-white group-hover:text-purple-300 transition-colors">
                    {tool.name}
                  </h3>
                </div>
                <p className="text-sm text-gray-400">{tool.description}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* Dev Note */}
        <div className="mt-8 p-6 bg-blue-500/10 border border-blue-500/30 rounded-xl text-blue-300 text-sm">
          ℹ️ Dashboard features are in development. Statistics and user data will be
          available once backend integration is complete.
        </div>
      </section>
    </main>
  );
}
