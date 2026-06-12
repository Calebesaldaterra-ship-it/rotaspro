import { NextRequest, NextResponse } from "next/server";
import { adminConfigurado, getAdmin, usuarioDoToken } from "./supabase-admin";

export const LIMITE_GRATIS_DIA = 3;
const COOKIE_USO = "rp_uso";

export type Acesso =
  | { permitido: true; assinante: boolean; usosRestantes: number | null }
  | { permitido: false; motivo: string };

/**
 * Regras de acesso ao cálculo de rotas:
 * - cobrança não configurada (dev) -> liberado;
 * - assinante com status "ativa" -> ilimitado;
 * - visitante/grátis -> LIMITE_GRATIS_DIA cálculos por dia (cookie).
 */
export async function verificarAcesso(req: NextRequest): Promise<Acesso> {
  if (!adminConfigurado) {
    return { permitido: true, assinante: false, usosRestantes: null };
  }

  const user = await usuarioDoToken(req.headers.get("authorization"));
  if (user) {
    const { data } = await getAdmin()!
      .from("rp_assinaturas")
      .select("status, pago_ate")
      .eq("user_id", user.id)
      .maybeSingle();
    const ativa =
      data?.status === "ativa" &&
      (!data.pago_ate || new Date(data.pago_ate) > new Date());
    if (ativa) return { permitido: true, assinante: true, usosRestantes: null };
  }

  const uso = lerUso(req);
  if (uso.n >= LIMITE_GRATIS_DIA) {
    return {
      permitido: false,
      motivo: `Você usou os ${LIMITE_GRATIS_DIA} cálculos grátis de hoje. Assine o RotasPro por R$ 15/mês para uso ilimitado.`,
    };
  }
  return {
    permitido: true,
    assinante: false,
    usosRestantes: LIMITE_GRATIS_DIA - uso.n - 1,
  };
}

function hoje(): string {
  return new Date().toISOString().slice(0, 10);
}

function lerUso(req: NextRequest): { d: string; n: number } {
  try {
    const raw = req.cookies.get(COOKIE_USO)?.value;
    if (raw) {
      const v = JSON.parse(raw) as { d: string; n: number };
      if (v.d === hoje() && Number.isFinite(v.n)) return v;
    }
  } catch {}
  return { d: hoje(), n: 0 };
}

/** Registra +1 uso grátis no cookie da resposta (não conta para assinante). */
export function registrarUso(req: NextRequest, res: NextResponse): void {
  const uso = lerUso(req);
  res.cookies.set(COOKIE_USO, JSON.stringify({ d: hoje(), n: uso.n + 1 }), {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24,
    path: "/",
  });
}
