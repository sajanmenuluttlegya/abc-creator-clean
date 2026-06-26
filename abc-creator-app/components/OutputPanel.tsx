"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface OutputPanelProps {
  isLoading: boolean;
  output: string;
}

export function OutputPanel({ isLoading, output }: OutputPanelProps) {
  const [copied, setCopied] = useState(false);
  const hasOutput = Boolean(output.trim());
  const isStreamingVisible = isLoading && hasOutput;

  const copyOutput = async () => {
    if (!output) return;

    await navigator.clipboard.writeText(output);
    setCopied(true);

    window.setTimeout(() => {
      setCopied(false);
    }, 5000);
  };

  return (
    <div className="rounded-3xl border border-purple-500/25 bg-black/45 p-8 shadow-2xl shadow-purple-950/25 backdrop-blur-2xl">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-white">Output</h2>

          {isStreamingVisible ? (
            <span className="rounded-full border border-emerald-400/25 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-200">
              Streaming live...
            </span>
          ) : isLoading ? (
            <span className="rounded-full border border-purple-400/25 bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-200">
              Connecting...
            </span>
          ) : null}
        </div>

        {output ? (
          <button
            type="button"
            onClick={copyOutput}
            className="rounded-full border border-purple-400/30 bg-purple-500/10 px-4 py-2 text-sm font-semibold text-purple-100 transition hover:bg-purple-500/20"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        ) : null}
      </div>

      {output ? (
        <div className="creator-output-scroll max-h-[72vh] overflow-y-auto overflow-x-hidden rounded-2xl border border-purple-500/15 bg-black/70 p-6 text-gray-200">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h1: ({ children }) => (
                <h1 className="mb-5 mt-2 text-3xl font-bold text-white">
                  {children}
                </h1>
              ),
              h2: ({ children }) => (
                <h2 className="mb-4 mt-8 text-2xl font-bold text-white">
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3 className="mb-3 mt-7 text-xl font-bold text-purple-100">
                  {children}
                </h3>
              ),
              p: ({ children }) => (
                <p className="mb-4 text-sm leading-7 text-gray-200">
                  {children}
                </p>
              ),
              strong: ({ children }) => (
                <strong className="font-bold text-white">{children}</strong>
              ),
              em: ({ children }) => (
                <em className="text-purple-100">{children}</em>
              ),
              ul: ({ children }) => (
                <ul className="mb-5 ml-5 list-disc space-y-2 text-sm leading-7 text-gray-200">
                  {children}
                </ul>
              ),
              ol: ({ children }) => (
                <ol className="mb-6 ml-5 list-decimal space-y-3 text-sm leading-7 text-gray-200">
                  {children}
                </ol>
              ),
              li: ({ children }) => (
                <li className="pl-1 marker:text-purple-300">{children}</li>
              ),
              a: ({ href, children }) => (
                <a
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  className="text-purple-300 underline decoration-purple-400/40 underline-offset-4 hover:text-purple-200"
                >
                  {children}
                </a>
              ),
              blockquote: ({ children }) => (
                <blockquote className="my-5 border-l-4 border-purple-400/50 bg-purple-500/10 px-5 py-3 text-purple-100">
                  {children}
                </blockquote>
              ),
              hr: () => (
                <hr className="mb-8 mt-8 border-0 border-t border-white/20" />
              ),
              code: ({ children }) => (
                <code className="rounded-md border border-purple-500/20 bg-purple-950/40 px-1.5 py-0.5 text-purple-100">
                  {children}
                </code>
              ),
              pre: ({ children }) => (
                <pre className="my-5 overflow-x-auto rounded-2xl border border-purple-500/20 bg-black/80 p-4 text-sm text-purple-100">
                  {children}
                </pre>
              ),
              table: ({ children }) => (
                <div className="my-5 overflow-x-auto rounded-2xl border border-purple-500/20">
                  <table className="w-full border-collapse text-sm">
                    {children}
                  </table>
                </div>
              ),
              th: ({ children }) => (
                <th className="border-b border-purple-500/20 bg-purple-500/10 px-4 py-3 text-left font-bold text-white">
                  {children}
                </th>
              ),
              td: ({ children }) => (
                <td className="border-b border-purple-500/10 px-4 py-3 text-gray-200">
                  {children}
                </td>
              ),
            }}
          >
            {output}
          </ReactMarkdown>

          {isStreamingVisible ? (
            <span className="mt-2 inline-block h-5 w-2 animate-pulse rounded-sm bg-purple-300 align-middle" />
          ) : null}
        </div>
      ) : isLoading ? (
        <div className="flex items-center gap-3 rounded-2xl border border-purple-500/20 bg-white/5 p-5 text-purple-200">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-purple-400 border-t-transparent" />
          <p>Connecting to AI stream... the first words will appear here live.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-purple-500/15 bg-black/70 p-6 text-gray-400">
          Your generated result will appear here. Text tools can be copied from this panel.
        </div>
      )}
    </div>
  );
}
