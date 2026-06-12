import { NextRequest, NextResponse } from "next/server";
import { adminConfigurado, getAdmin } from "@/lib/supabase-admin";

/**
 * Webhook do Asaas. Configure no painel Asaas apontando para
 * https://SEU-DOMINIO/api/webhook/asaas com o token em ASAAS_WEBHOOK_TOKEN.
 */
export async function POST(req: NextRequest) {
  const token = process.env.ASAAS_WEBHOOK_TOKEN;
  if (token && req.headers.get("asaas-access-token") !== token) {
    return NextResponse.json({ erro: "token inválido" }, { status: 401 });
  }
  if (!adminConfigurado) {
    return NextResponse.json({ ok: true, aviso: "supabase não configurado" });
  }

  let evento: {
    event?: string;
    payment?: { subscription?: string; status?: string };
  };
  try {
    evento = await req.json();
  } catch {
    return NextResponse.json({ erro: "JSON inválido" }, { status: 400 });
  }

  const subId = evento.payment?.subscription;
  if (!subId) return NextResponse.json({ ok: true, ignorado: true });

  const db = getAdmin()!;
  const agora = new Date();

  switch (evento.event) {
    case "PAYMENT_CONFIRMED":
    case "PAYMENT_RECEIVED": {
      // cobre o mês + folga de 5 dias para a próxima cobrança compensar
      const pagoAte = new Date(agora);
      pagoAte.setDate(pagoAte.getDate() + 35);
      await db
        .from("rp_assinaturas")
        .update({
          status: "ativa",
          pago_ate: pagoAte.toISOString(),
          atualizado_em: agora.toISOString(),
        })
        .eq("asaas_subscription_id", subId);
      break;
    }
    case "PAYMENT_OVERDUE":
      await db
        .from("rp_assinaturas")
        .update({ status: "atrasada", atualizado_em: agora.toISOString() })
        .eq("asaas_subscription_id", subId);
      break;
    case "PAYMENT_REFUNDED":
    case "PAYMENT_CHARGEBACK_REQUESTED":
      await db
        .from("rp_assinaturas")
        .update({ status: "cancelada", atualizado_em: agora.toISOString() })
        .eq("asaas_subscription_id", subId);
      break;
  }

  return NextResponse.json({ ok: true });
}
