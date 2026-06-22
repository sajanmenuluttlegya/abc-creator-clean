"use client";

import React from "react";

interface OutputPanelProps {
  isLoading?: boolean;
  output?: string;
}

export function OutputPanel({ isLoading = false, output }: OutputPanelProps) {
  return (
    <div className="rounded-2xl bg-white/5 border border-purple-500/20 p-8 backdrop-blur-sm hover:border-purple-500/40 transition-all duration-200">
      <h3 className="text-lg font-semibold text-white mb-6">Output</h3>

      {isLoading ? (
        <div className="space-y-4 animate-pulse">
          <div className="h-4 bg-gradient-to-r from-purple-500/20 to-indigo-500/20 rounded-full w-3/4"></div>
          <div className="h-4 bg-gradient-to-r from-purple-500/20 to-indigo-500/20 rounded-full w-full"></div>
          <div className="h-4 bg-gradient-to-r from-purple-500/20 to-indigo-500/20 rounded-full w-5/6"></div>
        </div>
      ) : output ? (
        <div className="space-y-4">
          <div className="text-sm bg-amber-500/20 border border-amber-500/40 text-amber-300 px-4 py-3 rounded-lg">
            ⚠️ <span className="font-semibold">DEV PLACEHOLDER</span> — real AI not connected yet
          </div>
          <div className="text-gray-300 leading-relaxed text-sm whitespace-pre-wrap break-words font-light">
            {output}
          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          <p className="text-sm">Fill in the form and click "Generate" to see results</p>
        </div>
      )}
    </div>
  );
}
