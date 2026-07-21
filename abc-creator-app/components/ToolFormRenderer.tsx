"use client";

import React, { useEffect, useMemo, useState } from "react";
import { OutputPanel } from "./OutputPanel";
import { EmailOutputEditorPanel } from "./EmailOutputEditorPanel";
import { PresetBlogOutputPanel } from "./PresetBlogOutputPanel";
import { ThemeIcon } from "./ThemeIcon";
import { EditableBlogOutlinePanel } from "./EditableBlogOutlinePanel";
import { ImageToInstagramCaptionPanel } from "./ImageToInstagramCaptionPanel";
import { SmoothSelect } from "./SmoothSelect";
import type { Tool, ToolInput } from "@/lib/tools/public-tools";
import { getToolCreditEstimate } from "@/lib/tools/credit-costs";

interface ToolFormRendererProps {
  tool: Tool;
}

const BLOG_OUTLINE_HANDOFF_KEY = "abc_creator_blog_outline_handoff";
const CALENDAR_CUSTOM_FREQUENCY_OPTION = "Custom frequency in context";
const IMAGE_CAPTION_TOOL = "image-to-instagram-caption";
const SOURCE_MODE_PASTE = "Paste text / transcript";
const SOURCE_MODE_YOUTUBE = "YouTube URL";
const SOURCE_MODE_UPLOAD = "Upload audio/video";
const SOURCE_MODE_TEXT_FILE = "Upload text file";
const SOURCE_MODE_DOCUMENT_FILE = "Upload document file";
const presetBlogEditorTools = new Set(["quick-1-click-blog-post", "human-style-blog-post", "seo-optimized-blog-post", "advanced-blog-post"]);
const transcriptSourceTools = new Set(["summarize-pro", "video-to-article-converter", "youtube-video-to-blog-post"]);
const textFileSourceTools = new Set(["bullet-point-summarizer", "meeting-notes-summarizer", "file-text-summarizer", "key-takeaways-generator"]);
const emailOutputEditorTools = new Set([
  "cold-email-personalizer",
  "blog-to-email",
  "subject-line-generator",
  "email-newsletter-generator",
  "follow-up-email-generator",
  "sales-email-generator",
  "welcome-email-generator",
  "product-launch-email-generator",
  "ai-email-generator",
  "email-campaign-writer",
]);
const defaultOutputImageTools = new Set([
  "blog-content",
  "pro-image-brief-for-blog",
  "human-style-blog-post",
  "seo-optimized-blog-post",
  "advanced-blog-post",
  "quick-1-click-blog-post",
  "comparison-blog-writer",
  "youtube-video-to-blog-post",
]);

const blogOutputVisualStyles = `
.blog-output-visual-upgrade figure figcaption[data-export-ignore="true"]{display:none!important;}
.blog-output-visual-upgrade figure:has(img[data-generated-blog-image="true"]){border-color:transparent!important;outline:0!important;box-shadow:none!important;}
.blog-output-visual-upgrade figure:has(img[data-generated-blog-image="true"]):hover{border-color:rgba(52,211,153,.22)!important;box-shadow:none!important;}
.blog-output-visual-upgrade [data-abc-image-block]{border-color:transparent!important;outline:0!important;box-shadow:none!important;}
.blog-output-visual-upgrade [data-abc-image-block]:hover{border-color:rgba(52,211,153,.22)!important;}
.hide-output-side-image-controls button[aria-label="Add image beside this output section"]{display:none!important;}
`;

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

function fileToText(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Could not read the selected text file."));
    reader.readAsText(file);
  });
}

function getFileExtension(file: File) {
  const name = file.name.toLowerCase();
  const index = name.lastIndexOf(".");
  return index >= 0 ? name.slice(index + 1) : "";
}

function isDocumentFile(file: File) {
  const extension = getFileExtension(file);
  return extension === "pdf" || extension === "docx" || file.type === "application/pdf" || file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
}

function isTextLikeFile(file: File) {
  const name = file.name.toLowerCase();
  const allowedExtensions = [".txt", ".md", ".markdown", ".csv", ".json", ".rtf", ".html", ".htm", ".xml", ".log"];
  return file.type.startsWith("text/") || file.type === "application/json" || file.type === "application/xml" || allowedExtensions.some((ext) => name.endsWith(ext));
}

function isReadableDocumentUpload(file: File) {
  return isTextLikeFile(file) || isDocumentFile(file);
}

