# RotasPro — ativar a assinatura de R$ 15/mês

O código já está pronto. Falta só conectar suas contas (15 min):

## 1. Supabase (login dos usuários)

1. Crie um projeto novo em [supabase.com](https://supabase.com) (pode ser na mesma organização do ImoCRM, mas **projeto separado**).
2. Em **SQL Editor**, cole e execute o conteúdo de `supabase/schema.sql`.
3. Em **Authentication > Providers**, deixe **Email** habilitado.
   - Para liberar acesso imediato sem confirmação de e-mail: desligue "Confirm email".
4. Em **Settings > API**, copie:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ nunca exponha no navegador)

## 2. Asaas (cobrança recorrente)

Você já tem conta em produção (usada no ImoCRM) — pode usar a mesma:

1. **Integrações > Chaves de API** → copie para `ASAAS_API_KEY`.
2. **Integrações > Webhooks** → cadastre um webhook novo:
   - URL: `https://SEU-DOMINIO/api/webhook/asaas`
   - Eventos: cobranças (`PAYMENT_CONFIRMED`, `PAYMENT_RECEIVED`, `PAYMENT_OVERDUE`, `PAYMENT_REFUNDED`)
   - Token de autenticação: invente um valor forte e repita em `ASAAS_WEBHOOK_TOKEN`.
3. Para testar sem dinheiro real: crie uma conta em
   [sandbox.asaas.com](https://sandbox.asaas.com), use a chave dela e defina
   `ASAAS_AMBIENTE=sandbox`.

## 3. Variáveis de ambiente

Copie `.env.example` para `.env.local` e preencha. Em produção (Vercel),
cadastre as mesmas variáveis em **Settings > Environment Variables**.

## Como funciona

- Sem login: **3 cálculos grátis por dia** (controlado por cookie).
- Logado sem pagar: mesmos 3 grátis + botão "Assinar".
- "Assinar agora" cria a assinatura mensal no Asaas e abre o checkout
  (PIX, cartão ou boleto). O webhook confirma o pagamento e ativa na hora.
- Atraso/estorno: o webhook rebaixa o status e o limite grátis volta a valer.
- Enquanto o `.env.local` estiver vazio, o app roda **liberado** (modo dev).
