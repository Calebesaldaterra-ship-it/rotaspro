"use client";

import { useState } from "react";

const OPCOES_USUARIOS = [1, 5, 10, 15, 20, 25, 30, 35, 40];

function calcularPreco(usuarios: number) {
  if (usuarios === 1) return { total: 15, porPessoa: 15, economia: 0 };
  const total = usuarios * 12;
  return { total, porPessoa: 12, economia: usuarios * 15 - total };
}

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const beneficios = [
  {
    icon: "💰",
    titulo: "Saiba o custo antes de sair",
    desc: "Combustível, pedágio e frete calculados antes da viagem. Sem surpresa no bolso no final da entrega.",
  },
  {
    icon: "🛡️",
    titulo: "Viagem mais segura",
    desc: "Compartilhe sua rota ao vivo. Sua família e sua empresa acompanham onde você está em tempo real.",
  },
  {
    icon: "📋",
    titulo: "Frete dentro da lei",
    desc: "Consulte o piso mínimo da tabela ANTT e nunca aceite um frete abaixo do que a lei garante.",
  },
  {
    icon: "⏱️",
    titulo: "Economize horas por semana",
    desc: "Sem planilha, sem calculadora. Em segundos você tem a rota, o custo e a melhor alternativa.",
  },
  {
    icon: "📵",
    titulo: "Sem internet? Sem problema",
    desc: "Instale no celular e use mesmo em áreas sem sinal. Ideal para estradas e zonas rurais.",
  },
  {
    icon: "🚚",
    titulo: "Feito para quem vive na estrada",
    desc: "Carro, moto, caminhão ou ônibus — cada veículo tem seu cálculo correto de pedágio e consumo.",
  },
];

const depoimentos = [
  {
    texto: "Antes eu chegava no posto sem saber se ia fechar o mês no positivo. Hoje calculo tudo antes de aceitar o frete.",
    autor: "Carlos R.",
    cargo: "Caminhoneiro autônomo — SP",
    emoji: "🚚",
  },
  {
    texto: "Minha esposa fica tranquila porque acompanha minha rota ao vivo pelo celular dela. Isso não tem preço.",
    autor: "Marcos T.",
    cargo: "Transportador — MG",
    emoji: "📍",
  },
  {
    texto: "Coloquei o meu time de 8 motoristas no plano equipe. Economizei mais no primeiro mês do que paguei no ano.",
    autor: "Fernanda L.",
    cargo: "Gestora de frota — PR",
    emoji: "🏢",
  },
];

