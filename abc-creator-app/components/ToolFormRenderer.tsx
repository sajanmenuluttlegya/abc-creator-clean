"use client";

import React, { useEffect, useState } from "react";
import { OutputPanel } from "./OutputPanel";
import { PresetBlogOutputPanel } from "./PresetBlogOutputPanel";
import { ThemeIcon } from "./ThemeIcon";
import { EditableBlogOutlinePanel } from "./EditableBlogOutlinePanel";
import { ImageToInstagramCaptionPanel } from "./ImageToInstagramCaptionPanel";
import { PremiumEditableTextOutputPanel } from "./PremiumEditableTextOutputPanel";
import type { Tool } from "@/lib/tools/public-tools";
import { getToolCreditEstimate } from "@/lib/tools/credit-costs";

interface ToolFormRendererProps {
  tool: Tool;
}

const BLOG_OUTLINE_HANDOFF_KEY = "abc_creator_blog_outline_handoff";
const CALENDAR_CUSTOM_FREQUENCY_OPTION = "Custom frequency in context";
const IMAGE_CAPTION_TOOL = "image-to-instagram-caption";
const premiumSocialBioTools = new Set(["instagram-page-name-bio-generator", "social-media-bio-generator"]);
const presetBlogEditorTools = new Set(["quick-1-click-blog-post", "human-style-blog-post", "seo-optimized-blog-post", "advanced-blog-post"]);

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Could not read the selected file."));
    reader.readAsDataURL(file);
  });
}

function socialPanelCopy(toolSlug: string) {
  if (toolSlug === "instagram-page-name-bio-generator") {
    return {
      title: "Instagram profile names and bios you can edit",
      subtitle: "Drag from the left handle, edit names or bios, delete weak options, and copy only the strongest profile package.",
      emptyState: "Generate Instagram page names and bios. The premium editable profile studio will appear here with drag handles, edit controls, copy, and download.",
    };
  }

  return {
    title: "Platform-ready social bios you can edit",
    subtitle: "Reorder, rewrite, delete, or add bio options before copying the final profile text.",
    emptyState: "Generate social media bio options. The premium editable bio studio will appear here with drag handles, edit controls, copy, and download.",
  };
}

