"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ToolCategorySidebar } from "@/components/ToolCategorySidebar";
import { ToolFormRenderer } from "@/components/ToolFormRenderer";
import { ThemeIcon } from "@/components/ThemeIcon";
import { getToolBySlug } from "@/lib/tools/public-tools";
import { useEffect, useState } from "react";

export default function DynamicToolPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const [tool, setTool] = useState(getToolBySlug(slug));

  useEffect(() => {
    if (slug) {
      const foundTool = getToolBySlug(slug);
      setTool(foundTool);
    }
  }, [slug]);

  if (!tool) {
    return (
      <main className="min-h-screen bg-black">
        <ToolCategorySidebar />

        <nav className="sticky top-0 z-50 bg-black/50 backdrop-blur-xl border-b border-purple-500/10">
          <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
              <img
                src="/abc-logo.png"
                alt="Creator Logo"
                className="h-14 object-contain flex-shrink-0"
              />
              <span className="text-2xl font-semibold text-white">Creator</span>
            </Link>
            <div className="flex gap-3">
              <Link href="/tools" className="px-6 py-2 text-gray-300 hover:text-white transition-colors text-sm">
                Tools
              </Link>
              <Link href="/pricing" className="px-4 py-2 rounded-full border border-emerald-400/30 text-emerald-200 hover:bg-emerald-500/10 transition-colors text-sm font-medium">
                Pricing
              </Link>
              <Link href="/dashboard" className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-full transition-all duration-200 text-sm font-medium">
                Dashboard
              </Link>
            </div>
          </div>
        </nav>

        <section className="max-w-7xl mx-auto px-6 py-24 text-center lg:pl-[330px] xl:pl-[340px]">
          <h1 className="text-3xl font-bold text-white mb-4">Tool not found</h1>
          <p className="text-gray-400 mb-8">This tool is not available.</p>
          <Link href="/tools" className="inline-block px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-full transition-all duration-200 font-medium shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40">
            Back to Tools
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black">
      <ToolCategorySidebar activeSlug={tool.slug} />

      <nav className="sticky top-0 z-50 bg-black/50 backdrop-blur-xl border-b border-purple-500/10">
        <div className="max-w-[1680px] mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
            <img
              src="/abc-logo.png"
              alt="Creator Logo"
              className="h-14 object-contain flex-shrink-0"
            />
            <span className="text-2xl font-semibold text-white">Creator</span>
          </Link>
          <div className="flex gap-3">
            <Link href="/tools" className="px-6 py-2 text-gray-300 hover:text-white transition-colors text-sm">
              Tools
            </Link>
            <Link href="/dashboard" className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-full transition-all duration-200 text-sm font-medium">
              Dashboard
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-[1680px] mx-auto px-6 pt-8 pb-6 lg:pl-[330px] xl:pl-[340px]">
        <div className="flex items-center gap-2 text-gray-400 text-sm">
          <Link href="/tools" className="hover:text-gray-300 transition-colors">
            Tools
          </Link>
          <span>/</span>
          <span className="text-gray-200">{tool.name}</span>
        </div>
      </div>

      <section className="max-w-[1680px] mx-auto px-6 pb-12 lg:pl-[330px] xl:pl-[340px]">
        <div className="mb-12">
          <div className="flex items-center gap-6 mb-6">
            <ThemeIcon name={tool.icon} size="xl" />
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">{tool.name}</h1>
              <p className="text-gray-400">{tool.description}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <span className="px-4 py-1 text-xs bg-purple-500/30 text-purple-300 rounded-full font-medium">
              {tool.category}
            </span>
            <span className="inline-flex items-center gap-1.5 px-4 py-1 text-xs bg-blue-500/20 text-blue-300 rounded-full font-medium">
              <ThemeIcon name="bolt" size="xs" className="h-5 w-5 rounded-full border-blue-300/20 bg-blue-500/10 shadow-none" />
              Fast
            </span>
          </div>
        </div>

        <ToolFormRenderer tool={tool} />
      </section>
    </main>
  );
}
