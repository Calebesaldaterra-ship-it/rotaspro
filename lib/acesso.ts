import { NextRequest, NextResponse } from "next/server";
import { adminConfigurado, getAdmin, usuarioDoToken } from "./supabase-admin";

const LIMITE_GRATIS = 3;
const COOKIE_USO = "rp_uso";

export type Acesso =
  | { permitido: true; assinante: boolean; usosRestantes: number | null }
  | { permitido: false; motivo: string };

/** Lê quantos usos gratuitos o visitante já fez hoje (via cookie). */
function lerUsosHoje(req: NextRequest): number {
  try {
    const raw = req.cookies.get(COOKIE_USO)?.value;
    if (!raw) return 0;
    const { data, usos } = JSON.parse(raw) as { data: string; usos: number };
    const hoje = new Date().toISOString().slice(0, 10);
    return data === hoje ? usos : 0;
  } catch {
    return 0;
  }
}

/** Incrementa o contador de usos no cookie da resposta. */
export function registrarUso(req: NextRequest, res: NextResponse): void {
  const usosHoje = lerUsosHoje(req);
  const hoje = new Date().toISOString().slice(0, 10);
  res.cookies.set(COOKIE_USO, JSON.stringify({ data: hoje, usos: usosHoje + 1 }), {
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 2, // 2 dias
  });
}

/**
 * Acesso ao cálculo de rotas:
 * - cobrança não configurada (dev) → liberado;
 * - assinatura ativa → liberado (ilimitado);
 * - visitante/não-assinante → até 3 cálculos grátis por dia (cookie).
 */
export async function verificarAcesso(req: NextRequest): Promise<Acesso> {
  if (!adminConfigurado) {
    return { permitido: true, assinante: false, usosRestantes: null };
  }

  const user = await usuarioDoToken(req.headers.get("authorization"));
  if (user) {
    const db = getAdmin();
    if (!db) return { permitido: true, assinante: false, usosRestantes: null };
    const { data } = await db
      .from("rp_assinaturas")
      .select("status, pago_ate")
      .eq("user_id", user.id)
      .maybeSingle();
    const pagoAteDate = data?.pago_ate ? new Date(data.pago_ate) : null;
    const pagoAteValido = pagoAteDate instanceof Date && !isNaN(pagoAteDate.getTime());
    const ativa =
      data?.status === "ativa" &&
      (!data.pago_ate || (pagoAteValido && pagoAteDate! > new Date()));
    if (ativa) return { permitido: true, assinante: true, usosRestantes: null };
  }

  // visitante ou assinante inativo → cota gratuita por cookie
  const usosHoje = lerUsosHoje(req);
  if (usosHoje < LIMITE_GRATIS) {
    return {
      permitido: true,
      assinante: false,
      usosRestantes: LIMITE_GRATIS - usosHoje - 1,
    };
  }

  return {
    permitido: false,
    motivo: "Seus cálculos grátis de hoje acabaram. Assine o RotasPro por R$ 15/mês para calcular sem limite.",
  };
}