export default function LandingIsland() {
  const [sliderIdx, setSliderIdx] = useState(0);
  const [depoimentoIdx, setDepoimentoIdx] = useState(0);

  const usuarios = OPCOES_USUARIOS[sliderIdx];
  const { total, porPessoa, economia } = calcularPreco(usuarios);
  const dep = depoimentos[depoimentoIdx];

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-10 space-y-20">

      {/* ── HERO ── */}
      <div className="space-y-8">
        {/* Imagem hero */}
        <div className="relative rounded-3xl overflow-hidden h-64 sm:h-80">
          <img
            src="https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=900&q=80"
            alt="Caminhão em rodovia ao entardecer"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
          <div className="absolute bottom-0 left-0 p-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-slate-950/70 backdrop-blur px-3 py-1 text-xs font-semibold text-emerald-300 mb-3">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Rastreamento ao vivo disponível
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">
              A estrada é sua.<br />
              <span className="text-emerald-400">O custo, você controla.</span>
            </h1>
          </div>
        </div>

        <p className="text-slate-400 text-base leading-relaxed text-center max-w-lg mx-auto">
          RotasPro é o aplicativo do motorista brasileiro. Calcule pedágio, combustível
          e frete em segundos — e compartilhe sua rota ao vivo com quem você ama.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <a
            href="/conta"
            className="flex-1 rounded-2xl bg-emerald-500 px-6 py-4 text-center text-sm font-bold text-white hover:bg-emerald-400 transition shadow-lg shadow-emerald-500/20"
          >
            Começar agora — R$ 15/mês
          </a>
          <a
            href="/"
            className="flex-1 rounded-2xl border border-slate-700 px-6 py-4 text-center text-sm font-semibold text-slate-300 hover:border-emerald-500/50 hover:text-emerald-300 transition"
          >
            Ver a ferramenta →
          </a>
        </div>
      </div>

      {/* ── NÚMEROS ── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { valor: "27", label: "estados com preço de combustível atualizado" },
          { valor: "4", label: "tipos de veículo com pedágio correto" },
          { valor: "∞", label: "rotas calculadas sem limite" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-center">
            <p className="text-3xl font-extrabold text-emerald-400">{s.valor}</p>
            <p className="text-xs text-slate-500 mt-1 leading-snug">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── POR QUE O ROTASPRO? ── */}
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-extrabold text-white">
            Por que motoristas escolhem o RotasPro?
          </h2>
          <p className="text-slate-500 text-sm">
            Cada recurso foi pensado para quem vive na estrada.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {beneficios.map((b) => (
            <div
              key={b.titulo}
              className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-2 hover:border-emerald-500/30 transition"
            >
              <span className="text-3xl">{b.icon}</span>
              <p className="text-sm font-bold text-slate-100">{b.titulo}</p>
              <p className="text-xs text-slate-500 leading-relaxed">{b.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── RASTREAMENTO ── */}
      <div className="relative rounded-3xl overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=900&q=80"
          alt="Estrada ao amanhecer"
          className="w-full h-52 object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/70 to-transparent" />
        <div className="absolute inset-0 flex flex-col justify-center px-7 space-y-3 max-w-sm">
          <p className="text-emerald-400 text-xs font-bold uppercase tracking-widest">Rastreamento ao vivo</p>
          <h3 className="text-xl font-extrabold text-white leading-snug">
            Sua família sabe onde você está. Sempre.
          </h3>
          <p className="text-slate-400 text-xs leading-relaxed">
            Compartilhe um link e qualquer pessoa acompanha sua posição em tempo real,
            sem precisar baixar nenhum aplicativo.
          </p>
          <a href="/conta" className="inline-block rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-white w-fit hover:bg-emerald-400 transition">
            Ativar rastreamento →
          </a>
        </div>
      </div>

      {/* ── DEPOIMENTOS ── */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500 text-center">
          Quem usa, recomenda
        </h2>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
          <p className="text-4xl">{dep.emoji}</p>
          <p className="text-slate-200 text-sm leading-relaxed italic">
            "{dep.texto}"
          </p>
          <div>
            <p className="text-sm font-bold text-white">{dep.autor}</p>
            <p className="text-xs text-slate-500">{dep.cargo}</p>
          </div>
        </div>

        <div className="flex justify-center gap-2">
          {depoimentos.map((_, i) => (
            <button
              key={i}
              onClick={() => setDepoimentoIdx(i)}
              className={`h-2 rounded-full transition-all ${
                i === depoimentoIdx ? "w-6 bg-emerald-500" : "w-2 bg-slate-700"
              }`}
            />
          ))}
        </div>
      </div>

      {/* ── PLANOS ── */}
      <div className="space-y-5">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-extrabold text-white">Planos e preços</h2>
          <p className="text-slate-500 text-sm">Sem fidelidade. Cancele quando quiser.</p>
        </div>

        {/* Individual */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide">Pro Individual</p>
              <p className="text-3xl font-extrabold text-white mt-1">
                R$ 15
                <span className="text-sm font-normal text-slate-400 ml-1">/ mês</span>
              </p>
            </div>
            <span className="text-3xl">🧑‍💼</span>
          </div>
          <ul className="space-y-2">
            {[
              "Rotas ilimitadas",
              "Pedágio, combustível e frete ANTT",
              "Rastreamento ao vivo",
              "Funciona offline (instale no celular)",
            ].map((item) => (
              <li key={item} className="flex items-center gap-2 text-sm text-slate-300">
                <span className="text-emerald-400 shrink-0">✓</span>
                {item}
              </li>
            ))}
          </ul>
          <a
            href="/conta"
            className="block w-full rounded-xl border border-slate-700 py-2.5 text-center text-sm font-bold text-slate-300 hover:border-emerald-500/50 hover:text-emerald-300 transition"
          >
            Assinar — R$ 15/mês
          </a>
        </div>

        {/* Equipe com slider */}
        <div className="rounded-2xl border border-emerald-500/50 bg-emerald-500/5 p-5 space-y-5">
          <div className="flex items-start justify-between">
            <div>
              <span className="inline-block rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-bold text-emerald-300 mb-2">
                Melhor custo-benefício
              </span>
              <p className="text-xs text-slate-500 uppercase tracking-wide">Pro Equipe</p>
              <div className="flex items-end gap-3 mt-1">
                <p className="text-3xl font-extrabold text-white">
                  {fmt(total)}
                  <span className="text-sm font-normal text-slate-400 ml-1">/ mês</span>
                </p>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {fmt(porPessoa)}/pessoa
                {usuarios > 1 && (
                  <span className="ml-2 line-through text-slate-600">R$ 15,00</span>
                )}
                {economia > 0 && (
                  <span className="ml-2 text-emerald-400 font-semibold">
                    economia de {fmt(economia)}/mês
                  </span>
                )}
              </p>
            </div>
            <span className="text-3xl">🏢</span>
          </div>

          {/* Slider */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-400">Número de usuários</p>
              <span className="rounded-lg bg-slate-800 px-3 py-1 text-sm font-bold text-emerald-300">
                {usuarios} {usuarios === 1 ? "usuário" : "usuários"}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={OPCOES_USUARIOS.length - 1}
              step={1}
              value={sliderIdx}
              onChange={(e) => setSliderIdx(Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
            <div className="flex justify-between text-xs text-slate-600">
              {OPCOES_USUARIOS.map((n) => (
                <span key={n}>{n}</span>
              ))}
            </div>
          </div>

          <ul className="space-y-2">
            {[
              "Tudo do plano individual",
              `Até ${usuarios} ${usuarios === 1 ? "usuário" : "usuários"}`,
              "Painel de gestão de equipe",
              "Relatório de custos por motorista",
              "Suporte prioritário",
            ].map((item) => (
              <li key={item} className="flex items-center gap-2 text-sm text-slate-300">
                <span className="text-emerald-400 shrink-0">✓</span>
                {item}
              </li>
            ))}
          </ul>

          <a
            href="/conta"
            className="block w-full rounded-xl bg-emerald-500 py-3 text-center text-sm font-bold text-white hover:bg-emerald-400 transition shadow-lg shadow-emerald-500/20"
          >
            Assinar — {fmt(total)}/mês
          </a>
        </div>

        {/* Tabela de referência */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-800">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
              Tabela de preços — plano equipe
            </p>
          </div>
          <div className="divide-y divide-slate-800">
            {OPCOES_USUARIOS.map((n) => {
              const p = calcularPreco(n);
              const selecionado = n === usuarios;
              return (
                <button
                  key={n}
                  onClick={() => setSliderIdx(OPCOES_USUARIOS.indexOf(n))}
                  className={`w-full flex items-center justify-between px-4 py-2.5 transition text-left ${
                    selecionado ? "bg-emerald-500/10" : "hover:bg-slate-800/40"
                  }`}
                >
                  <span className={`text-sm ${selecionado ? "text-emerald-300 font-semibold" : "text-slate-400"}`}>
                    {n} {n === 1 ? "usuário" : "usuários"}
                  </span>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-slate-600">{fmt(p.porPessoa)}/pessoa</span>
                    {p.economia > 0 && (
                      <span className="text-xs text-emerald-500 font-medium">-{fmt(p.economia)}</span>
                    )}
                    <span className={`text-sm font-bold ${selecionado ? "text-emerald-300" : "text-slate-300"}`}>
                      {fmt(p.total)}/mês
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── CTA FINAL ── */}
      <div className="relative rounded-3xl overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1519003722824-194d4455a60c?w=900&q=80"
          alt="Rodovia à noite"
          className="w-full h-48 object-cover"
        />
        <div className="absolute inset-0 bg-slate-950/80" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 space-y-4">
          <h2 className="text-xl font-extrabold text-white">
            Pronto para rodar com mais controle?
          </h2>
          <p className="text-slate-400 text-sm">
            Junte-se a motoristas e transportadores que já usam o RotasPro.
          </p>
          <a
            href="/conta"
            className="rounded-2xl bg-emerald-500 px-8 py-3 text-sm font-bold text-white hover:bg-emerald-400 transition shadow-lg shadow-emerald-500/30"
          >
            Assinar agora — R$ 15/mês →
          </a>
          <p className="text-xs text-slate-600">Sem fidelidade · Cancele quando quiser</p>
        </div>
      </div>

    </div>
  );
}
