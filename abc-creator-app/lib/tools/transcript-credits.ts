export const TRANSCRIPT_YOUTUBE_CREDITS = 2;

function creditLabel(credits: number) {
  return `${credits} transcript credit${credits === 1 ? "" : "s"}`;
}

export function calculateTranscriptCreditsFromBytes(sizeBytes: number): number {
  const safeSize = Number.isFinite(sizeBytes) ? Math.max(0, sizeBytes) : 0;
  const sizeMb = safeSize / (1024 * 1024);

  if (sizeMb <= 10) return 2;
  if (sizeMb <= 25) return 5;
  return 5;
}

export function getTranscriptCreditLabel(sourceMode: string, sizeBytes?: number) {
  const credits: number = sourceMode === "Upload audio/video" ? calculateTranscriptCreditsFromBytes(sizeBytes || 0) : TRANSCRIPT_YOUTUBE_CREDITS;
  return creditLabel(credits);
}
