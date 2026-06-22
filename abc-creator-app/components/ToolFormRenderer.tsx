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
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        toolSlug: tool.slug,
        inputs: formData,
      }),
    });

    const data = await res.json();

    if (!res.ok || !data.ok) {
      setOutput(`Error:\n${data.error || "Generation failed."}`);
      return;
    }

    setOutput(data.output || "No output returned.");
  } catch (error) {
    setOutput(
      `Error:\nCould not reach /api/generate.\n\n${
        error instanceof Error ? error.message : String(error)
      }`
    );
  } finally {
    setIsLoading(false);
  }
};

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Form Inputs */}
      <div className="rounded-2xl bg-white/5 border border-purple-500/20 p-8 backdrop-blur-sm space-y-6 hover:border-purple-500/40 transition-all duration-200">
        {tool.inputs.map((input) => (
          <div key={input.id} className="space-y-3">
            <label
              htmlFor={input.id}
              className="block text-sm font-semibold text-white"
            >
              {input.label}
              {input.required && <span className="text-pink-400 ml-1">*</span>}
            </label>

            {input.type === "textarea" ? (
              <textarea
                id={input.id}
                placeholder={input.placeholder}
                value={formData[input.id] || ""}
                onChange={handleInputChange}
                required={input.required}
                className="w-full px-4 py-3 bg-white/5 border border-purple-500/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none h-24 transition-all duration-200"
              />
            ) : input.type === "select" ? (
              <select
                id={input.id}
                value={formData[input.id] || ""}
                onChange={handleInputChange}
                required={input.required}
                className="w-full px-4 py-3 bg-white/5 border border-purple-500/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none cursor-pointer transition-all duration-200"
              >
                <option value="" className="bg-black text-white">Select an option</option>
                {input.options?.map((option) => (
                  <option key={option} value={option} className="bg-black text-white">
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
                className="w-full px-4 py-3 bg-white/5 border border-purple-500/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
              />
            )}
          </div>
        ))}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full mt-8 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-indigo-600/50 disabled:to-purple-600/50 text-white font-semibold rounded-full transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40"
        >
          {isLoading ? (
            <>
              <svg
                className="animate-spin h-4 w-4"
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
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Generating...
            </>
          ) : (
            <>
              ✨ Generate
            </>
          )}
        </button>
      </div>

      {/* Output Panel */}
      <OutputPanel isLoading={isLoading} output={output} />
    </form>
  );
}
