import { NextRequest, NextResponse } from "next/server";
import { getAdmin } from "@/lib/supabase-admin";

// PATCH /api/track/[id] — atualiza posição GPS da sessão
// Body: { lat, lon, accuracy?, speed?, heading? }
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return NextResponse.json({ erro: "ID inválido" }, { status: 400 });
  }
  const admin = getAdmin();
  if (!admin) {
    return NextResponse.json({ erro: "Supabase não configurado" }, { status: 503 });
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body.lat !== "number" || typeof body.lon !== "number") {
    return NextResponse.json({ erro: "lat e lon são obrigatórios" }, { status: 400 });
  }

  const { error } = await admin
    .from("tracking_sessions")
    .update({
      lat: body.lat,
      lon: body.lon,
      accuracy: body.accuracy ?? null,
      speed: body.speed ?? null,
      heading: body.heading ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("is_active", true);

  if (error) {
    console.error("track PATCH error:", error);
    return NextResponse.json({ erro: "Sessão não encontrada ou expirada" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}

// DELETE /api/track/[id] — encerra a sessão
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const admin = getAdmin();
  if (!admin) return NextResponse.json({ erro: "Supabase não configurado" }, { status: 503 });

  await admin
    .from("tracking_sessions")
    .update({ is_active: false })
    .eq("id", id);

  return NextResponse.json({ ok: true });
}
