"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { downloadOutput } from "@/lib/download/exportDocuments";

type OutlineHeading = {
  id: string;
  level: 1 | 2 | 3;
  text: string;
  enabled: boolean;
};

type OutlineDownloadFormat = "pdf" | "docx" | "txt";

interface EditableBlogOutlinePanelProps {
  output: string;
  inputs: Record<string, string>;
}

const HANDOFF_KEY = "abc_creator_blog_outline_handoff";
const OUTLINE_FILE_BASE_NAME = "blog-outline-selected-outline";
const OUTLINE_METADATA_HEADINGS = [
  "search intent",
  "reader promise",
  "intro angle",
  "introduction angle",
  "detailed h2/h3 structure",
  "detailed h2 h3 structure",
  "h2/h3 structure",
  "keyword placement notes",
  "keyword placement",
  "faq ideas",
  "conclusion angle",
  "verify before publishing",
  "recommended h1",
  "reader takeaway",
  "section purpose",
];

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

function normalizeHeadingKey(value: string) {
  return cleanHeadingText(value)
    .toLowerCase()
    .replace(/^\d+[.)]\s*/, "")
    .replace(/:$/g, "")
    .replace(/[–—-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isOutlineMetadataHeading(value: string) {
  const normalized = normalizeHeadingKey(value);
  return OUTLINE_METADATA_HEADINGS.some(
    (metadataHeading) =>
      normalized === metadataHeading || normalized.startsWith(`${metadataHeading}:`)
  );
}

function parseOutlineHeadings(markdown: string): OutlineHeading[] {
  const headings: OutlineHeading[] = [];

  markdown.split("\n").forEach((rawLine) => {
    const line = rawLine.trim();
    if (!line) return;

    const markdownHeading = /^(#{1,3})\s+(.+)$/.exec(line);
    if (markdownHeading) {
      const text = cleanHeadingText(markdownHeading[2]);
      if (text && !isOutlineMetadataHeading(text)) {
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
      if (text && !isOutlineMetadataHeading(text)) {
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
    .filter(
      (heading) =>
        heading.enabled && heading.text.trim() && !isOutlineMetadataHeading(heading.text)
    )
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
  const [isDownloading, setIsDownloading] = useState(false);
  const [message, setMessage] = useState("");
  const exportContentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setHeadings(parseOutlineHeadings(output));
    setCopied(false);
    setIsDownloading(false);
    setMessage("");
  }, [output]);

  const selectedHeadings = useMemo(
    () =>
      headings.filter(
        (heading) =>
          heading.enabled && heading.text.trim() && !isOutlineMetadataHeading(heading.text)
      ),
    [headings]
  );
  const selectedOutline = useMemo(() => outlineToMarkdown(headings), [headings]);
  const selectedCount = selectedHeadings.length;

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

  const submitPdfFormDownload = () => {
    const iframeName = `abc_outline_pdf_export_${Date.now()}`;
    const iframe = document.createElement("iframe");
    iframe.name = iframeName;
    iframe.style.display = "none";
    document.body.appendChild(iframe);

    const form = document.createElement("form");
    form.method = "POST";
    form.action = "/api/export/pdf";
    form.target = iframeName;
    form.style.display = "none";

    const outputField = document.createElement("textarea");
    outputField.name = "output";
    outputField.value = selectedOutline;
    form.appendChild(outputField);

    const fileNameField = document.createElement("input");
    fileNameField.type = "hidden";
    fileNameField.name = "fileBaseName";
    fileNameField.value = OUTLINE_FILE_BASE_NAME;
    form.appendChild(fileNameField);

    document.body.appendChild(form);
    form.submit();
    form.remove();

    window.setTimeout(() => iframe.remove(), 60000);
  };

  const downloadOutline = async (format: OutlineDownloadFormat) => {
    if (!selectedOutline.trim()) {
      setMessage("Select at least one article heading before downloading.");
      return;
    }

    if (isDownloading) return;

    setIsDownloading(true);
    setMessage("");

    try {
      if (format === "pdf") {
        submitPdfFormDownload();
        window.setTimeout(() => setIsDownloading(false), 1500);
        return;
      }

      await downloadOutput(
        format,
        selectedOutline,
        OUTLINE_FILE_BASE_NAME,
        exportContentRef.current
      );
      setMessage("Selected outline download started.");
      setIsDownloading(false);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? `Download failed: ${error.message}`
          : "Download failed. Please try again."
      );
      setIsDownloading(false);
    }
  };

  const copyOutline = async () => {
    if (!selectedOutline.trim()) {
      setMessage("Select at least one article heading before copying.");
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
      setMessage("Select at least one article heading before continuing.");
      return;
    }

    const title =
      selectedHeadings.find((heading) => heading.level === 1 && heading.text.trim())?.text ||
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
            Outline metadata labels are removed from the handoff.
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

      <div ref={exportContentRef} className="sr-only" aria-hidden="true">
        {selectedHeadings.map((heading) =>
          heading.level === 1 ? (
            <h1 key={heading.id}>{heading.text}</h1>
          ) : heading.level === 2 ? (
            <h2 key={heading.id}>{heading.text}</h2>
          ) : (
            <h3 key={heading.id}>{heading.text}</h3>
          )
        )}
      </div>

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
          <select
            aria-label="Download selected outline"
            defaultValue=""
            disabled={isDownloading}
            onChange={(event) => {
              const format = event.currentTarget.value as OutlineDownloadFormat | "";
              event.currentTarget.value = "";
              if (format) void downloadOutline(format);
            }}
            className="cursor-pointer rounded-full border border-purple-400/30 bg-purple-500/10 px-5 py-2.5 text-sm font-semibold text-purple-100 transition hover:bg-purple-500/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <option value="" className="bg-black text-white">
              {isDownloading ? "Preparing..." : "Download"}
            </option>
            <option value="pdf" className="bg-black text-white">
              PDF
            </option>
            <option value="docx" className="bg-black text-white">
              DOCX
            </option>
            <option value="txt" className="bg-black text-white">
              Text file
            </option>
          </select>
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
