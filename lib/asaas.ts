// Integração Asaas (assinatura recorrente) — uso exclusivo no servidor.
import "server-only";

export const PRECO_MENSAL = 15;

const BASE =
  process.env.ASAAS_AMBIENTE === "sandbox"
    ? "https://api-sandbox.asaas.com/v3"
    : "https://api.asaas.com/v3";

export const asaasConfigurado = Boolean(process.env.ASAAS_API_KEY);

async function asaas<T>(
  path: string,
  init?: { method?: string; body?: unknown },
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: init?.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      access_token: process.env.ASAAS_API_KEY!,
      "User-Agent": "RotasPro",
    },
    body: init?.body ? JSON.stringify(init.body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) {
    const msg =
      data?.errors?.[0]?.description ?? `Asaas respondeu ${res.status}`;
    throw new Error(msg);
  }
  return data as T;
}

export async function criarOuObterCliente(opts: {
  nome: string;
  email: string;
  cpfCnpj: string;
}): Promise<string> {
  const busca = await asaas<{ data: { id: string }[] }>(
    `/customers?email=${encodeURIComponent(opts.email)}&limit=1`,
  );
  if (busca.data.length > 0) return busca.data[0].id;
  const novo = await asaas<{ id: string }>("/customers", {
    method: "POST",
    body: { name: opts.nome, email: opts.email, cpfCnpj: opts.cpfCnpj },
  });
  return novo.id;
}

export async function criarAssinatura(customerId: string): Promise<{
  id: string;
  urlPagamento: string | null;
}> {
  const hoje = new Date().toISOString().slice(0, 10);
  const ass = await asaas<{ id: string }>("/subscriptions", {
    method: "POST",
    body: {
      customer: customerId,
      billingType: "UNDEFINED", // cliente escolhe PIX/boleto/cartão no checkout
      value: PRECO_MENSAL,
      nextDueDate: hoje,
      cycle: "MONTHLY",
      description: "Assinatura RotasPro — rotas, pedágios e frete",
    },
  });
  // primeira cobrança da assinatura -> link de pagamento hospedado
  const pags = await asaas<{ data: { invoiceUrl?: string }[] }>(
    `/subscriptions/${ass.id}/payments?limit=1`,
  );
  return { id: ass.id, urlPagamento: pags.data[0]?.invoiceUrl ?? null };
}

export async function urlPagamentoPendente(
  subscriptionId: string,
): Promise<string | null> {
  const pags = await asaas<{
    data: { status: string; invoiceUrl?: string }[];
  }>(`/subscriptions/${subscriptionId}/payments?limit=10`);
  const pendente = pags.data.find((p) =>
    ["PENDING", "OVERDUE"].includes(p.status),
  );
  return pendente?.invoiceUrl ?? null;
}
