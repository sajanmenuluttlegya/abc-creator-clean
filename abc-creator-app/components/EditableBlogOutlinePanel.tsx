"use client";

import { useEffect, useMemo, useState } from "react";

type OutlineHeading = {
  id: string;
  level: 1 | 2 | 3;
  text: string;
  enabled: boolean;
};

interface EditableBlogOutlinePanelProps {
  output: string;
  inputs: Record<string, string>;
}

const HANDOFF_KEY = "abc_creator_blog_outline_handoff";

function makeId() {
  return `heading-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function cleanHeadingText(value: string) {
  return value
    .replace(/#+\s*$/g, "")
    .replace(/^\*+|\*+$/g, "")
    .replace(/^`+|`+$/g, "")
    .replace(/^(recommended\s+)?h[1-3]\s*[:\-–]\s*/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function parseOutlineHeadings(markdown: string): OutlineHeading[] {
  const headings: OutlineHeading[] = [];

  markdown.split("\n").forEach((rawLine) => {
    const line = rawLine.trim();
    if (!line) return;

    const markdownHeading = /^(#{1,3})\s+(.+)$/.exec(line);
    if (markdownHeading) {
      const text = cleanHeadingText(markdownHeading[2]);
      if (text) {
        headings.push({
          id: makeId(),
          level: Math.min(markdownHeading[1].length, 3) as 1 | 2 | 3,
          text,
          enabled: true,
        });
      }
      return;
    }

    const labeledHeading = /^(?:[-*]\s*)?(H[1-3])\s*[:\-–]\s*(.+)$/i.exec(line);
    if (labeledHeading) {
      const text = cleanHeadingText(labeledHeading[2]);
      if (text) {
        headings.push({
          id: makeId(),
          level: Number(labeledHeading[1].slice(1)) as 1 | 2 | 3,
          text,
          enabled: true,
        });
      }
    }
  });

  if (headings.length) return headings;

  const fallbackTitle = cleanHeadingText(markdown.split("\n").find((line) => line.trim()) || "Generated Blog Outline");
  return [{ id: makeId(), level: 1, text: fallbackTitle, enabled: true }];
}

function outlineToMarkdown(headings: OutlineHeading[]) {
  return headings
    .filter((heading) => heading.enabled && heading.text.trim())
    .map((heading) => `${"#".repeat(heading.level)} ${heading.text.trim()}`)
    .join("\n\n");
}

function fallbackCopy(text: string) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  textarea.remove();
  if (!copied) throw new Error("Clipboard copy failed.");
}

export function EditableBlogOutlinePanel({ output, inputs }: EditableBlogOutlinePanelProps) {
  const [headings, setHeadings] = useState<OutlineHeading[]>([]);
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setHeadings(parseOutlineHeadings(output));
    setCopied(false);
    setMessage("");
  }, [output]);

  const selectedOutline = useMemo(() => outlineToMarkdown(headings), [headings]);
  const selectedCount = headings.filter((heading) => heading.enabled && heading.text.trim()).length;

  const updateHeading = (id: string, text: string) => {
    setHeadings((current) =>
      current.map((heading) => (heading.id === id ? { ...heading, text } : heading))
    );
  };

  const toggleHeading = (id: string) => {
    setHeadings((current) =>
      current.map((heading) =>
        heading.id === id ? { ...heading, enabled: !heading.enabled } : heading
      )
    );
  };

  const deleteHeading = (id: string) => {
    setHeadings((current) => current.filter((heading) => heading.id !== id));
  };

  const addHeading = (level: 2 | 3, afterIndex?: number) => {
    const newHeading: OutlineHeading = {
      id: makeId(),
      level,
      text: level === 2 ? "New H2 section" : "New H3 supporting point",
      enabled: true,
    };

    setHeadings((current) => {
      if (typeof afterIndex !== "number") return [...current, newHeading];
      const next = [...current];
      next.splice(afterIndex + 1, 0, newHeading);
      return next;
    });
  };

  const moveHeading = (index: number, direction: -1 | 1) => {
    setHeadings((current) => {
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= current.length) return current;
      const next = [...current];
      const [item] = next.splice(index, 1);
      next.splice(targetIndex, 0, item);
      return next;
    });
  };

  const copyOutline = async () => {
    if (!selectedOutline.trim()) {
      setMessage("Select at least one heading before copying.");
      return;
    }

    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(selectedOutline);
      else fallbackCopy(selectedOutline);
      setCopied(true);
      setMessage("Selected outline copied.");
      window.setTimeout(() => setCopied(false), 4000);
    } catch {
      try {
        fallbackCopy(selectedOutline);
        setCopied(true);
        setMessage("Selected outline copied.");
        window.setTimeout(() => setCopied(false), 4000);
      } catch {
        setMessage("Copy failed. Please select the headings manually and copy them.");
      }
    }
  };

  const continueToBlogContent = () => {
    if (!selectedOutline.trim()) {
      setMessage("Select at least one heading before continuing.");
      return;
    }

    const title =
      headings.find((heading) => heading.enabled && heading.level === 1 && heading.text.trim())?.text ||
      inputs.blog_title ||
      "";

    window.sessionStorage.setItem(
      HANDOFF_KEY,
      JSON.stringify({
        outline: selectedOutline,
        title,
        keywords: inputs.target_keyword || "",
        createdAt: Date.now(),
      })
    );
    window.location.href = "/tools/blog-content";
  };

  return (
    <div className="rounded-3xl border border-purple-500/25 bg-black/45 p-8 shadow-2xl shadow-purple-950/25 backdrop-blur-2xl">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-purple-300">
            Editable outline
          </p>
          <h2 className="mt-2 text-2xl font-bold text-white">Select and refine headings</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-400">
            Edit, add, delete, reorder, or uncheck headings before sending this outline to Blog Content.
            This handoff uses temporary browser session storage only.
          </p>
        </div>

        <span className="inline-flex w-fit rounded-full border border-emerald-400/25 bg-emerald-400/10 px-4 py-1.5 text-xs font-semibold text-emerald-200">
          {selectedCount} selected
        </span>
      </div>

      {message ? (
        <div className="mb-5 rounded-2xl border border-purple-400/25 bg-purple-500/10 px-4 py-3 text-sm text-purple-100">
          {message}
        </div>
      ) : null}

      <div className="space-y-3">
        {headings.map((heading, index) => (
          <div
            key={heading.id}
            className="rounded-2xl border border-purple-500/15 bg-black/55 p-4 transition hover:border-purple-400/35"
          >
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={heading.enabled}
                  onChange={() => toggleHeading(heading.id)}
                  className="h-5 w-5 accent-indigo-500"
                  aria-label={`Select ${heading.text}`}
                />
                <span className="rounded-md bg-purple-500/10 px-2 py-1 text-xs font-bold text-purple-100">
                  H{heading.level}
                </span>
              </label>

              <input
                value={heading.text}
                onChange={(event) => updateHeading(heading.id, event.currentTarget.value)}
                className="min-w-0 flex-1 rounded-xl border border-purple-500/20 bg-white/5 px-4 py-3 text-sm font-semibold text-white placeholder-gray-500 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-purple-500"
              />

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => moveHeading(index, -1)}
                  disabled={index === 0}
                  className="rounded-full border border-purple-400/25 px-3 py-2 text-xs font-semibold text-purple-100 transition hover:bg-purple-500/15 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Up
                </button>
                <button
                  type="button"
                  onClick={() => moveHeading(index, 1)}
                  disabled={index === headings.length - 1}
                  className="rounded-full border border-purple-400/25 px-3 py-2 text-xs font-semibold text-purple-100 transition hover:bg-purple-500/15 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Down
                </button>
                <button
                  type="button"
                  onClick={() => addHeading(3, index)}
                  className="rounded-full border border-blue-400/25 px-3 py-2 text-xs font-semibold text-blue-100 transition hover:bg-blue-500/15"
                >
                  + H3
                </button>
                <button
                  type="button"
                  onClick={() => deleteHeading(heading.id)}
                  className="rounded-full border border-red-400/25 px-3 py-2 text-xs font-semibold text-red-100 transition hover:bg-red-500/15"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={() => addHeading(2)}
          className="rounded-full border border-purple-400/30 bg-purple-500/10 px-5 py-2.5 text-sm font-semibold text-purple-100 transition hover:bg-purple-500/20"
        >
          + Add H2 Section
        </button>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={copyOutline}
            className="rounded-full border border-purple-400/30 bg-purple-500/10 px-5 py-2.5 text-sm font-semibold text-purple-100 transition hover:bg-purple-500/20"
          >
            {copied ? "Copied!" : "Copy Selected Outline"}
          </button>
          <button
            type="button"
            onClick={continueToBlogContent}
            className="rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-purple-500/20 transition hover:from-indigo-700 hover:to-purple-700"
          >
            Continue to Blog Content
          </button>
        </div>
      </div>
    </div>
  );
}
