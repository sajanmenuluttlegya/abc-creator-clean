"use client";

import Link from "next/link";
import { publicTools } from "@/lib/tools/public-tools";

export default function ToolsPage() {
  // Group tools by category
  const categories = [...new Set(publicTools.map((tool) => tool.category))];
  const toolsByCategory: Record<string, typeof publicTools> = {};

  categories.forEach((cat) => {
    toolsByCategory[cat] = publicTools.filter((tool) => tool.category === cat);
  });

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
          <h1 className="text-4xl font-bold text-white mb-2">AI Tools Library</h1>
          <p className="text-gray-400">
            Choose from our collection of AI-powered content generation tools
          </p>
        </div>

        {/* Tools by Category */}
        {Object.entries(toolsByCategory).map(([category, tools]) => (
          <div key={category} className="mb-12">
            <h2 className="text-2xl font-semibold text-white mb-8 flex items-center gap-2">
              <span className="text-2xl">📂</span>
              {category}
            </h2>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tools.map((tool) => (
                <Link
                  key={tool.id}
                  href={`/tools/${tool.slug}`}
                  className="group rounded-2xl bg-white/5 border border-purple-500/20 hover:border-purple-500/50 p-8 backdrop-blur-sm transition-all duration-200 hover:bg-white/10 hover:shadow-lg hover:shadow-purple-500/10"
                >
                  <div className="flex items-start justify-between mb-4">
                    <span className="text-5xl">{tool.icon}</span>
                    <span className="px-3 py-1 text-xs bg-purple-500/30 text-purple-200 rounded-full font-medium">
                      {category}
                    </span>
                  </div>

                  <h3 className="text-lg font-semibold text-white group-hover:text-purple-300 transition-colors mb-3">
                    {tool.name}
                  </h3>

                  <p className="text-gray-400 text-sm mb-4 line-clamp-2 leading-relaxed">
                    {tool.description}
                  </p>

                  <div className="flex items-center text-purple-400 group-hover:text-purple-300 transition-colors text-sm font-medium">
                    Get Started →
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}

        {/* Coming Soon Section */}
        <div className="mt-16 p-8 rounded-2xl bg-white/5 border border-purple-500/20 text-center">
          <p className="text-gray-300 mb-6 text-lg">
            More tools coming soon! Stay tuned for updates.
          </p>
          <Link
            href="/"
            className="inline-block px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-full transition-all duration-200 font-medium shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40"
          >
            Back to Home
          </Link>
        </div>
      </section>
    </main>
  );
}
