"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { publicTools } from "@/lib/tools/public-tools";
import { getToolCreditLabel } from "@/lib/tools/credit-costs";

interface ToolCategorySidebarProps {
  activeSlug?: string;
}

export function ToolCategorySidebar({ activeSlug }: ToolCategorySidebarProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(true);

  const activeToolSlug =
    activeSlug || pathname?.split("/tools/")[1]?.split("/")[0] || "";

  const categories = useMemo(
    () => Array.from(new Set(publicTools.map((tool) => tool.category))),
    []
  );

  const activeCategory =
    publicTools.find((tool) => tool.slug === activeToolSlug)?.category ||
    categories[0] ||
    "";

  const [openCategory, setOpenCategory] = useState(activeCategory);

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
        className={`fixed bottom-4 left-4 top-24 z-40 w-[280px] overflow-hidden rounded-3xl border border-purple-500/25 bg-black/80 shadow-2xl shadow-purple-950/40 backdrop-blur-2xl transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-[310px]"
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
          <div className="space-y-2">
            {categories.map((category) => {
              const tools = publicTools.filter((tool) => tool.category === category);
              const isCategoryOpen = openCategory === category;

              return (
                <div
                  key={category}
                  className="rounded-2xl border border-purple-500/15 bg-white/[0.03]"
                >
                  <button
                    type="button"
                    onClick={() =>
                      setOpenCategory((current) =>
                        current === category ? "" : category
                      )
                    }
                    className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
                  >
                    <span className="text-sm font-bold text-white">{category}</span>
                    <span className="flex items-center gap-2 text-xs font-semibold text-purple-200">
                      <span className="rounded-full border border-purple-400/20 bg-purple-500/10 px-2 py-0.5">
                        {tools.length}
                      </span>
                      <span className="text-purple-300">
                        {isCategoryOpen ? "−" : "+"}
                      </span>
                    </span>
                  </button>

                  {isCategoryOpen ? (
                    <div className="border-t border-purple-500/10 px-2 pb-2">
                      {tools.map((tool) => {
                        const isActive = tool.slug === activeToolSlug;

                        return (
                          <Link
                            key={tool.slug}
                            href={`/tools/${tool.slug}`}
                            className={`block rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                              isActive
                                ? "bg-purple-500/20 text-white"
                                : "text-gray-300 hover:bg-purple-500/10 hover:text-white"
                            }`}
                          >
                            <span className="block truncate">{tool.name}</span>
                            <span className="mt-0.5 block text-xs font-medium text-gray-500">
                              {getToolCreditLabel(tool.slug)}
                            </span>
                          </Link>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </aside>
    </>
  );
}
