import { timingSafeEqual } from "crypto";
import { NextRequest } from "next/server";
import { registerM0Worker } from "@/lib/image-tools/m0-worker-registry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

function safeTokenMatch(received: string, expected: string) {
  const receivedBuffer = Buffer.from(received, "utf8");
  const expectedBuffer = Buffer.from(expected, "utf8");

  if (receivedBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(receivedBuffer, expectedBuffer);
}

function noStoreJson(body: unknown, init?: ResponseInit) {
  const headers = new Headers(init?.headers);
  headers.set("Cache-Control", "no-store, max-age=0");

  return Response.json(body, {
    ...init,
    headers,
  });
}

export async function POST(req: NextRequest) {
  try {
    const expectedToken = process.env.M0_REGISTRATION_TOKEN;

    if (!expectedToken) {
      return noStoreJson(
        { ok: false, error: "M0 registration is not configured." },
        { status: 503 }
      );
    }

    const authorization = req.headers.get("authorization") || "";
    const receivedToken = authorization.startsWith("Bearer ")
      ? authorization.slice("Bearer ".length).trim()
      : "";

    if (!receivedToken || !safeTokenMatch(receivedToken, expectedToken)) {
      return noStoreJson(
        { ok: false, error: "Unauthorized." },
        { status: 401 }
      );
    }

    const body = (await req.json()) as {
      workerName?: string;
      publicUrl?: string;
      slotStartIST?: string;
      slotStopIST?: string;
      expiresAt?: string;
      metadata?: Record<string, unknown>;
    };

    const registration = await registerM0Worker({
      workerName: body.workerName || "",
      publicUrl: body.publicUrl || "",
      slotStartIST: body.slotStartIST || "",
      slotStopIST: body.slotStopIST || "",
      expiresAt: body.expiresAt || "",
      metadata: body.metadata || {},
    });

    return noStoreJson(
      {
        ok: true,
        worker: registration.workerName,
        publicUrl: registration.publicUrl,
        expiresAt: registration.expiresAt,
      },
      { status: 201 }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "M0 registration failed.";

    return noStoreJson(
      { ok: false, error: message },
      { status: 400 }
    );
  }
}
