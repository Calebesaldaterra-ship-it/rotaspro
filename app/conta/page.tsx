"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getSupabase, supabaseConfigurado } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

const PRECO = 15;

type StatusAssinatura =
  | "carregando"
  | "nenhuma"
  | "pendente"
  | "ativa"
  | "atrasada"
  | "cancelada"
  | "nao_configurado";

export default function Conta() {
  const supabase = getSupabase();
  const [user, setUser] = useState<User | null>(null);
  const [modo, setModo] = useState<"login" | "cadastro">("login");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [status, setStatus] = useState<StatusAssinatura>("carregando");
  const [pagoAte, setPagoAte] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, sess) =>
      setUser(sess?.user ?? null),
    );
    return () => sub.subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    (async () => {
      if (!supabase || !user) return;
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      const r = await fetch("/api/assinatura", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const d = await r.json();
      setStatus(d.status ?? "nenhuma");
      setPagoAte(d.pagoAte ?? null);
    })();
  }, [supabase, user]);

  async function entrarOuCadastrar() {
    if (!supabase) return;
    setErro(null);
    setInfo(null);
    setOcupado(true);
    try {
      if (modo === "cadastro") {
        const { error } = await supabase.auth.signUp({ email, password: senha });
        if (error) throw error;
        setInfo("Conta criada! Se a confirmação por e-mail estiver ativa, verifique sua caixa de entrada.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
        if (error) throw error;
      }
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro de autenticação.");
    } finally {
      setOcupado(false);
    }
  }

  async function assinar() {
    if (!supabase) return;
    setErro(null);
    setOcupado(true);
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      const r = await fetch("/api/assinatura", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ nome, cpf }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.erro ?? "Erro ao assinar.");
      if (d.jaAssinante) {
        setStatus("ativa");
        return;
      }
      if (d.url) window.location.href = d.url; // checkout Asaas (PIX/cartão/boleto)
      else setErro("Não foi possível gerar o link de pagamento. Tente novamente.");
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao assinar.");
    } finally {
      setOcupado(false);
    }
  }

  const inputCls =
    "mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-amber-400/70";

  return (
    <div className="min-h-dvh bg-slate-950 px-4 py-8 text-slate-100">
      <div className="mx-auto max-w-md">
        <Link href="/" className="text-sm text-amber-300 hover:text-amber-200">
          ← voltar ao app
        </Link>
        <h1 className="mt-4 text-2xl font-bold">
          Rotas<span className="text-amber-400">Pro</span> · Assinatura
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Cálculos ilimitados de rota, pedágio, combustível e frete por{" "}
          <b className="text-amber-300">R$ {PRECO}/mês</b>. Cancele quando quiser.
        </p>

        {!supabaseConfigurado && (
          <p className="mt-6 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-200">
            A cobrança ainda não foi configurada neste servidor. Preencha o{" "}
            <code>.env.local</code> (veja <code>SETUP-PAGAMENTO.md</code>) e
            reinicie o app.
          </p>
        )}

        {supabaseConfigurado && !user && (
          <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="mb-3 flex gap-2">
              {(["login", "cadastro"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setModo(m)}
                  className={`flex-1 rounded-lg py-2 text-sm font-semibold ${
                    modo === m
                      ? "bg-amber-400 text-slate-950"
                      : "border border-slate-700 text-slate-300"
                  }`}
                >
                  {m === "login" ? "Entrar" : "Criar conta"}
                </button>
              ))}
            </div>
            <label className="block text-xs text-slate-400">
              E-mail
              <input className={inputCls} type="email" value={email}
                onChange={(e) => setEmail(e.target.value)} placeholder="voce@email.com" />
            </label>
            <label className="mt-3 block text-xs text-slate-400">
              Senha
              <input className={inputCls} type="password" value={senha}
                onChange={(e) => setSenha(e.target.value)} placeholder="mínimo 6 caracteres" />
            </label>
            <button
              onClick={entrarOuCadastrar}
              disabled={ocupado || !email || senha.length < 6}
              className="mt-4 w-full rounded-xl bg-amber-400 py-2.5 text-sm font-bold text-slate-950 disabled:opacity-40"
            >
              {ocupado ? "Aguarde…" : modo === "login" ? "Entrar" : "Criar conta"}
            </button>
          </div>
        )}

        {supabaseConfigurado && user && (
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <div>
                <p className="text-sm text-slate-300">{user.email}</p>
                <p className="mt-0.5 text-xs text-slate-500">
                  Assinatura:{" "}
                  <b
                    className={
                      status === "ativa" ? "text-emerald-300" : "text-amber-300"
                    }
                  >
                    {status === "carregando" ? "…" : status}
                  </b>
                  {status === "ativa" && pagoAte && (
                    <> · válida até {new Date(pagoAte).toLocaleDateString("pt-BR")}</>
                  )}
                </p>
              </div>
              <button
                onClick={() => supabase?.auth.signOut()}
                className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:border-red-400/60"
              >
                Sair
              </button>
            </div>

            {status !== "ativa" && (
              <div className="rounded-2xl border border-amber-400/40 bg-amber-400/5 p-4">
                <p className="text-sm font-semibold text-amber-200">
                  Assinar — R$ {PRECO},00/mês
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Pagamento via PIX, cartão ou boleto (Asaas). Liberação
                  automática na confirmação.
                </p>
                <label className="mt-3 block text-xs text-slate-400">
                  Nome completo
                  <input className={inputCls} value={nome}
                    onChange={(e) => setNome(e.target.value)} placeholder="como no documento" />
                </label>
                <label className="mt-3 block text-xs text-slate-400">
                  CPF (ou CNPJ)
                  <input className={inputCls} value={cpf} inputMode="numeric"
                    onChange={(e) => setCpf(e.target.value)} placeholder="000.000.000-00" />
                </label>
                <button
                  onClick={assinar}
                  disabled={ocupado || !nome || cpf.replace(/\D/g, "").length < 11}
                  className="mt-4 w-full rounded-xl bg-amber-400 py-2.5 text-sm font-bold text-slate-950 disabled:opacity-40"
                >
                  {ocupado ? "Gerando pagamento…" : "Assinar agora"}
                </button>
              </div>
            )}

            {status === "ativa" && (
              <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3 text-sm text-emerald-200">
                ✓ Assinatura ativa — bom proveito! Cálculos ilimitados liberados.
              </p>
            )}
          </div>
        )}

        {erro && (
          <p className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {erro}
          </p>
        )}
        {info && (
          <p className="mt-4 rounded-lg border border-sky-500/40 bg-sky-500/10 px-3 py-2 text-sm text-sky-200">
            {info}
          </p>
        )}
      </div>
    </div>
  );
}