export function ToolFormRenderer({ tool }: ToolFormRendererProps) {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [output, setOutput] = useState<string>("");
  const rawCreditEstimate = getToolCreditEstimate(tool.slug, formData);
  const creditEstimate = tool.slug === IMAGE_CAPTION_TOOL ? { credits: tool.displayCreditCost, isDynamic: false, label: `${tool.displayCreditCost} credits` } : rawCreditEstimate;
  const creditCost = creditEstimate.credits;
  const isErrorOutput = /^(error:|not enough credits)/i.test(output.trim());
  const showEditableOutline = tool.slug === "blog-outline" && Boolean(output.trim()) && !isLoading && !isErrorOutput;
  const usePresetEditor = presetBlogEditorTools.has(tool.slug);
  const useImageCaptionEditor = tool.slug === IMAGE_CAPTION_TOOL;
  const usePremiumSocialBioEditor = premiumSocialBioTools.has(tool.slug);
  const showCalendarCustomPostCount = tool.slug === "blog-content-calendar" && formData.posting_frequency === CALENDAR_CUSTOM_FREQUENCY_OPTION;
  const socialPanel = socialPanelCopy(tool.slug);

  useEffect(() => {
    if (tool.slug !== "blog-content") return;

    const timer = window.setTimeout(() => {
      try {
        const stored = window.sessionStorage.getItem(BLOG_OUTLINE_HANDOFF_KEY);
        if (!stored) return;
        const handoff = JSON.parse(stored) as { outline?: string; title?: string; keywords?: string };
        setFormData((current) => ({
          ...current,
          ...(handoff.outline && !current.outline ? { outline: handoff.outline } : {}),
          ...(handoff.title && !current.title ? { title: handoff.title } : {}),
          ...(handoff.keywords && !current.keywords ? { keywords: handoff.keywords } : {}),
        }));
        window.sessionStorage.removeItem(BLOG_OUTLINE_HANDOFF_KEY);
      } catch {
        window.sessionStorage.removeItem(BLOG_OUTLINE_HANDOFF_KEY);
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, [tool.slug]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => {
      if (tool.slug === "blog-content-calendar" && id === "posting_frequency" && value !== CALENDAR_CUSTOM_FREQUENCY_OPTION) {
        const { custom_post_count: _customPostCount, ...rest } = prev;
        return { ...rest, [id]: value };
      }
      return { ...prev, [id]: value };
    });
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, files } = e.target;
    const file = files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/") || file.size > 4 * 1024 * 1024) {
      setOutput("Error:\nPlease choose an image file under 4 MB.");
      return;
    }

    try {
      const dataUrl = await fileToDataUrl(file);
      setFormData((prev) => ({ ...prev, [id]: dataUrl, image_name: file.name }));
      setOutput("");
    } catch (error) {
      setOutput(`Error:\n${error instanceof Error ? error.message : "Could not read image."}`);
    }
  };

  const revealChunk = async (currentOutput: string, chunk: string) => {
    if (!chunk) return currentOutput;
    let nextOutput = currentOutput;
    const stepSize = chunk.length > 800 ? 28 : chunk.length > 240 ? 18 : 10;
    for (let index = 0; index < chunk.length; index += stepSize) {
      nextOutput += chunk.slice(index, index + stepSize);
      setOutput(nextOutput);
      await wait(12);
    }
    return nextOutput;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setOutput("");

    try {
      const res = await fetch("/api/generate/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toolSlug: tool.slug, inputs: formData }),
      });

      if (!res.ok) {
        const text = await res.text();
        try {
          const data = JSON.parse(text);
          if (res.status === 402 || data.code === "INSUFFICIENT_CREDITS") {
            const requiredCredits = Number(data.requiredCredits ?? creditCost);
            const currentCredits = Number(data.currentCredits ?? 0);
            setOutput(`Not enough credits\n\nThis request needs ${requiredCredits} credits.\nYou currently have ${currentCredits} credit${currentCredits === 1 ? "" : "s"}.\n\nGet more credits: /pricing`);
            return;
          }
          setOutput(`Error:\n${data.error || "Generation failed."}\n\n${data.details || ""}`);
        } catch {
          setOutput(`Error:\n${text || "Generation failed."}`);
        }
        return;
      }

      if (!res.body) {
        setOutput("Error:\nStreaming response body was empty.");
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let finalOutput = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        finalOutput = await revealChunk(finalOutput, decoder.decode(value, { stream: true }));
      }
    } catch (error) {
      setOutput(`Error:\nCould not reach the generation endpoint.\n\n${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(280px,0.68fr)_minmax(0,1.32fr)] xl:grid-cols-[minmax(300px,0.58fr)_minmax(0,1.42fr)] lg:items-start">
      <div className="space-y-6">
        <div>
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl font-semibold text-white">Create Your Content</h2>
            <span className="inline-flex w-fit items-center rounded-full border border-emerald-400/25 bg-emerald-400/10 px-4 py-1.5 text-xs font-semibold text-emerald-200">{creditEstimate.label}</span>
          </div>

          <form onSubmit={handleSubmit} className="rounded-2xl border border-purple-500/20 bg-white/5 p-8 backdrop-blur-sm transition-all duration-200 hover:border-purple-500/40">
            <div className="space-y-6">
              {tool.inputs.map((input) => (
                <div key={input.id} className="space-y-3">
                  <label htmlFor={input.id} className="block text-sm font-semibold text-white">
                    {input.label}{input.required && <span className="ml-1 text-pink-400">*</span>}
                  </label>

                  {input.type === "image" ? (
                    <div className="rounded-2xl border border-dashed border-pink-300/25 bg-pink-400/5 p-4">
                      <input id={input.id} type="file" accept="image/*" onChange={handleFileInput} required={input.required && !formData[input.id]} className="w-full cursor-pointer rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white file:mr-4 file:rounded-full file:border-0 file:bg-pink-500/20 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-pink-100" />
                      {formData[input.id] ? <p className="mt-3 text-xs text-pink-100">Image ready: {formData.image_name || "uploaded image"}</p> : <p className="mt-3 text-xs text-slate-400">Choose a clear image under 4 MB when using image-analysis mode.</p>}
                    </div>
                  ) : input.type === "textarea" ? (
                    <textarea id={input.id} placeholder={input.placeholder} value={formData[input.id] || ""} onChange={handleInputChange} required={input.required} className="h-28 w-full resize-none rounded-xl border border-purple-500/20 bg-white/5 px-4 py-3 text-white placeholder-gray-500 transition-all duration-200 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-purple-500" />
                  ) : input.type === "select" ? (
                    <select id={input.id} value={formData[input.id] || ""} onChange={handleInputChange} required={input.required} className="w-full cursor-pointer appearance-none rounded-xl border border-purple-500/20 bg-white/5 px-4 py-3 text-white transition-all duration-200 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-purple-500">
                      <option value="" className="bg-black text-white">Select an option</option>
                      {input.options?.map((option) => <option key={option} value={option} className="bg-black text-white">{option}</option>)}
                    </select>
                  ) : (
                    <input id={input.id} type="text" placeholder={input.placeholder} value={formData[input.id] || ""} onChange={handleInputChange} required={input.required} className="w-full rounded-xl border border-purple-500/20 bg-white/5 px-4 py-3 text-white placeholder-gray-500 transition-all duration-200 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-purple-500" />
                  )}
                </div>
              ))}

              {showCalendarCustomPostCount ? (
                <div className="space-y-3">
                  <label htmlFor="custom_post_count" className="block text-sm font-semibold text-white">How many posts? <span className="ml-1 text-pink-400">*</span><span className="ml-2 text-xs font-medium text-gray-400">1–19 only</span></label>
                  <input id="custom_post_count" type="number" min={1} max={19} step={1} placeholder="Enter a number under 20" value={formData.custom_post_count || ""} onChange={handleInputChange} required className="w-full rounded-xl border border-purple-500/20 bg-white/5 px-4 py-3 text-white placeholder-gray-500 transition-all duration-200 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-purple-500" />
                </div>
              ) : null}
            </div>

            <button type="submit" disabled={isLoading} className="mt-8 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3 font-semibold text-white shadow-lg shadow-purple-500/20 transition-all duration-200 hover:from-indigo-700 hover:to-purple-700 hover:shadow-purple-500/40 disabled:from-indigo-600/50 disabled:to-purple-600/50">
              {isLoading ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />Generating...</> : <><ThemeIcon name="spark" size="xs" />Generate — {creditCost} credits</>}
            </button>
          </form>
        </div>

        <div className="rounded-2xl border border-purple-500/20 bg-white/5 p-7 backdrop-blur-sm transition-all duration-200 hover:border-purple-500/40">
          <h3 className="mb-5 text-lg font-semibold text-white">How it works</h3>
          <ol className="space-y-4 text-sm leading-relaxed text-gray-400">
            <li className="flex gap-4"><span className="min-w-6 font-semibold text-purple-400">1.</span><span>Fill in the form with clear details.</span></li>
            <li className="flex gap-4"><span className="min-w-6 font-semibold text-purple-400">2.</span><span>Click Generate to reserve the shown credits and create content with AI.</span></li>
            <li className="flex gap-4"><span className="min-w-6 font-semibold text-purple-400">3.</span><span>Watch the result appear live on the right side.</span></li>
            <li className="flex gap-4"><span className="min-w-6 font-semibold text-purple-400">4.</span><span>Copy, download, or continue with the current result when it is ready.</span></li>
          </ol>
        </div>
      </div>

      <div className="space-y-6 lg:sticky lg:top-28">
        {showEditableOutline ? (
          <EditableBlogOutlinePanel output={output} inputs={formData} />
        ) : useImageCaptionEditor ? (
          <ImageToInstagramCaptionPanel isLoading={isLoading} output={output} inputs={formData} />
        ) : usePremiumSocialBioEditor ? (
          <PremiumEditableTextOutputPanel isLoading={isLoading} output={output} title={socialPanel.title} subtitle={socialPanel.subtitle} emptyState={socialPanel.emptyState} downloadFileBaseName={`${tool.slug}-output`} />
        ) : usePresetEditor ? (
          <PresetBlogOutputPanel isLoading={isLoading} output={output} recommendedNextActions={tool.nextActions} downloadFileBaseName={`${tool.slug}-output`} toolSlug={tool.slug} inputs={formData} />
        ) : (
          <OutputPanel isLoading={isLoading} output={output} recommendedNextActions={tool.nextActions} downloadFileBaseName={`${tool.slug}-output`} toolSlug={tool.slug} inputs={formData} />
        )}
      </div>
    </div>
  );
}
