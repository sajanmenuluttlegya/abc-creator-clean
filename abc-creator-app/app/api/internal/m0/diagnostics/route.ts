import { timingSafeEqual } from "crypto";
import { NextRequest } from "next/server";
import { generateM0Image } from "@/lib/image-tools/m0-image-client";
import { getActiveM0Worker } from "@/lib/image-tools/m0-worker-registry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

function safeTokenMatch(received: string, expected: string) {
  const receivedBuffer = Buffer.from(received, "utf8");
  const expectedBuffer = Buffer.from(expected, "utf8");

  if (receivedBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(receivedBuffer, expectedBuffer);
}

function authorized(req: NextRequest) {
  const expectedToken = process.env.M0_REGISTRATION_TOKEN?.trim() || "";
  const authorization = req.headers.get("authorization") || "";
  const receivedToken = authorization.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length).trim()
    : "";

  return Boolean(
    expectedToken &&
      receivedToken &&
      safeTokenMatch(receivedToken, expectedToken)
  );
}

function json(body: unknown, status = 200) {
  return Response.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return json({ ok: false, error: "Unauthorized." }, 401);
  }

  try {
    const worker = await getActiveM0Worker();

    return json({
      ok: true,
      registrationConfigured: Boolean(
        process.env.M0_REGISTRATION_TOKEN?.trim()
      ),
      workerKeyConfigured: Boolean(process.env.M0_WORKER_API_KEY?.trim()),
      activeWorker: worker
        ? {
            workerName: worker.workerName,
            expiresAt: worker.expiresAt,
            healthy: true,
          }
        : null,
    });
  } catch (error) {
    return json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "M0 diagnostics failed.",
      },
      500
    );
  }
}

export async function POST(req: NextRequest) {
  if (!authorized(req)) {
    return json({ ok: false, error: "Unauthorized." }, 401);
  }

  try {
    const result = await generateM0Image({
      prompt:
        "A small polished origami lighthouse on a calm blue desk, soft studio lighting, clean background, no text, no logo, premium product photograph",
      negativePrompt:
        "watermark, readable text, logo, duplicate object, distorted geometry",
      resolution: "360p",
      aspectRatio: "1:1",
      style: "Photorealistic",
      seed: "20260715",
      operation: "generate",
    });

    const match = /^data:(image\/(?:png|jpeg|jpg|webp));base64,(.+)$/i.exec(
      result.dataUrl
    );

    if (!match?.[2]) {
      throw new Error("M0 smoke test returned an invalid image payload.");
    }

    const image = Buffer.from(match[2], "base64");

    if (image.length < 100) {
      throw new Error("M0 smoke test returned an empty image.");
    }

    return new Response(new Uint8Array(image), {
      status: 200,
      headers: {
        "Content-Type": match[1].toLowerCase().replace("image/jpg", "image/jpeg"),
        "Content-Length": String(image.length),
        "Cache-Control": "no-store, max-age=0",
        "Content-Disposition": "inline; filename=abc-m0-live-smoke.png",
        "X-M0-Worker": result.workerName,
        "X-M0-Model": result.modelId,
        "X-M0-Width": String(result.width),
        "X-M0-Height": String(result.height),
        "X-M0-Seed": String(result.seed),
      },
    });
  } catch (error) {
    return json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "M0 live smoke test failed.",
      },
      500
    );
  }
}
