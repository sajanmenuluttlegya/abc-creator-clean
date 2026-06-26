"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { publicTools } from "@/lib/tools/public-tools";

interface ToolCategorySidebarProps {
  activeSlug?: string;
}

export function ToolCategorySidebar({ activeSlug }: ToolCategorySidebarProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(true);

  const categories = Array.from(new Set(publicTools.map((tool) => tool.category)));
  const activeToolSlug =
    activeSlug || pathname?.split("/tools/")[1]?.split("/")[0] || "";

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`fixed left-4 top-28 z-40 rounded-full border border-purple-400/25 bg-black/70 px-4 py-2 text-sm font-semibold text-purple-100 shadow-xl shadow-purple-950/30 backdrop-blur-xl transition hover:bg-purple-500/15 ${
          isOpen ? "pointer-events-none opacity-0" : "opacity-100"
        }`}
      >
        Categories
      </button>

      <aside
        className={`fixed bottom-4 left-4 top-24 z-40 w-[300px] overflow-hidden rounded-3xl border border-purple-500/25 bg-black/80 shadow-2xl shadow-purple-950/40 backdrop-blur-2xl transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-[330px]"
        }`}
        aria-label="Tool categories"
      >
        <div className="flex items-center justify-between border-b border-purple-500/15 px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-purple-300/80">
              Creator Tools
            </p>
            <h2 className="mt-1 text-lg font-bold text-white">Categories</h2>
          </div>

          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-semibold text-gray-200 transition hover:bg-white/10"
            aria-label="Close categories sidebar"
          >
            ✕
          </button>
        </div>

        <div className="creator-output-scroll h-[calc(100%-76px)] overflow-y-auto px-4 py-4">
          <div className="space-y-4">
            {categories.map((category) => {
              const tools = publicTools.filter((tool) => tool.category === category);

              return (
                <div
                  key={category}
                  className="rounded-2xl border border-purple-500/15 bg-white/[0.03] p-3"
                >
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <span className="text-sm font-bold text-white">{category}</span>
                    <span className="rounded-full border border-purple-400/20 bg-purple-500/10 px-2 py-0.5 text-[11px] font-semibold text-purple-200">
                      {tools.length}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {tools.map((tool) => {
                      const isActive = tool.slug === activeToolSlug;

                      return (
                        <Link
                          key={tool.slug}
                          href={`/tools/${tool.slug}`}
                          className={`group flex items-start gap-3 rounded-xl border px-3 py-3 text-left transition ${
                            isActive
                              ? "border-purple-400/45 bg-purple-500/20 text-white"
                              : "border-white/5 bg-black/25 text-gray-300 hover:border-purple-400/30 hover:bg-purple-500/10 hover:text-white"
                          }`}
                        >
                          <span className="text-xl leading-none">{tool.icon}</span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-semibold">
                              {tool.name}
                            </span>
                            <span className="mt-1 block text-xs text-gray-500 group-hover:text-gray-400">
                              {tool.displayCreditCost} credits
                            </span>
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </aside>
    </>
  );
}