function cleanVisualText(value: string, maxLength = 520) {
  const text = value.replace(/```[\s\S]*?```/g, " ").replace(/[#*_`>|\[\]()]/g, " ").replace(/\s+/g, " ").trim();
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
}

function hasExistingImageMarker(value: string) {
  return /(^|\n)#{1,4}\s+.*\bimage\b/i.test(value) || /(^|\n)\s*[-*]?\s*(image\s*)?prompt\s*[:\-–]/i.test(value);
}

function shouldUseDefaultOutputImage(toolSlug: string, inputs: Record<string, string>) {
  if (!defaultOutputImageTools.has(toolSlug)) return false;
  if (toolSlug === "blog-content") {
    const imageMode = (inputs.image_brief_mode || "").toLowerCase();
    return Boolean(imageMode) && !imageMode.includes("no images");
  }
  return true;
}

function withAutomaticBlogImage(output: string, toolSlug: string, inputs: Record<string, string>) {
  const trimmed = output.trim();
  if (!trimmed || !shouldUseDefaultOutputImage(toolSlug, inputs) || hasExistingImageMarker(trimmed)) return output;

  const topic = inputs.title || inputs.blog_title || inputs.topic || inputs.primary_keyword || inputs.keyword || inputs.comparison_topic || "this blog output";
  const context = cleanVisualText(trimmed, 620);
  const marker = [
    "### Image: Automatic Blog Visual",
    "",
    "Placement: Bottom below the most relevant nearby text.",
    "",
    `Prompt: Create one premium textless editorial image for ${topic}. Use this nearby context: ${context}. Keep it clean, modern, relevant to the section, smooth rounded-frame friendly, no readable text, no watermarks, no fake logos, and no UI screenshots unless the section clearly needs a product/interface visual.`,
    "",
    `Alt Text: Visual support for ${topic}.`,
  ].join("\n");

  const paragraphs = trimmed.split(/\n{2,}/);
  if (paragraphs.length <= 1) return `${trimmed}\n\n${marker}`;
  const insertAt = Math.min(Math.max(1, Math.floor(paragraphs.length / 3)), paragraphs.length - 1);
  return [...paragraphs.slice(0, insertAt), marker, ...paragraphs.slice(insertAt)].join("\n\n");
}

function transcriptPrimaryField(toolSlug: string) {
  return toolSlug === "youtube-video-to-blog-post" ? "source_content" : "topic_or_brief";
}

function transcriptSourceModeOf(inputs: Record<string, string>) {
  return inputs.source_mode || SOURCE_MODE_PASTE;
}

function isTranscriptPrimaryInput(toolSlug: string, input: ToolInput) {
  return transcriptSourceTools.has(toolSlug) && input.id === transcriptPrimaryField(toolSlug);
}

function textFileSourceModeOf(inputs: Record<string, string>) {
  return inputs.source_mode || SOURCE_MODE_PASTE;
}

function isDocumentSourceMode(value: string) {
  return value === SOURCE_MODE_TEXT_FILE || value === SOURCE_MODE_DOCUMENT_FILE;
}

export function ToolFormRenderer({ tool }: ToolFormRendererProps) {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [mediaFiles, setMediaFiles] = useState<Record<string, File | null>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [output, setOutput] = useState<string>("");
  const rawCreditEstimate = getToolCreditEstimate(tool.slug, formData);
  const creditEstimate = tool.slug === IMAGE_CAPTION_TOOL ? { credits: tool.displayCreditCost, isDynamic: false, label: `${tool.displayCreditCost} credits` } : rawCreditEstimate;
  const creditCost = creditEstimate.credits;
  const isErrorOutput = /^(error:|not enough credits)/i.test(output.trim());
  const showEditableOutline = tool.slug === "blog-outline" && Boolean(output.trim()) && !isLoading && !isErrorOutput;
  const usePresetEditor = presetBlogEditorTools.has(tool.slug);
  const useImageCaptionEditor = tool.slug === IMAGE_CAPTION_TOOL;
  const useEmailOutputEditor = emailOutputEditorTools.has(tool.slug);
  const allowOutputSideImages = defaultOutputImageTools.has(tool.slug);
  const blogOutput = useMemo(
    () => (allowOutputSideImages && !isLoading && !isErrorOutput ? withAutomaticBlogImage(output, tool.slug, formData) : output),
    [allowOutputSideImages, formData, isErrorOutput, isLoading, output, tool.slug]
  );
  const showCalendarCustomPostCount = tool.slug === "blog-content-calendar" && formData.posting_frequency === CALENDAR_CUSTOM_FREQUENCY_OPTION;

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

  const setInputValue = (id: string, value: string) => {
    setFormData((prev) => {
      if (tool.slug === "blog-content-calendar" && id === "posting_frequency" && value !== CALENDAR_CUSTOM_FREQUENCY_OPTION) {
        const { custom_post_count: _customPostCount, ...rest } = prev;
        return { ...rest, [id]: value };
      }
      if (textFileSourceTools.has(tool.slug) && id === "source_mode") {
        if (!isDocumentSourceMode(value)) {
          setMediaFiles((current) => ({ ...current, media_upload: null }));
          const { media_upload_name: _mediaUploadName, uploaded_text_file_name: _uploadedTextFileName, uploaded_file_type: _uploadedFileType, ...rest } = prev;
          return { ...rest, [id]: value };
        }
      }
      return { ...prev, [id]: value };
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setInputValue(id, value);
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

  const handleMediaInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, files } = e.target;
    const file = files?.[0] || null;
    const isTextFileTool = textFileSourceTools.has(tool.slug);
    if (!file) {
      setMediaFiles((prev) => ({ ...prev, [id]: null }));
      setFormData((prev) => ({ ...prev, [`${id}_name`]: "" }));
      return;
    }
    if (isTextFileTool) {
      if (!isReadableDocumentUpload(file)) {
        setOutput("Error:\nThis file type cannot be read yet. Please upload PDF, DOCX, TXT, MD, CSV, JSON, RTF, HTML, XML, or LOG, or paste the text manually.");
        return;
      }
      if (file.size > 8 * 1024 * 1024) {
        setOutput("Error:\nPlease choose a document under 8 MB, or paste the most relevant section manually.");
        return;
      }
      setMediaFiles((prev) => ({ ...prev, [id]: file }));
      setFormData((prev) => ({ ...prev, [`${id}_name`]: file.name }));
      setOutput("");
      return;
    }
    if (!file.type.startsWith("audio/") && !file.type.startsWith("video/")) {
      setOutput("Error:\nPlease choose an audio or video file.");
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setOutput("Error:\nPlease choose an audio/video file under 50 MB, or paste the transcript manually.");
      return;
    }
    setMediaFiles((prev) => ({ ...prev, [id]: file }));
    setFormData((prev) => ({ ...prev, [`${id}_name`]: file.name }));
    setOutput("");
  };

  const isInputRequired = (input: ToolInput) => {
    if (textFileSourceTools.has(tool.slug)) {
      const sourceMode = textFileSourceModeOf(formData);
      if (input.id === "source_content") return !isDocumentSourceMode(sourceMode);
      if (input.id === "media_upload") return isDocumentSourceMode(sourceMode);
      return input.required;
    }
    if (!transcriptSourceTools.has(tool.slug)) return input.required;
    const sourceMode = transcriptSourceModeOf(formData);
    if (isTranscriptPrimaryInput(tool.slug, input)) return input.required && sourceMode === SOURCE_MODE_PASTE;
    if (input.id === "source_url") return sourceMode === SOURCE_MODE_YOUTUBE;
    if (input.id === "media_upload") return sourceMode === SOURCE_MODE_UPLOAD;
    return input.required;
  };

  const buildTextFileInputsForGeneration = async () => {
    const sourceMode = textFileSourceModeOf(formData);
    if (!isDocumentSourceMode(sourceMode)) return formData;

    const file = mediaFiles.media_upload;
    if (!file) throw new Error("Upload a PDF, DOCX, or text file, or choose paste mode.");

    let fileText = "";
    let sourceType = isDocumentFile(file) ? `${getFileExtension(file).toUpperCase()} file` : "text file";

    if (isDocumentFile(file)) {
      setOutput(`Reading ${sourceType}...\n\nExtracting real text from ${file.name}.`);
      const payload = new FormData();
      payload.append("file", file, file.name);
      const res = await fetch("/api/file/extract", { method: "POST", body: payload });
      const data = await res.json().catch(() => null) as { ok?: boolean; text?: string; fileName?: string; sourceType?: string; error?: string } | null;
      if (!res.ok || !data?.text) throw new Error(data?.error || "Could not read this file.");
      fileText = data.text;
      sourceType = data.sourceType || sourceType;
    } else {
      const text = await fileToText(file);
      const cleaned = text.replace(/\u0000/g, "").trim();
      if (cleaned.length < 20) throw new Error("The uploaded text file does not contain enough readable text.");
      const maxChars = 58000;
      fileText = cleaned.length > maxChars ? `${cleaned.slice(0, maxChars)}\n\n[File was longer than ${maxChars} characters, so only the first part was used. Paste a smaller section for deeper analysis.]` : cleaned;
    }

    const nextInputs = {
      ...formData,
      source_content: [`Source mode: uploaded ${sourceType} (${file.name}).`, "Use only this extracted uploaded-file text as the factual source. Summarize the substance even when the document is unstructured or has no section headings.", "", fileText].join("\n"),
      uploaded_text_file_name: file.name,
      uploaded_file_type: sourceType,
    };
    setFormData((current) => ({ ...current, source_content: nextInputs.source_content, uploaded_text_file_name: file.name, uploaded_file_type: sourceType }));
    setOutput("");
    return nextInputs;
  };

  const buildInputsForGeneration = async () => {
    if (textFileSourceTools.has(tool.slug)) return buildTextFileInputsForGeneration();
    if (!transcriptSourceTools.has(tool.slug)) return formData;
    const sourceMode = transcriptSourceModeOf(formData);
    const primaryField = transcriptPrimaryField(tool.slug);
    if (sourceMode === SOURCE_MODE_PASTE) return formData;

    const payload = new FormData();
    payload.append("toolSlug", tool.slug);
    payload.append("sourceMode", sourceMode);

    if (sourceMode === SOURCE_MODE_YOUTUBE) {
      const youtubeUrl = (formData.source_url || "").trim();
      if (!youtubeUrl) throw new Error("Paste a YouTube URL or choose another source mode.");
      payload.append("youtubeUrl", youtubeUrl);
    }

    if (sourceMode === SOURCE_MODE_UPLOAD) {
      const file = mediaFiles.media_upload;
      if (!file) throw new Error("Upload an audio/video file or choose another source mode.");
      payload.append("media", file, file.name);
    }

    setOutput("Extracting transcript...\n\nTranscript extraction uses separate transcript credits. The final output will be based on transcript/source only.");
    const res = await fetch("/api/transcript/extract", { method: "POST", body: payload });
    const data = await res.json().catch(() => null) as { transcript?: string; error?: string; details?: string; requiredCredits?: number; currentCredits?: number } | null;

    if (!res.ok || !data?.transcript) {
      if (res.status === 402) throw new Error(`Not enough credits for transcript extraction. This needs ${data?.requiredCredits ?? "more"} transcript credits. You currently have ${data?.currentCredits ?? 0}.`);
      throw new Error(data?.error || "Transcript extraction failed.");
    }

    const transcriptSourceLabel = sourceMode === SOURCE_MODE_YOUTUBE ? "YouTube captions/transcript" : "uploaded audio/video transcript";
    const transcriptForPrompt = [`Source mode: ${transcriptSourceLabel}.`, "Use this transcript/source as the factual backbone. State that the output is based on the transcript/source when relevant. Do not claim to have watched the video.", "", "Transcript:", data.transcript].join("\n");
    const nextInputs = { ...formData, [primaryField]: transcriptForPrompt, transcript_source_mode: sourceMode };
    setFormData((current) => ({ ...current, [primaryField]: transcriptForPrompt, transcript_source_mode: sourceMode }));
    setOutput("");
    return nextInputs;
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
      const generationInputs = await buildInputsForGeneration();
      const res = await fetch("/api/generate/stream", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ toolSlug: tool.slug, inputs: generationInputs }) });
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
      setOutput(`Error:\n${error instanceof Error ? error.message : String(error)}`);
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
              {tool.inputs.map((input) => {
                const isTextFileUpload = textFileSourceTools.has(tool.slug) && input.id === "media_upload";
                return (
                  <div key={input.id} className="space-y-3">
                    <label htmlFor={input.id} className="block text-sm font-semibold text-white">
                      {input.label}{isInputRequired(input) && <span className="ml-1 text-pink-400">*</span>}
                    </label>
                    {input.type === "media" ? (
                      <div className="rounded-2xl border border-dashed border-cyan-300/25 bg-cyan-400/5 p-4">
                        <input id={input.id} type="file" accept={isTextFileUpload ? ".pdf,.docx,.txt,.md,.markdown,.csv,.json,.rtf,.html,.htm,.xml,.log,text/*,application/json,application/xml,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" : "audio/*,video/*"} onChange={handleMediaInput} required={isInputRequired(input) && !mediaFiles[input.id]} className="w-full cursor-pointer rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white file:mr-4 file:rounded-full file:border-0 file:bg-cyan-500/20 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-cyan-100" />
                        {mediaFiles[input.id] ? <p className="mt-3 text-xs text-cyan-100">{isTextFileUpload ? "File" : "Media"} ready: {mediaFiles[input.id]?.name}</p> : <p className="mt-3 text-xs text-slate-400">{isTextFileUpload ? "Upload PDF, DOCX, or a text-based file under 8 MB. Image-only PDFs need pasted OCR text." : "Audio/video is transcribed first and charged separately. Max 50 MB."}</p>}
                      </div>
                    ) : input.type === "image" ? (
                      <div className="rounded-2xl border border-dashed border-pink-300/25 bg-pink-400/5 p-4">
                        <input id={input.id} type="file" accept="image/*" onChange={handleFileInput} required={isInputRequired(input) && !formData[input.id]} className="w-full cursor-pointer rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white file:mr-4 file:rounded-full file:border-0 file:bg-pink-500/20 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-pink-100" />
                        {formData[input.id] ? <p className="mt-3 text-xs text-pink-100">Image ready: {formData.image_name || "uploaded image"}</p> : <p className="mt-3 text-xs text-slate-400">Choose a clear image under 4 MB when using image-analysis mode.</p>}
                      </div>
                    ) : input.type === "textarea" ? (
                      <textarea id={input.id} placeholder={input.placeholder} value={formData[input.id] || ""} onChange={handleInputChange} required={isInputRequired(input)} className="h-28 w-full resize-none rounded-xl border border-purple-500/20 bg-white/5 px-4 py-3 text-white placeholder-gray-500 transition-all duration-200 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-purple-500" />
                    ) : input.type === "select" ? (
                      <SmoothSelect id={input.id} value={formData[input.id] || ""} options={input.options || []} required={isInputRequired(input)} onChange={setInputValue} />
                    ) : (
                      <input id={input.id} type="text" placeholder={input.placeholder} value={formData[input.id] || ""} onChange={handleInputChange} required={isInputRequired(input)} className="w-full rounded-xl border border-purple-500/20 bg-white/5 px-4 py-3 text-white placeholder-gray-500 transition-all duration-200 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-purple-500" />
                    )}
                  </div>
                );
              })}
              {showCalendarCustomPostCount ? (
                <div className="space-y-3">
                  <label htmlFor="custom_post_count" className="block text-sm font-semibold text-white">How many posts? <span className="ml-1 text-pink-400">*</span><span className="ml-2 text-xs font-medium text-gray-400">1–19 only</span></label>
                  <input id="custom_post_count" type="number" min={1} max={19} step={1} placeholder="Enter a number under 20" value={formData.custom_post_count || ""} onChange={handleInputChange} required className="w-full rounded-xl border border-purple-500/20 bg-white/5 px-4 py-3 text-white placeholder-gray-500 transition-all duration-200 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-purple-500" />
                </div>
              ) : null}
            </div>
            <button type="submit" data-abc-generate-button="true" disabled={isLoading} className="abc-flow-generate-button mt-8 flex w-full items-center justify-center gap-2 rounded-full px-6 py-3 font-semibold text-white shadow-lg shadow-purple-500/20 transition-all duration-200 hover:shadow-purple-500/40 disabled:opacity-55">
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
            <li className="flex gap-4"><span className="min-w-6 font-semibold text-purple-400">4.</span><span>Copy or download the final output once it is ready.</span></li>
          </ol>
        </div>
      </div>
      <div className={`space-y-6 lg:sticky lg:top-28 ${allowOutputSideImages ? "blog-output-visual-upgrade" : "hide-output-side-image-controls"}`}>
        <style>{blogOutputVisualStyles}</style>
        {showEditableOutline ? (
          <EditableBlogOutlinePanel output={blogOutput} inputs={formData} />
        ) : useImageCaptionEditor ? (
          <ImageToInstagramCaptionPanel isLoading={isLoading} output={output} inputs={formData} />
        ) : usePresetEditor ? (
          <PresetBlogOutputPanel isLoading={isLoading} output={blogOutput} recommendedNextActions={tool.nextActions} downloadFileBaseName={`${tool.slug}-output`} toolSlug={tool.slug} inputs={formData} />
        ) : useEmailOutputEditor ? (
          <EmailOutputEditorPanel isLoading={isLoading} output={output} recommendedNextActions={tool.nextActions} downloadFileBaseName={`${tool.slug}-output`} />
        ) : (
          <OutputPanel isLoading={isLoading} output={blogOutput} recommendedNextActions={tool.nextActions} downloadFileBaseName={`${tool.slug}-output`} toolSlug={tool.slug} inputs={formData} />
        )}
      </div>
    </div>
  );
}
