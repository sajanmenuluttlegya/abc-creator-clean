import { NextRequest } from "next/server";
import { randomUUID } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { calculateTranscriptCreditsFromBytes, TRANSCRIPT_YOUTUBE_CREDITS } from "@/lib/tools/transcript-credits";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TRANSCRIPT_TOOLS = new Set(["summarize-pro", "video-to-article-converter", "youtube-video-to-blog-post"]);
const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;
const YOUTUBE_MODE = "YouTube URL";
const UPLOAD_MODE = "Upload audio/video";

type CreditReservation = { ok?: boolean; code?: string; requiredCredits?: number; currentCredits?: number; transactionId?: string };
type CreditSpendResult = { ok?: boolean; code?: string; status?: string };

function env(name: string, fallback = "") {
  return process.env[name] || fallback;
}

function rpcErrorMessage(error: unknown) {
  if (!error) return "Unknown credit ledger error.";
  if (error instanceof Error) return error.message;
  return String(error);
}

function extractVideoId(rawUrl: string) {
  try {
    const url = new URL(rawUrl.trim());
    const host = url.hostname.replace(/^www\./, "").toLowerCase();
    if (host === "youtu.be") return url.pathname.split("/").filter(Boolean)[0] || "";
    if (host.endsWith("youtube.com")) {
      if (url.pathname.startsWith("/watch")) return url.searchParams.get("v") || "";
      const parts = url.pathname.split("/").filter(Boolean);
      if (["shorts", "embed", "live"].includes(parts[0])) return parts[1] || "";
    }
  } catch {
    return "";
  }
  return "";
}

function decodeEntities(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function parseTimedTextXml(raw: string) {
  return [...raw.matchAll(/<text[^>]*>([\s\S]*?)<\/text>/g)]
    .map((match) => decodeEntities(match[1] || ""))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchYouTubeTranscript(rawUrl: string) {
  const videoId = extractVideoId(rawUrl);
  if (!videoId) return { ok: false as const, error: "Please enter a valid YouTube video URL." };

  const candidateUrls = [
    `https://video.google.com/timedtext?lang=en&v=${encodeURIComponent(videoId)}`,
    `https://video.google.com/timedtext?lang=en&kind=asr&v=${encodeURIComponent(videoId)}`,
  ];

  for (const url of candidateUrls) {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) continue;
    const transcript = parseTimedTextXml(await response.text());
    if (transcript.length >= 30) return { ok: true as const, transcript };
  }

  return { ok: false as const, error: "Transcript not available. Upload audio/video or paste transcript." };
}

async function transcribeUploadedMedia(file: File) {
  const apiKey = env("OPENAI_TRANSCRIPTION_API_KEY") || env("OPENAI_API_KEY");
  const model = env("OPENAI_TRANSCRIPTION_MODEL", "gpt-4o-mini-transcribe");

  if (!apiKey) return { ok: false as const, error: "Transcript service is not configured. Add OPENAI_API_KEY or paste a transcript manually." };
  if (!file.type.startsWith("audio/") && !file.type.startsWith("video/")) return { ok: false as const, error: "Please upload an audio or video file." };
  if (file.size > MAX_UPLOAD_BYTES) return { ok: false as const, error: "Please upload an audio/video file under 50 MB, or paste the transcript manually." };

  const body = new FormData();
  body.append("file", file, file.name || "source-media");
  body.append("model", model);
  body.append("response_format", "json");

  const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body,
  });

  const text = await response.text();
  if (!response.ok) return { ok: false as const, error: "Could not transcribe the uploaded media.", details: text.slice(0, 600) };

  try {
    const data = JSON.parse(text) as { text?: string };
    const transcript = (data.text || "").replace(/\s+/g, " ").trim();
    if (transcript.length < 30) return { ok: false as const, error: "The uploaded media did not produce enough transcript text." };
    return { ok: true as const, transcript };
  } catch {
    return { ok: false as const, error: "Could not parse the transcript result." };
  }
}

