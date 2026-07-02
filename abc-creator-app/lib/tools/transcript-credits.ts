export const TRANSCRIPT_YOUTUBE_CREDITS = 1;

export function calculateTranscriptCreditsFromBytes(sizeBytes: number) {
  const safeSize = Number.isFinite(sizeBytes) ? Math.max(0, sizeBytes) : 0;
  const sizeMb = safeSize / (1024 * 1024);

  if (sizeMb <= 10) return 1;
  if (sizeMb <= 25) return 2;
  return 3;
}

export function getTranscriptCreditLabel(sourceMode: string, sizeBytes?: number) {
  const credits = sourceMode === "Upload audio/video" ? calculateTranscriptCreditsFromBytes(sizeBytes || 0) : TRANSCRIPT_YOUTUBE_CREDITS;
  return `${credits} transcript credit${credits === 1 ? "" : "s"}`;
}
