-- RotasPro: tabela de assinaturas (rode no SQL Editor do Supabase)

create table if not exists public.rp_assinaturas (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  asaas_customer_id text,
  asaas_subscription_id text unique,
  status text not null default 'pendente', -- pendente | ativa | atrasada | cancelada
  pago_ate timestamptz,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

alter table public.rp_assinaturas enable row level security;

-- usuário enxerga apenas a própria assinatura; escrita só pelo service role
create policy "assinatura propria" on public.rp_assinaturas
  for select using (auth.uid() = user_id);
