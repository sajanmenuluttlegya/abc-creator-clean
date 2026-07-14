"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ToolFormRenderer } from "@/components/ToolFormRenderer";
import { ThemeIcon } from "@/components/ThemeIcon";
import { ImageTextToImagePanel } from "@/components/ImageTextToImagePanel";
import { ImageUpscalePanel } from "@/components/ImageUpscalePanel";
import { ImageBackgroundRemoverPanel } from "@/components/ImageBackgroundRemoverPanel";
import { ImageCombinePanel } from "@/components/ImageCombinePanel";
import { AnimationCharacterSheetPanel } from "@/components/AnimationCharacterSheetPanel";
import { MangaSceneGeneratorPanel } from "@/components/MangaSceneGeneratorPanel";
import { ProfessionalHeadshotGeneratorPanel } from "@/components/ProfessionalHeadshotGeneratorPanel";
import { InteriorArchitectureImagePanel } from "@/components/InteriorArchitectureImagePanel";
import { FoodHospitalityImagePanel } from "@/components/FoodHospitalityImagePanel";
import { FashionApparelImagePanel } from "@/components/FashionApparelImagePanel";
import { MarketingCampaignImagePanel } from "@/components/MarketingCampaignImagePanel";
import { ResearchKnowledgeVisualPanel } from "@/components/ResearchKnowledgeVisualPanel";
import { ResearchKnowledgeTextPanel } from "@/components/ResearchKnowledgeTextPanel";
import { EducationLearningVisualPanel } from "@/components/EducationLearningVisualPanel";
import { EducationLearningTextPanel } from "@/components/EducationLearningTextPanel";
import { DataAnalysisBIVisualPanel } from "@/components/DataAnalysisBIVisualPanel";
import { DataAnalysisBITextPanel } from "@/components/DataAnalysisBITextPanel";
import { FinanceAccountingVisualPanel } from "@/components/FinanceAccountingVisualPanel";
import { FinanceAccountingTextPanel } from "@/components/FinanceAccountingTextPanel";
import { INTERIOR_ARCHITECTURE_IMAGE_TOOL_SLUGS } from "@/lib/tools/public-interior-architecture-tools";
import { FOOD_HOSPITALITY_IMAGE_TOOL_SLUGS } from "@/lib/tools/public-food-hospitality-tools";
import { FASHION_APPAREL_IMAGE_TOOL_SLUGS } from "@/lib/tools/public-fashion-apparel-tools";
import { MARKETING_CAMPAIGN_IMAGE_TOOL_SLUGS } from "@/lib/tools/public-marketing-campaign-tools";
import { RESEARCH_KNOWLEDGE_VISUAL_TOOL_SLUGS } from "@/lib/tools/research-knowledge-visual-config";
import { EDUCATION_LEARNING_VISUAL_TOOL_SLUGS } from "@/lib/tools/public-education-learning-tools";
import { DATA_ANALYSIS_BI_VISUAL_TOOL_SLUGS } from "@/lib/tools/public-data-analysis-bi-tools";
import { FINANCE_ACCOUNTING_VISUAL_TOOL_SLUGS } from "@/lib/tools/public-finance-accounting-tools";
import { getToolBySlug } from "@/lib/tools/public-tools";

