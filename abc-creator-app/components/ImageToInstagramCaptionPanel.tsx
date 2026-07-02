"use client";

import { OutputPanel } from "./OutputPanel";

type Props = {
  isLoading: boolean;
  output: string;
  inputs: Record<string, string>;
};

export function ImageToInstagramCaptionPanel({ isLoading, output, inputs }: Props) {
  const imageSrc = inputs.image_data || "";

  return (
    <div className="space-y-5">
      {imageSrc ? (
        <div className="grid gap-4 rounded-2xl border border-white/10 bg-white/[0.035] p-4 md:grid-cols-[180px_minmax(0,1fr)]">
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/60">
            <img src={imageSrc} alt="Uploaded Instagram source" className="h-44 w-full object-cover" />
          </div>
          <div className="flex flex-col justify-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-pink-200">Source image attached</p>
            <p className="mt-2 text-sm leading-6 text-slate-300">Used as the visual source for this caption generation.</p>
          </div>
        </div>
      ) : null}

      <OutputPanel
        isLoading={isLoading}
        output={output}
        recommendedNextActions={[]}
        downloadFileBaseName="image-to-instagram-caption-output"
        toolSlug="image-to-instagram-caption"
        inputs={inputs}
      />
    </div>
  );
}