export async function POST(req: NextRequest) {
  let reservedTransactionId: string | null = null;
  let supabase: Awaited<ReturnType<typeof createClient>> | null = null;

  async function refundIfReserved(reason: string) {
    if (!supabase || !reservedTransactionId) return;
    try {
      await supabase.rpc("refund_reserved_credits", { p_transaction_id: reservedTransactionId, p_reason: reason });
    } catch {
      // Do not expose refund internals.
    }
  }

  try {
    supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return Response.json({ ok: false, error: "Login required.", code: "AUTH_REQUIRED" }, { status: 401 });

    const form = await req.formData();
    const toolSlug = String(form.get("toolSlug") || "").trim();
    const sourceMode = String(form.get("sourceMode") || "").trim();
    const youtubeUrl = String(form.get("youtubeUrl") || "").trim();
    const fileValue = form.get("media");
    const file = fileValue instanceof File ? fileValue : null;

    if (!TRANSCRIPT_TOOLS.has(toolSlug)) return Response.json({ ok: false, error: "Transcript extraction is enabled only for selected transcript tools.", code: "TRANSCRIPT_TOOL_NOT_ALLOWED" }, { status: 400 });
    if (![YOUTUBE_MODE, UPLOAD_MODE].includes(sourceMode)) return Response.json({ ok: false, error: "Choose YouTube URL or Upload audio/video for transcript extraction.", code: "TRANSCRIPT_SOURCE_MODE_REQUIRED" }, { status: 400 });
    if (sourceMode === YOUTUBE_MODE && !youtubeUrl) return Response.json({ ok: false, error: "Paste a YouTube URL or choose another source mode.", code: "YOUTUBE_URL_REQUIRED" }, { status: 400 });
    if (sourceMode === UPLOAD_MODE && !file) return Response.json({ ok: false, error: "Upload an audio/video file or choose another source mode.", code: "MEDIA_FILE_REQUIRED" }, { status: 400 });

    const requiredCredits = sourceMode === UPLOAD_MODE ? calculateTranscriptCreditsFromBytes(file?.size || 0) : TRANSCRIPT_YOUTUBE_CREDITS;
    const reserveResponse = await supabase.rpc("reserve_credits", {
      p_tool_slug: `${toolSlug}:transcript`,
      p_amount: requiredCredits,
      p_idempotency_key: `${user.id}:${toolSlug}:transcript:${randomUUID()}`,
    });

    if (reserveResponse.error) return Response.json({ ok: false, error: "Could not reserve transcript credits.", details: rpcErrorMessage(reserveResponse.error) }, { status: 500 });

    const reservation = reserveResponse.data as CreditReservation;
    if (!reservation?.ok) {
      return Response.json({ ok: false, error: "Not enough credits for transcript extraction.", code: reservation?.code || "INSUFFICIENT_CREDITS", requiredCredits: reservation?.requiredCredits ?? requiredCredits, currentCredits: reservation?.currentCredits ?? 0 }, { status: 402 });
    }

    reservedTransactionId = reservation.transactionId || null;
    if (!reservedTransactionId) return Response.json({ ok: false, error: "Transcript credit reservation failed.", code: "CREDIT_RESERVATION_MISSING_ID" }, { status: 500 });

    const result = sourceMode === YOUTUBE_MODE ? await fetchYouTubeTranscript(youtubeUrl) : await transcribeUploadedMedia(file as File);
    if (!result.ok) {
      await refundIfReserved("transcript_extraction_failed");
      return Response.json({ ok: false, error: result.error, details: "details" in result ? result.details : undefined, code: "TRANSCRIPT_UNAVAILABLE" }, { status: 422 });
    }

    const spendResponse = await supabase.rpc("spend_reserved_credits", {
      p_transaction_id: reservedTransactionId,
      p_provider: sourceMode === YOUTUBE_MODE ? "transcript:youtube-captions" : "transcript:openai-audio",
      p_model: sourceMode === YOUTUBE_MODE ? "youtube-captions" : env("OPENAI_TRANSCRIPTION_MODEL", "gpt-4o-mini-transcribe"),
    });

    if (spendResponse.error) {
      await refundIfReserved("transcript_spend_mark_failed");
      return Response.json({ ok: false, error: "Could not finalize transcript credit spend.", details: rpcErrorMessage(spendResponse.error) }, { status: 500 });
    }

    const spendData = spendResponse.data as CreditSpendResult | null;
    if (spendData?.ok === false) {
      await refundIfReserved("transcript_spend_mark_failed");
      return Response.json({ ok: false, error: "Could not finalize transcript credit spend.", code: spendData.code || "SPEND_FAILED", status: spendData.status }, { status: 500 });
    }

    return Response.json({ ok: true, sourceMode, transcript: result.transcript, transcriptLength: result.transcript.length, creditsCharged: requiredCredits, message: "Transcript extracted. The generation will be based on transcript/source only." });
  } catch (error) {
    await refundIfReserved("transcript_extraction_failed");
    return Response.json({ ok: false, error: "Transcript extraction failed.", details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
