"use client";

import React, { useState } from "react";
import { OutputPanel } from "./OutputPanel";
import type { Tool } from "@/lib/tools/public-tools";

interface ToolFormRendererProps {
  tool: Tool;
}

export function ToolFormRenderer({ tool }: ToolFormRendererProps) {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [output, setOutput] = useState<string>("");
  const creditCost = tool.displayCreditCost;

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setOutput("");

    try {
      const res = await fetch("/api/generate/stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          toolSlug: tool.slug,
          inputs: formData,
        }),
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

This tool needs ${requiredCredits} credits per generation.
You currently have ${currentCredits} credit${currentCredits === 1 ? "" : "s"}.

Get more credits: /pricing`
            );
            return;
          }

          setOutput(
            `Error:\n${data.error || "Generation failed."}\n\n${
              data.details || ""
            }`
          );
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

        if (done) {
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        finalOutput += chunk;
        setOutput(finalOutput);
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
    <div className="grid gap-8 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:items-start">
      <div className="space-y-6">
        <div>
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl font-semibold text-white">
              Create Your Content
            </h2>
            <span className="inline-flex w-fit items-center rounded-full border border-emerald-400/25 bg-emerald-400/10 px-4 py-1.5 text-xs font-semibold text-emerald-200">
              {creditCost} credits per generation
            </span>
          </div>

          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-purple-500/20 bg-white/5 p-8 backdrop-blur-sm transition-all duration-200 hover:border-purple-500/40"
          >
            <div className="space-y-6">
              {tool.inputs.map((input) => (
                <div key={input.id} className="space-y-3">
                  <label
                    htmlFor={input.id}
                    className="block text-sm font-semibold text-white"
                  >
                    {input.label}
                    {input.required && (
                      <span className="ml-1 text-pink-400">*</span>
                    )}
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
                      <option value="" className="bg-black text-white">
                        Select an option
                      </option>
                      {input.options?.map((option) => (
                        <option
                          key={option}
                          value={option}
                          className="bg-black text-white"
                        >
                          {option}
                        </option>
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

            <button
              type="submit"
              disabled={isLoading}
              className="mt-8 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3 font-semibold text-white shadow-lg shadow-purple-500/20 transition-all duration-200 hover:from-indigo-700 hover:to-purple-700 hover:shadow-purple-500/40 disabled:from-indigo-600/50 disabled:to-purple-600/50"
            >
              {isLoading ? (
                <>
                  <svg
                    className="h-4 w-4 animate-spin"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Generating...
                </>
              ) : (
                <>✨ Generate — {creditCost} credits</>
              )}
            </button>
          </form>
        </div>

        <div className="rounded-2xl border border-purple-500/20 bg-white/5 p-7 backdrop-blur-sm transition-all duration-200 hover:border-purple-500/40">
          <h3 className="mb-5 text-lg font-semibold text-white">
            How it works
          </h3>
          <ol className="space-y-4 text-sm leading-relaxed text-gray-400">
            <li className="flex gap-4">
              <span className="min-w-6 font-semibold text-purple-400">1.</span>
              <span>Fill in the form with clear details.</span>
            </li>
            <li className="flex gap-4">
              <span className="min-w-6 font-semibold text-purple-400">2.</span>
              <span>Click Generate to spend {creditCost} credits and create content with AI.</span>
            </li>
            <li className="flex gap-4">
              <span className="min-w-6 font-semibold text-purple-400">3.</span>
              <span>Watch the result appear live on the right side.</span>
            </li>
            <li className="flex gap-4">
              <span className="min-w-6 font-semibold text-purple-400">4.</span>
              <span>Copy the current result when it is ready.</span>
            </li>
          </ol>
        </div>

        <div className="rounded-2xl border border-blue-500/30 bg-blue-500/10 p-7 backdrop-blur-sm">
          <h3 className="mb-4 text-lg font-semibold text-blue-300">
            💡 Pro Tips
          </h3>
          <ul className="space-y-3 text-sm leading-relaxed text-blue-200">
            <li>• Be specific in your inputs for better results.</li>
            <li>• Try different tones to find what works best.</li>
            <li>• Run another generation when testing a different angle.</li>
          </ul>
        </div>

        <div className="rounded-2xl border border-purple-500/20 bg-purple-500/10 p-7 backdrop-blur-sm">
          <h3 className="mb-3 text-lg font-semibold text-purple-200">
            ⚡ Live AI Generation
          </h3>
          <p className="text-sm leading-relaxed text-purple-100/80">
            Creator streams text output into this page. Review factual claims before publishing.
          </p>
        </div>
      </div>

      <div className="lg:sticky lg:top-28">
        <OutputPanel isLoading={isLoading} output={output} />
      </div>
    </div>
  );
}
