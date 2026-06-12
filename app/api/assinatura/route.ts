import { NextRequest, NextResponse } from "next/server";
import {
  asaasConfigurado,
  criarAssinatura,
  criarOuObterCliente,
  urlPagamentoPendente,
} from "@/lib/asaas";
import { adminConfigurado, getAdmin, usuarioDoToken } from "@/lib/supabase-admin";

/**
 * POST { nome, cpf } + Authorization: Bearer <token Supabase>
 * Cria (ou retoma) a assinatura no Asaas e devolve a URL de pagamento.
 */
export async function POST(req: NextRequest) {
  if (!adminConfigurado || !asaasConfigurado) {
    return NextResponse.json(
      { erro: "Cobrança ainda não configurada no servidor (.env)." },
      { status: 503 },
    );
  }
  const user = await usuarioDoToken(req.headers.get("authorization"));
  if (!user?.email) {
    return NextResponse.json({ erro: "Faça login para assinar." }, { status: 401 });
  }

  let body: { nome?: string; cpf?: string };
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const cpf = (body.cpf ?? "").replace(/\D/g, "");
  const nome = body.nome?.trim() || user.email;
  if (cpf.length !== 11 && cpf.length !== 14) {
    return NextResponse.json(
      { erro: "Informe um CPF ou CNPJ válido (exigência do meio de pagamento)." },
      { status: 400 },
    );
  }

  const db = getAdmin()!;
  const { data: linha } = await db
    .from("rp_assinaturas")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  try {
    if (linha?.status === "ativa") {
      return NextResponse.json({ jaAssinante: true });
    }

    // assinatura criada antes mas ainda não paga -> reaproveita o link
    if (linha?.asaas_subscription_id) {
      const url = await urlPagamentoPendente(linha.asaas_subscription_id);
      if (url) return NextResponse.json({ url });
    }

    const customerId =
      linha?.asaas_customer_id ??
      (await criarOuObterCliente({ nome, email: user.email, cpfCnpj: cpf }));
    const ass = await criarAssinatura(customerId);

    await db.from("rp_assinaturas").upsert(
      {
        user_id: user.id,
        email: user.email,
        asaas_customer_id: customerId,
        asaas_subscription_id: ass.id,
        status: "pendente",
        atualizado_em: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );

    return NextResponse.json({ url: ass.urlPagamento });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro ao criar assinatura.";
    return NextResponse.json({ erro: msg }, { status: 502 });
  }
}

/** GET + Authorization -> status da assinatura do usuário logado. */
export async function GET(req: NextRequest) {
  if (!adminConfigurado) {
    return NextResponse.json({ status: "nao_configurado" });
  }
  const user = await usuarioDoToken(req.headers.get("authorization"));
  if (!user) return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });

  const { data } = await getAdmin()!
    .from("rp_assinaturas")
    .select("status, pago_ate")
    .eq("user_id", user.id)
    .maybeSingle();
  return NextResponse.json({
    status: data?.status ?? "nenhuma",
    pagoAte: data?.pago_ate ?? null,
  });
}
