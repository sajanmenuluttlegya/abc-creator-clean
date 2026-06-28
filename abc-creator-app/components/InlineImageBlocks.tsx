"use client";

import { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  IMAGE_CREDITS_PER_IMAGE,
  IMAGE_EDIT_CREDITS,
} from "@/lib/tools/credit-costs";

type GeneratedImageResult = {
  index: number;
  dataUrl: string;
  mimeType: string;
  provider: string;
  model: string;
  filename: string;
};

type ImageResponse = {
  ok?: boolean;
  error?: string;
  details?: string;
  code?: string;
  requiredCredits?: number;
  currentCredits?: number;
  provider?: string;
  model?: string;
  images?: GeneratedImageResult[];
};

export type OutputSegment =
  | { type: "markdown"; content: string; id: string }
  | { type: "image"; content: string; id: string; prompt: string };

function normalizeLine(value: string) {
  return value.replace(/[*_`#>-]/g, " ").replace(/\s+/g, " ").trim().toLowerCase();
}

function isImageBlockStart(line: string) {
  const normalized = normalizeLine(line);
  if (!normalized) return false;

  const hasImage = /\bimage\b/.test(normalized);
  const hasBriefOrPrompt = /\b(brief|prompt|hero|section|visual|placement)\b/.test(normalized);
  const hasNumberedImage = /^image\s*\d+\b/.test(normalized);
  const isHeading = /^#{1,4}\s+/.test(line.trim());

  return hasImage && (hasBriefOrPrompt || hasNumberedImage || isHeading);
}

function isMarkdownHeading(line: string) {
  return /^#{1,4}\s+/.test(line.trim());
}

function extractPrompt(block: string) {
  const promptLine = block
    .split("\n")
    .map((line) => line.trim())
    .find((line) => /^[-*]?\s*(image\s*)?prompt\s*[:\-–]/i.test(line));

  if (promptLine) {
    return promptLine.replace(/^[-*]?\s*(image\s*)?prompt\s*[:\-–]\s*/i, "").trim();
  }

  return block.replace(/^#{1,4}\s+/gm, "").trim();
}

export function splitOutputIntoImageSegments(output: string): OutputSegment[] {
  const lines = output.replace(/\r\n/g, "\n").split("\n");
  const segments: OutputSegment[] = [];
  let markdownLines: string[] = [];
  let imageLines: string[] | null = null;
  let segmentIndex = 0;

  const flushMarkdown = () => {
    const content = markdownLines.join("\n").trim();
    if (content) {
      segmentIndex += 1;
      segments.push({ type: "markdown", content, id: `markdown-${segmentIndex}` });
    }
    markdownLines = [];
  };

  const flushImage = () => {
    if (!imageLines) return;
    const content = imageLines.join("\n").trim();
    if (content) {
      segmentIndex += 1;
      segments.push({ type: "image", content, prompt: extractPrompt(content), id: `image-${segmentIndex}` });
    }
    imageLines = null;
  };

  lines.forEach((line) => {
    if (isImageBlockStart(line)) {
      flushImage();
      flushMarkdown();
      imageLines = [line];
      return;
    }

    if (imageLines) {
      if (isMarkdownHeading(line) && !isImageBlockStart(line)) {
        flushImage();
        markdownLines.push(line);
      } else {
        imageLines.push(line);
      }
      return;
    }

    markdownLines.push(line);
  });

  flushImage();
  flushMarkdown();

  return segments.length ? segments : [{ type: "markdown", content: output, id: "markdown-1" }];
}

function downloadImage(image: GeneratedImageResult) {
  const link = document.createElement("a");
  link.href = image.dataUrl;
  link.download = image.filename || `abc-creator-image-${image.index}.png`;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

interface InlineImageBlockProps {
  blockId: string;
  markdown: string;
  prompt: string;
  toolSlug?: string;
  inputs?: Record<string, string>;
}

export function InlineImageBlock({
  blockId,
  markdown,
  prompt,
  toolSlug = "",
  inputs = {},
}: InlineImageBlockProps) {
  const [image, setImage] = useState<GeneratedImageResult | null>(null);
  const [previousImage, setPreviousImage] = useState<GeneratedImageResult | null>(null);
  const [editPrompt, setEditPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState("");
  const aspectRatio = inputs.image_ratio || "16:9 landscape";
  const imagePrompt = useMemo(() => prompt.trim() || markdown.trim(), [prompt, markdown]);

  const callImageRoute = async (operation: "generate" | "edit") => {
    const editing = operation === "edit";
    if (!toolSlug) {
      setError("Image generation is not available for this output.");
      return;
    }

    if (editing && !editPrompt.trim()) {
      setError("Add an edit instruction before editing this image.");
      return;
    }

    if (editing) setIsEditing(true);
    else setIsGenerating(true);
    setError("");

    try {
      const response = await fetch("/api/generate/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operation,
          toolSlug,
          inputs,
          sourceText: markdown,
          prompt: editing
            ? `${imagePrompt}\n\nEdit instruction: ${editPrompt.trim()}`
            : imagePrompt,
          aspectRatio,
          imageCount: 1,
          sourceImageDataUrl: image?.dataUrl || "",
          imageBlockId: blockId,
        }),
      });

      const data = (await response.json()) as ImageResponse;

      if (!response.ok || !data.ok) {
        if (response.status === 402 || data.code === "INSUFFICIENT_CREDITS") {
          setError(
            `Not enough credits. This request needs ${data.requiredCredits ?? (editing ? IMAGE_EDIT_CREDITS : IMAGE_CREDITS_PER_IMAGE)} credits. You currently have ${data.currentCredits ?? 0} credits.`
          );
        } else {
          setError(`${data.error || "Image generation failed."}${data.details ? `\n${data.details}` : ""}`);
        }
        return;
      }

      const nextImage = data.images?.[0] || null;
      if (!nextImage) {
        setError("Image generation finished but no image was returned.");
        return;
      }

      if (editing && image) setPreviousImage(image);
      setImage(nextImage);
      if (editing) setEditPrompt("");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsGenerating(false);
      setIsEditing(false);
    }
  };

  const undoEdit = () => {
    if (!previousImage) return;
    setImage(previousImage);
    setPreviousImage(null);
    setError("");
  };

  return (
    <section className="my-6 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-5" data-abc-image-block={blockId}>
      <div className="prose prose-invert max-w-none prose-p:text-gray-200 prose-strong:text-white prose-headings:text-white">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
      </div>

      <div data-export-ignore="true" className="mt-4 flex flex-col gap-3 rounded-2xl border border-emerald-300/20 bg-black/35 p-4">
        {error ? (
          <div className="whitespace-pre-wrap rounded-xl border border-red-400/25 bg-red-500/10 p-3 text-sm text-red-100">
            {error}
          </div>
        ) : null}

        <button
          type="button"
          onClick={() => void callImageRoute("generate")}
          disabled={isGenerating || isEditing}
          className="rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition hover:from-emerald-600 hover:to-teal-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isGenerating ? "Generating image..." : `Generate Image — ${IMAGE_CREDITS_PER_IMAGE} credits`}
        </button>

        {image ? (
          <div className="space-y-3">
            <textarea
              value={editPrompt}
              onChange={(event) => setEditPrompt(event.currentTarget.value)}
              placeholder="Optional: describe what to change in this image."
              className="h-20 w-full resize-none rounded-xl border border-emerald-400/20 bg-black/40 px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void callImageRoute("edit")}
                disabled={isGenerating || isEditing || !editPrompt.trim()}
                className="rounded-full border border-emerald-300/30 bg-emerald-400/10 px-4 py-2 text-xs font-semibold text-emerald-100 transition hover:bg-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isEditing ? "Editing..." : `Edit Image — ${IMAGE_EDIT_CREDITS} credits`}
              </button>
              <button
                type="button"
                onClick={undoEdit}
                disabled={!previousImage || isGenerating || isEditing}
                className="rounded-full border border-purple-300/30 bg-purple-400/10 px-4 py-2 text-xs font-semibold text-purple-100 transition hover:bg-purple-400/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Undo
              </button>
              <button
                type="button"
                onClick={() => downloadImage(image)}
                className="rounded-full border border-blue-300/30 bg-blue-400/10 px-4 py-2 text-xs font-semibold text-blue-100 transition hover:bg-blue-400/20"
              >
                Download Image
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {image ? (
        <figure className="mt-5 overflow-hidden rounded-2xl border border-emerald-400/20 bg-black/40">
          <img
            src={image.dataUrl}
            alt={extractPrompt(markdown) || "Generated blog image"}
            className="w-full object-cover"
            data-generated-blog-image="true"
          />
        </figure>
      ) : null}
    </section>
  );
}