export default function DynamicToolPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const tool = getToolBySlug(slug);

  if (!tool) {
    return (
      <main className="min-h-screen bg-black">
        <nav className="sticky top-0 z-50 border-b border-purple-500/10 bg-black/50 backdrop-blur-xl">
          <div className="mx-auto flex max-w-[1680px] items-center justify-between px-6 py-3">
            <Link href="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-90">
              <img src="/abc-logo.png" alt="Creator Logo" className="h-14 flex-shrink-0 object-contain" />
              <span className="text-2xl font-semibold text-white">Creator</span>
            </Link>
            <div className="flex gap-3">
              <Link href="/tools" className="px-6 py-2 text-sm text-gray-300 transition-colors hover:text-white">Tools</Link>
              <Link href="/pricing" className="rounded-full border border-emerald-400/30 px-4 py-2 text-sm font-medium text-emerald-200 transition-colors hover:bg-emerald-500/10">Pricing</Link>
              <Link href="/dashboard" className="rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-2 text-sm font-medium text-white transition-all duration-200 hover:from-indigo-700 hover:to-purple-700">Dashboard</Link>
            </div>
          </div>
        </nav>

        <section className="mx-auto max-w-7xl px-6 py-24 text-center">
          <h1 className="mb-4 text-3xl font-bold text-white">Tool not found</h1>
          <p className="mb-8 text-gray-400">This tool is not available.</p>
          <Link href="/tools" className="inline-block rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-3 font-medium text-white shadow-lg shadow-purple-500/20 transition-all duration-200 hover:from-indigo-700 hover:to-purple-700 hover:shadow-purple-500/40">Back to Tools</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black">
      <nav className="sticky top-0 z-50 border-b border-purple-500/10 bg-black/50 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1680px] items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-90">
            <img src="/abc-logo.png" alt="Creator Logo" className="h-14 flex-shrink-0 object-contain" />
            <span className="text-2xl font-semibold text-white">Creator</span>
          </Link>
          <div className="flex gap-3">
            <Link href="/tools" className="px-6 py-2 text-sm text-gray-300 transition-colors hover:text-white">Tools</Link>
            <Link href="/pricing" className="rounded-full border border-emerald-400/30 px-4 py-2 text-sm font-medium text-emerald-200 transition-colors hover:bg-emerald-500/10">Pricing</Link>
            <Link href="/dashboard" className="rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-2 text-sm font-medium text-white transition-all duration-200 hover:from-indigo-700 hover:to-purple-700">Dashboard</Link>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-[1500px] px-6 pt-8 pb-6">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Link href="/tools" className="transition-colors hover:text-gray-300">Tools</Link>
          <span>/</span>
          <span className="text-gray-200">{tool.name}</span>
        </div>
      </div>

      <section className="mx-auto max-w-[1500px] px-6 pb-12">
        <div className="mb-12">
          <div className="mb-6 flex items-center gap-6">
            <span className="text-5xl leading-none" aria-hidden="true">{tool.detailEmoji}</span>
            <div>
              <h1 className="mb-2 text-4xl font-bold text-white">{tool.name}</h1>
              <p className="text-gray-400">{tool.description}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/20 px-4 py-1 text-xs font-medium text-blue-300">
              <ThemeIcon name="bolt" size="xs" />
              Fast
            </span>
          </div>
        </div>

        {tool.slug === "text-to-image-generator" ? (
          <ImageTextToImagePanel />
        ) : tool.slug === "image-upscale" ? (
          <ImageUpscalePanel />
        ) : tool.slug === "background-remover" ? (
          <ImageBackgroundRemoverPanel />
        ) : tool.slug === "image-combine" ? (
          <ImageCombinePanel />
        ) : tool.slug === "2d-animated-character-generator" || tool.slug === "3d-animated-character-generator" ? (
          <AnimationCharacterSheetPanel toolSlug={tool.slug} />
        ) : tool.slug === "manga-scene-generator" ? (
          <MangaSceneGeneratorPanel />
        ) : tool.slug === "professional-headshot-generator" ? (
          <ProfessionalHeadshotGeneratorPanel />
        ) : INTERIOR_ARCHITECTURE_IMAGE_TOOL_SLUGS.includes(tool.slug as (typeof INTERIOR_ARCHITECTURE_IMAGE_TOOL_SLUGS)[number]) ? (
          <InteriorArchitectureImagePanel toolSlug={tool.slug} />
        ) : FOOD_HOSPITALITY_IMAGE_TOOL_SLUGS.includes(tool.slug as (typeof FOOD_HOSPITALITY_IMAGE_TOOL_SLUGS)[number]) ? (
          <FoodHospitalityImagePanel toolSlug={tool.slug} />
        ) : FASHION_APPAREL_IMAGE_TOOL_SLUGS.includes(tool.slug as (typeof FASHION_APPAREL_IMAGE_TOOL_SLUGS)[number]) ? (
          <FashionApparelImagePanel toolSlug={tool.slug} />
        ) : MARKETING_CAMPAIGN_IMAGE_TOOL_SLUGS.includes(tool.slug as (typeof MARKETING_CAMPAIGN_IMAGE_TOOL_SLUGS)[number]) ? (
          <MarketingCampaignImagePanel toolSlug={tool.slug} />
        ) : RESEARCH_KNOWLEDGE_VISUAL_TOOL_SLUGS.includes(tool.slug as (typeof RESEARCH_KNOWLEDGE_VISUAL_TOOL_SLUGS)[number]) ? (
          <ResearchKnowledgeVisualPanel tool={tool} />
        ) : tool.category === "Research / Knowledge Tools" ? (
          <ResearchKnowledgeTextPanel tool={tool} />
        ) : EDUCATION_LEARNING_VISUAL_TOOL_SLUGS.includes(tool.slug as (typeof EDUCATION_LEARNING_VISUAL_TOOL_SLUGS)[number]) ? (
          <EducationLearningVisualPanel tool={tool} />
        ) : tool.category === "Education / Learning Tools" ? (
          <EducationLearningTextPanel tool={tool} />
        ) : DATA_ANALYSIS_BI_VISUAL_TOOL_SLUGS.includes(tool.slug as (typeof DATA_ANALYSIS_BI_VISUAL_TOOL_SLUGS)[number]) ? (
          <DataAnalysisBIVisualPanel tool={tool} />
        ) : tool.category === "Data Analysis / Business Intelligence Tools" ? (
          <DataAnalysisBITextPanel tool={tool} />
        ) : FINANCE_ACCOUNTING_VISUAL_TOOL_SLUGS.includes(tool.slug as (typeof FINANCE_ACCOUNTING_VISUAL_TOOL_SLUGS)[number]) ? (
          <FinanceAccountingVisualPanel tool={tool} />
        ) : tool.category === "Finance / Accounting Tools" ? (
          <FinanceAccountingTextPanel tool={tool} />
        ) : (
          <ToolFormRenderer tool={tool} />
        )}
      </section>
    </main>
  );
}
