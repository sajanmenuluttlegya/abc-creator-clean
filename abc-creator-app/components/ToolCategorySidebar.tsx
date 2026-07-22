"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { ToolCategoryIcon } from "@/components/PlatformToolLogo";
import { ThemeIcon } from "@/components/ThemeIcon";
import { publicTools } from "@/lib/tools/public-tools";
import { getToolCreditLabel } from "@/lib/tools/credit-costs";

interface ToolCategorySidebarProps {
  activeSlug?: string;
}

function isMarketingCampaignCategory(category: string) {
  return category.toLowerCase().includes("marketing campaign");
}

export function ToolCategorySidebar({ activeSlug }: ToolCategorySidebarProps) {
  const pathname = usePathname();

  const activeToolSlug = activeSlug || pathname?.split("/tools/")[1]?.split("/")[0] || "";

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
    <aside
      className="fixed bottom-4 left-4 top-24 z-40 w-[280px] overflow-hidden rounded-3xl border border-purple-500/25 bg-black/80 shadow-2xl shadow-purple-950/40 backdrop-blur-2xl"
      aria-label="Tool categories"
    >
      <div className="border-b border-purple-500/15 px-5 py-4">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-purple-300/80">
          Creator Tools
        </p>
        <h2 className="mt-1 text-lg font-bold text-white">Categories</h2>
      </div>

      <div className="h-[calc(100%-72px)] overflow-hidden p-3">
        <div className="creator-output-scroll h-full overflow-y-auto rounded-[1.35rem] pr-2">
          <div className="space-y-2 pb-2">
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
                    <span className="flex min-w-0 items-center gap-2 text-sm font-bold text-white">
                      {isMarketingCampaignCategory(category) ? (
                        <ThemeIcon name="campaign" size="xs" />
                      ) : (
                        <ToolCategoryIcon category={category} size="xs" />
                      )}
                      <span className="truncate">{category}</span>
                    </span>
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
      </div>
    </aside>
  );
}
