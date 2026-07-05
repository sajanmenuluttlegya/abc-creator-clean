import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(_req: NextRequest) {
  return Response.json({ ok: false, error: "This image utility is temporarily unavailable while the local version is being installed." }, { status: 503 });
}
