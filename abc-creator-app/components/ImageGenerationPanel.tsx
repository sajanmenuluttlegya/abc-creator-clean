"use client";

import { useMemo, useState } from "react";
import {
  calculateImageGenerationCredits,
  IMAGE_CREDITS_PER_IMAGE,
} from "@/lib/tools/credit-costs";

type GeneratedImageResult = {
  index: number;
  dataUrl: string;
  mimeType: string;
  provider: string;
  model: string;
  filename: string;
};

type ImageGenerationPanelProps = {
  toolSlug: string;
  inputs: Record<string, string>;
  sourceText: string;
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
  imageCount?: number;
  creditsCharged?: number;
  images?: GeneratedImageResult[];
};

const imageCountOptions = [1, 3, 5, 7];
const aspectRatioOptions = [
  "16:9 landscape",
  "4:3 landscape",
  "3:2 editorial",
  "1:1 square",
  "9:16 vertical",
];

function downloadImage(image: GeneratedImageResult) {
  const link = document.createElement("a");
  link.href = image.dataUrl;
  link.download = image.filename || `abc-creator-image-${image.index}.png`;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

export function ImageGenerationPanel({
  toolSlug,
  inputs,
  sourceText,
}: ImageGenerationPanelProps) {
  const [prompt, setPrompt] = useState("");
  const [imageCount, setImageCount] = useState(1);
  const [aspectRatio, setAspectRatio] = useState("16:9 landscape");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");
  const [images, setImages] = useState<GeneratedImageResult[]>([]);
  const [lastProvider, setLastProvider] = useState("");
  const credits = useMemo(
    () => calculateImageGenerationCredits(imageCount),
    [imageCount]
  );
  const canGenerate = Boolean(sourceText.trim() || prompt.trim());

  const handleGenerateImages = async () => {
    setIsGenerating(true);
    setError("");

    try {
      const response = await fetch("/api/generate/image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          toolSlug,
          inputs,
          sourceText,
          prompt,
          aspectRatio,
          imageCount,
        }),
      });

      const data = (await response.json()) as ImageResponse;

      if (!response.ok || !data.ok) {
        if (response.status === 402 || data.code === "INSUFFICIENT_CREDITS") {
          setError(
            `Not enough credits. This image request needs ${
              data.requiredCredits ?? credits
            } credits. You currently have ${data.currentCredits ?? 0} credits.`
          );
        } else {
          setError(`${data.error || "Image generation failed."}${data.details ? `\n${data.details}` : ""}`);
        }
        return;
      }

      setImages(data.images || []);
      setLastProvider(
        data.provider && data.model
          ? `${data.provider} / ${data.model}`
          : data.provider || ""
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="mt-6 rounded-3xl border border-emerald-400/20 bg-emerald-500/10 p-6 shadow-xl shadow-emerald-950/10 backdrop-blur-xl">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-lg font-bold text-white">Generate Images</h3>
          <p className="mt-1 text-sm leading-6 text-emerald-100/75">
            Available only for image-ready blog tools. Each generated image costs {IMAGE_CREDITS_PER_IMAGE} credits.
          </p>
        </div>
        <span className="inline-flex w-fit rounded-full border border-emerald-300/25 bg-black/30 px-3 py-1 text-xs font-semibold text-emerald-100">
          {credits} credits total
        </span>
      </div>

      <div className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-semibold text-white" htmlFor="image-prompt">
            Image Prompt Override
          </label>
          <textarea
            id="image-prompt"
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder="Optional: describe exactly what image you want. If empty, Creator uses the generated article/image brief above."
            className="h-24 w-full resize-none rounded-xl border border-emerald-400/20 bg-black/30 px-4 py-3 text-white placeholder-gray-500 transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-400"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-semibold text-white" htmlFor="image-count">
              Number of Images
            </label>
            <select
              id="image-count"
              value={imageCount}
              onChange={(event) => setImageCount(Number(event.target.value))}
              className="w-full rounded-xl border border-emerald-400/20 bg-black/30 px-4 py-3 text-white focus:border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-400"
            >
              {imageCountOptions.map((count) => (
                <option key={count} value={count} className="bg-black text-white">
                  {count} image{count === 1 ? "" : "s"} — {calculateImageGenerationCredits(count)} credits
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-white" htmlFor="image-ratio">
              Image Ratio
            </label>
            <select
              id="image-ratio"
              value={aspectRatio}
              onChange={(event) => setAspectRatio(event.target.value)}
              className="w-full rounded-xl border border-emerald-400/20 bg-black/30 px-4 py-3 text-white focus:border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-400"
            >
              {aspectRatioOptions.map((ratio) => (
                <option key={ratio} value={ratio} className="bg-black text-white">
                  {ratio}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error ? (
          <div className="whitespace-pre-wrap rounded-2xl border border-red-400/25 bg-red-500/10 p-4 text-sm leading-6 text-red-100">
            {error}
          </div>
        ) : null}

        <button
          type="button"
          disabled={isGenerating || !canGenerate}
          onClick={handleGenerateImages}
          className="flex w-full items-center justify-center rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-3 font-semibold text-white shadow-lg shadow-emerald-500/20 transition hover:from-emerald-600 hover:to-teal-600 disabled:cursor-not-allowed disabled:from-emerald-600/40 disabled:to-teal-600/40"
        >
          {isGenerating ? "Generating images..." : `Generate Images — ${credits} credits`}
        </button>

        {images.length ? (
          <div className="space-y-4 pt-2">
            {lastProvider ? (
              <p className="text-xs text-emerald-100/70">Generated with {lastProvider}</p>
            ) : null}
            <div className="grid gap-4 sm:grid-cols-2">
              {images.map((image) => (
                <div
                  key={`${image.provider}-${image.model}-${image.index}`}
                  className="overflow-hidden rounded-2xl border border-emerald-400/20 bg-black/40"
                >
                  <img
                    src={image.dataUrl}
                    alt={`Generated image ${image.index}`}
                    className="aspect-video w-full object-cover"
                  />
                  <div className="flex items-center justify-between gap-3 p-3">
                    <span className="text-xs font-medium text-emerald-100/75">
                      Image {image.index}
                    </span>
                    <button
                      type="button"
                      onClick={() => downloadImage(image)}
                      className="rounded-full border border-emerald-300/30 bg-emerald-400/10 px-3 py-1.5 text-xs font-semibold text-emerald-100 transition hover:bg-emerald-400/20"
                    >
                      Download
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
