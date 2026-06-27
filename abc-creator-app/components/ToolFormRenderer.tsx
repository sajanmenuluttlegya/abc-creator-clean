"use client";

import React, { useState } from "react";
import { OutputPanel } from "./OutputPanel";
import { ImageGenerationPanel } from "./ImageGenerationPanel";
import { ThemeIcon } from "./ThemeIcon";
import type { Tool } from "@/lib/tools/public-tools";
import {
  getToolCreditEstimate,
  supportsImageGeneration,
} from "@/lib/tools/credit-costs";

interface ToolFormRendererProps {
  tool: Tool;
}

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export function ToolFormRenderer({ tool }: ToolFormRendererProps) {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [output, setOutput] = useState<string>("");
  const creditEstimate = getToolCreditEstimate(tool.slug, formData);
  const creditCost = creditEstimate.credits;
  const canGenerateImages = supportsImageGeneration(tool.slug) && Boolean(output.trim()) && !isLoading;

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
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

            setOutput(
`Not enough credits

This request needs ${requiredCredits} credits.
You currently have ${currentCredits} credit${currentCredits === 1 ? "" : "s"}.

Get more credits: /pricing`
            );
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
        const chunk = decoder.decode(value, { stream: true });
        finalOutput = await revealChunk(finalOutput, chunk);
      }
    } catch (error) {
      setOutput(
        `Error:\nCould not reach /api/generate/stream.\n\n${
          error instanceof Error ? error.message : String(error)
        }`
      );
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
            <span className="inline-flex w-fit items-center rounded-full border border-emerald-400/25 bg-emerald-400/10 px-4 py-1.5 text-xs font-semibold text-emerald-200">
              {creditEstimate.label}
            </span>
          </div>

          <form onSubmit={handleSubmit} className="rounded-2xl border border-purple-500/20 bg-white/5 p-8 backdrop-blur-sm transition-all duration-200 hover:border-purple-500/40">
            <div className="space-y-6">
              {tool.inputs.map((input) => (
                <div key={input.id} className="space-y-3">
                  <label htmlFor={input.id} className="block text-sm font-semibold text-white">
                    {input.label}{input.required && <span className="ml-1 text-pink-400">*</span>}
                  </label>

                  {input.type === "textarea" ? (
                    <textarea
                      id={input.id}
                      placeholder={input.placeholder}
                      value={formData[input.id] || ""}
                      onChange={handleInputChange}
                      required={input.required}
                      className="h-28 w-full resize-none rounded-xl border border-purple-500/20 bg-white/5 px-4 py-3 text-white placeholder-gray-500 transition-all duration-200 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  ) : input.type === "select" ? (
                    <select
                      id={input.id}
                      value={formData[input.id] || ""}
                      onChange={handleInputChange}
                      required={input.required}
                      className="w-full cursor-pointer appearance-none rounded-xl border border-purple-500/20 bg-white/5 px-4 py-3 text-white transition-all duration-200 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="" className="bg-black text-white">Select an option</option>
                      {input.options?.map((option) => (
                        <option key={option} value={option} className="bg-black text-white">{option}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      id={input.id}
                      type="text"
                      placeholder={input.placeholder}
                      value={formData[input.id] || ""}
                      onChange={handleInputChange}
                      required={input.required}
                      className="w-full rounded-xl border border-purple-500/20 bg-white/5 px-4 py-3 text-white placeholder-gray-500 transition-all duration-200 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  )}
                </div>
              ))}
            </div>

            <button type="submit" disabled={isLoading} className="mt-8 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3 font-semibold text-white shadow-lg shadow-purple-500/20 transition-all duration-200 hover:from-indigo-700 hover:to-purple-700 hover:shadow-purple-500/40 disabled:from-indigo-600/50 disabled:to-purple-600/50">
              {isLoading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Generating...
                </>
              ) : (
                <>
                  <ThemeIcon name="spark" size="xs" />
                  Generate — {creditCost} credits
                </>
              )}
            </button>
          </form>
        </div>

        <div className="rounded-2xl border border-purple-500/20 bg-white/5 p-7 backdrop-blur-sm transition-all duration-200 hover:border-purple-500/40">
          <h3 className="mb-5 text-lg font-semibold text-white">How it works</h3>
          <ol className="space-y-4 text-sm leading-relaxed text-gray-400">
            <li className="flex gap-4"><span className="min-w-6 font-semibold text-purple-400">1.</span><span>Fill in the form with clear details.</span></li>
            <li className="flex gap-4"><span className="min-w-6 font-semibold text-purple-400">2.</span><span>Click Generate to reserve the shown credits and create content with AI.</span></li>
            <li className="flex gap-4"><span className="min-w-6 font-semibold text-purple-400">3.</span><span>Watch the result appear live on the right side.</span></li>
            <li className="flex gap-4"><span className="min-w-6 font-semibold text-purple-400">4.</span><span>Copy or download the current result when it is ready.</span></li>
          </ol>
        </div>

        <div className="rounded-2xl border border-blue-500/30 bg-blue-500/10 p-7 backdrop-blur-sm">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-blue-300">
            <ThemeIcon name="idea" size="xs" className="drop-shadow-[0_0_10px_rgba(251,191,36,0.55)]" />
            Pro Tips
          </h3>
          <ul className="space-y-3 text-sm leading-relaxed text-blue-200">
            <li>• Be specific in your inputs for better results.</li>
            <li>• Longer or more complex outputs can cost more credits.</li>
            <li>• Run another generation when testing a different angle.</li>
          </ul>
        </div>

        <div className="rounded-2xl border border-purple-500/20 bg-purple-500/10 p-7 backdrop-blur-sm">
          <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-purple-200">
            <ThemeIcon name="bolt" size="xs" />
            Live AI Generation
          </h3>
          <p className="text-sm leading-relaxed text-purple-100/80">Creator streams text output into this page. Review factual claims before publishing.</p>
        </div>
      </div>

      <div className="space-y-6 lg:sticky lg:top-28">
        <OutputPanel isLoading={isLoading} output={output} recommendedNextActions={tool.nextActions} downloadFileBaseName={`${tool.slug}-output`} />
        {canGenerateImages ? <ImageGenerationPanel toolSlug={tool.slug} inputs={formData} sourceText={output} /> : null}
      </div>
    </div>
  );
}
