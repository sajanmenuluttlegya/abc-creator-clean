export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  return Response.json({ ok: false, error: "Section regeneration route pending." }, { status: 501 });
}
