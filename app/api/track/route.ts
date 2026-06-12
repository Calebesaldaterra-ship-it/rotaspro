import { NextRequest, NextResponse } from "next/server";
import { getAdmin } from "@/lib/supabase-admin";

// POST /api/track — cria uma sessão de rastreamento
// Body: { origemLabel?: string, destinoLabel?: string }
export async function POST(req: NextRequest) {
  const admin = getAdmin();
  if (!admin) {
    return NextResponse.json({ erro: "Supabase não configurado" }, { status: 503 });
  }

  const body = await req.json().catch(() => ({}));

  const { data, error } = await admin
    .from("tracking_sessions")
    .insert({
      origem_label: body.origemLabel ?? null,
      destino_label: body.destinoLabel ?? null,
    })
    .select("id")
    .single();

  if (error) {
    console.error("track POST error:", error);
    return NextResponse.json({ erro: "Erro ao criar sessão" }, { status: 500 });
  }

  return NextResponse.json({ id: data.id });
}
