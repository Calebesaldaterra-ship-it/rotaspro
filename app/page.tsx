"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import SearchInput, { type GeoResult } from "@/components/SearchInput";
import { getSupabase } from "@/lib/supabase";
import type { Combustivel, RouteResponse, VehicleType } from "@/lib/types";
import { TIPOS_CARGA, type TipoCarga } from "@/lib/freight";
import BotaoRastrear from "@/components/BotaoRastrear";

const MapView = dynamic(() => import("@/components/MapView"), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-slate-900" />,
});

type Ponto = GeoResult | null;

type Perfil = {
  id: string;
  nome: string;
  tipo: VehicleType;
  eixos: number;
  consumo: number;
  combustivel: Combustivel;
};

type FreteResp = {
  piso: number;
  ccd: number;
  cc: number;
  eixosUsados: number;
  tipoCarga: TipoCarga;
  observacao: string;
} | null;

const TIPOS: { id: VehicleType; nome: string; icone: string }[] = [
  { id: "carro", nome: "Carro", icone: "🚗" },
  { id: "moto", nome: "Moto", icone: "🏍️" },
  { id: "caminhao", nome: "Caminhão", icone: "🚚" },
  { id: "onibus", nome: "Ônibus", icone: "🚌" },
];

const COMBUSTIVEIS: { id: Combustivel; nome: string }[] = [
  { id: "gasolina", nome: "Gasolina" },
  { id: "etanol", nome: "Etanol" },
  { id: "diesel", nome: "Diesel" },
  { id: "gnv", nome: "GNV" },
];

const CONSUMO_PADRAO: Record<VehicleType, number> = {
  moto: 25, carro: 11.5, onibus: 3.2, caminhao: 2.8,
};

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function Home() {
  const [origem, setOrigem] = useState<Ponto>(null);
  const [destino, setDestino] = useState<Ponto>(null);
  const [paradas, setParadas] = useState<Ponto[]>([]);

  const [tipo, setTipo] = useState<VehicleType>("carro");
  const [eixos, setEixos] = useState(5);
  const [consumo, setConsumo] = useState(CONSUMO_PADRAO.carro);
  const [combustivel, setCombustivel] = useState<Combustivel>("gasolina");
  const [preco, setPreco] = useState(6.19);
  const [precoEditado, setPrecoEditado] = useState(false);

  const [tipoCarga, setTipoCarga] = useState<TipoCarga>("geral");
  const [retornoVazio, setRetornoVazio] = useState(false);

  const [resultado, setResultado] = useState<RouteResponse | null>(null);
  const [frete, setFrete] = useState<FreteResp>(null);
  const [selecionada, setSelecionada] = useState(0);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [paywall, setPaywall] = useState(false);
  const [usosRestantes, setUsosRestantes] = useState<number | null>(null);

  const [perfis, setPerfis] = useState<Perfil[]>([]);
  const [nomePerfil, setNomePerfil] = useState("");

  // perfis salvos
  useEffect(() => {
    try {
      const raw = localStorage.getItem("rotaspro:perfis");
      if (raw) setPerfis(JSON.parse(raw));
    } catch {}
  }, []);
  const salvarPerfis = (p: Perfil[]) => {
    setPerfis(p);
    localStorage.setItem("rotaspro:perfis", JSON.stringify(p));
  };

  // preço automático pela UF de origem
  useEffect(() => {
    if (precoEditado) return;
    const uf = origem?.uf ?? "";
    fetch(`/api/combustivel?uf=${uf}`)
      .then((r) => r.json())
      .then((d) => setPreco(d.precos[combustivel] ?? 6.19))
      .catch((err) => { console.warn("Falha ao atualizar preço do combustível:", err); });
  }, [origem?.uf, combustivel, precoEditado]);

  const pontosMapa = useMemo(
    () =>
      [origem, ...paradas, destino]
        .filter((p): p is GeoResult => p !== null)
        .map((p) => ({ lat: p.lat, lon: p.lon, label: p.label })),
    [origem, paradas, destino],
  );

  async function calcular() {
    if (!origem || !destino) {
      setErro("Informe origem e destino.");
      return;
    }
    setCarregando(true);
    setErro(null);
    setPaywall(false);
    try {
      // se logado, envia o token para liberar uso ilimitado do assinante
      const supabase = getSupabase();
      const token = supabase
        ? (await supabase.auth.getSession()).data.session?.access_token
        : undefined;
      const res = await fetch("/api/rota", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          pontos: [origem, ...paradas.filter(Boolean), destino].map((p) => ({
            lat: p!.lat,
            lon: p!.lon,
          })),
          tipo,
          eixos: tipo === "carro" || tipo === "moto" ? 2 : eixos,
          consumo,
          combustivel,
          precoCombustivel: preco,
          ufOrigem: origem.uf ?? undefined,
          frete: tipo === "caminhao" ? { tipoCarga, retornoVazio } : undefined,
        }),
      });
      const data = await res.json();
      if (res.status === 402) {
        setPaywall(true);
        setResultado(null);
        return;
      }
      if (!res.ok) throw new Error(data.erro ?? "Erro ao calcular.");
      setResultado(data);
      setFrete(data.frete ?? null);
      setUsosRestantes(data.usosRestantes ?? null);
      setSelecionada(0);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro inesperado.");
      setResultado(null);
    } finally {
      setCarregando(false);
    }
  }

  const onSelectAlt = useCallback((i: number) => setSelecionada(i), []);

  const alt = resultado?.alternativas[selecionada];

  return (
    <div className="flex h-dvh flex-col bg-slate-950 text-slate-100">
      {/* header */}
      <header className="flex items-center justify-between border-b border-slate-800 px-4 py-2.5">
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-amber-400 text-base font-black text-slate-950">
            R
          </span>
          <div>
            <h1 className="text-base font-bold leading-none">
              Rotas<span className="text-amber-400">Pro</span>
            </h1>
            <p className="text-[11px] text-slate-500">
              rota · pedágio · combustível · frete
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Link
            href="/conta"
            className="rounded-lg bg-amber-400 px-3 py-1.5 text-xs font-bold text-slate-950 hover:bg-amber-300"
          >
            Assinar · R$ 15/mês
          </Link>
          <a
            href="/docs"
            className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:border-amber-400/60 hover:text-amber-300"
          >
            API
          </a>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        {/* painel */}
        <aside className="order-2 w-full overflow-y-auto border-t border-slate-800 p-4 md:order-1 md:w-[400px] md:border-r md:border-t-0">
          {/* pontos */}
          <div className="space-y-2.5">
            <SearchInput
              placeholder="Origem — cidade ou endereço"
              value={origem?.label ?? ""}
              onSelect={setOrigem}
              onClear={() => setOrigem(null)}
            />
            {paradas.map((p, i) => (
              <div key={i} className="flex gap-2">
                <div className="flex-1">
                  <SearchInput
                    placeholder={`Parada ${i + 1}`}
                    value={p?.label ?? ""}
                    onSelect={(r) =>
                      setParadas((ps) => ps.map((x, j) => (j === i ? r : x)))
                    }
                  />
                </div>
                <button
                  onClick={() => setParadas((ps) => ps.filter((_, j) => j !== i))}
                  className="rounded-lg border border-slate-700 px-2.5 text-slate-400 hover:border-red-400/60 hover:text-red-300"
                  aria-label="Remover parada"
                >
                  −
                </button>
              </div>
            ))}
            <SearchInput
              placeholder="Destino"
              value={destino?.label ?? ""}
              onSelect={setDestino}
              onClear={() => setDestino(null)}
            />
            <button
              onClick={() => setParadas((p) => [...p, null])}
              className="text-xs text-amber-300/90 hover:text-amber-200"
            >
              + adicionar parada
            </button>
          </div>

          {/* veículo */}
          <div className="mt-5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Veículo
            </p>
            <div className="grid grid-cols-4 gap-1.5">
              {TIPOS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    setTipo(t.id);
                    setConsumo(CONSUMO_PADRAO[t.id]);
                    setCombustivel(
                      t.id === "caminhao" || t.id === "onibus" ? "diesel" : "gasolina",
                    );
                    setPrecoEditado(false);
                  }}
                  className={`rounded-xl border px-1 py-2 text-center text-xs transition ${
                    tipo === t.id
                      ? "border-amber-400 bg-amber-400/10 text-amber-200"
                      : "border-slate-700 text-slate-400 hover:border-slate-500"
                  }`}
                >
                  <span className="block text-lg">{t.icone}</span>
                  {t.nome}
                </button>
              ))}
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2.5">
              {(tipo === "caminhao" || tipo === "onibus") && (
                <label className="text-xs text-slate-400">
                  Eixos
                  <select
                    value={eixos}
                    onChange={(e) => setEixos(Number(e.target.value))}
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-2 text-sm text-slate-100"
                  >
                    {[2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                      <option key={n} value={n}>
                        {n} eixos
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <label className="text-xs text-slate-400">
                Consumo (km/l)
                <input
                  type="number"
                  step="0.1"
                  min="0.5"
                  value={consumo}
                  onChange={(e) => setConsumo(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-2 text-sm text-slate-100"
                />
              </label>
              <label className="text-xs text-slate-400">
                Combustível
                <select
                  value={combustivel}
                  onChange={(e) => {
                    setCombustivel(e.target.value as Combustivel);
                    setPrecoEditado(false);
                  }}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-2 text-sm text-slate-100"
                >
                  {COMBUSTIVEIS.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs text-slate-400">
                Preço (R$/l)
                <input
                  type="number"
                  step="0.01"
                  value={preco}
                  onChange={(e) => {
                    setPreco(Number(e.target.value));
                    setPrecoEditado(true);
                  }}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-2 text-sm text-slate-100"
                />
              </label>
            </div>

            {/* frete (caminhão) */}
            {tipo === "caminhao" && (
              <div className="mt-3 rounded-xl border border-slate-800 bg-slate-900/50 p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Frete mínimo (ANTT)
                </p>
                <div className="grid grid-cols-2 items-end gap-2.5">
                  <label className="text-xs text-slate-400">
                    Tipo de carga
                    <select
                      value={tipoCarga}
                      onChange={(e) => setTipoCarga(e.target.value as TipoCarga)}
                      className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-2 text-sm text-slate-100"
                    >
                      {TIPOS_CARGA.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.nome}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex items-center gap-2 pb-2 text-xs text-slate-300">
                    <input
                      type="checkbox"
                      checked={retornoVazio}
                      onChange={(e) => setRetornoVazio(e.target.checked)}
                      className="accent-amber-400"
                    />
                    Retorno vazio
                  </label>
                </div>
              </div>
            )}

            {/* perfis */}
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              {perfis.map((p) => (
                <span
                  key={p.id}
                  className="group flex items-center gap-1 rounded-full border border-slate-700 bg-slate-900 pl-2.5 text-xs text-slate-300"
                >
                  <button
                    onClick={() => {
                      setTipo(p.tipo);
                      setEixos(p.eixos);
                      setConsumo(p.consumo);
                      setCombustivel(p.combustivel);
                      setPrecoEditado(false);
                    }}
                    className="py-1 hover:text-amber-300"
                  >
                    {p.nome}
                  </button>
                  <button
                    onClick={() => salvarPerfis(perfis.filter((x) => x.id !== p.id))}
                    className="px-1.5 py-1 text-slate-600 hover:text-red-400"
                    aria-label={`Excluir perfil ${p.nome}`}
                  >
                    ×
                  </button>
                </span>
              ))}
              <input
                value={nomePerfil}
                onChange={(e) => setNomePerfil(e.target.value)}
                placeholder="salvar veículo como…"
                className="w-36 rounded-full border border-dashed border-slate-700 bg-transparent px-2.5 py-1 text-xs text-slate-300 placeholder-slate-600 outline-none focus:border-amber-400/60"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && nomePerfil.trim()) {
                    salvarPerfis([
                      ...perfis,
                      {
                        id: crypto.randomUUID(),
                        nome: nomePerfil.trim(),
                        tipo, eixos, consumo, combustivel,
                      },
                    ]);
                    setNomePerfil("");
                  }
                }}
              />
            </div>
          </div>

          <button
            onClick={calcular}
            disabled={carregando || !origem || !destino}
            className="mt-4 w-full rounded-xl bg-amber-400 py-3 text-sm font-bold text-slate-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {carregando ? "Calculando…" : "Calcular rota"}
          </button>

          <BotaoRastrear
            origemLabel={origem?.label}
            destinoLabel={destino?.label}
          />

          {erro && (
            <p className="mt-3 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {erro}
            </p>
          )}

          {paywall && (
            <div className="mt-3 rounded-2xl border border-amber-400/50 bg-amber-400/10 p-4 text-center">
              <p className="text-sm font-bold text-amber-200">
                Seus cálculos grátis de hoje acabaram 🛣️
              </p>
              <p className="mt-1 text-xs text-slate-300">
                Assine o RotasPro e calcule rotas, pedágios e fretes sem limite.
              </p>
              <Link
                href="/conta"
                className="mt-3 inline-block rounded-xl bg-amber-400 px-5 py-2.5 text-sm font-bold text-slate-950 hover:bg-amber-300"
              >
                Assinar — R$ 15/mês
              </Link>
              <p className="mt-2 text-[11px] text-slate-500">
                Já é assinante? <Link href="/conta" className="underline">Entre na sua conta</Link>.
              </p>
            </div>
          )}

          {usosRestantes !== null && !paywall && resultado && (
            <p className="mt-2 text-center text-[11px] text-slate-500">
              {usosRestantes > 0
                ? `${usosRestantes} cálculo${usosRestantes > 1 ? "s" : ""} grátis restante${usosRestantes > 1 ? "s" : ""} hoje · `
                : "Último cálculo grátis de hoje · "}
              <Link href="/conta" className="text-amber-300/90 underline">
                assine por R$ 15/mês
              </Link>
            </p>
          )}

          {/* resultados */}
          {resultado && (
            <div className="mt-5 space-y-2.5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                {resultado.alternativas.length > 1 ? "Compare as rotas" : "Resultado"}
              </p>
              {resultado.alternativas.map((a, i) => {
                const sel = i === selecionada;
                const maisBarata =
                  resultado.alternativas.length > 1 &&
                  a.custoTotal ===
                    Math.min(...resultado.alternativas.map((x) => x.custoTotal));
                const maisRapida =
                  resultado.alternativas.length > 1 &&
                  a.duracaoMin ===
                    Math.min(...resultado.alternativas.map((x) => x.duracaoMin));
                return (
                  <button
                    key={i}
                    onClick={() => setSelecionada(i)}
                    className={`w-full rounded-xl border p-3 text-left transition ${
                      sel
                        ? "border-amber-400 bg-amber-400/10"
                        : "border-slate-800 bg-slate-900/50 hover:border-slate-600"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold">
                        Rota {i + 1}
                        {maisBarata && (
                          <span className="ml-2 rounded-full bg-emerald-400/15 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                            MAIS BARATA
                          </span>
                        )}
                        {maisRapida && (
                          <span className="ml-1.5 rounded-full bg-sky-400/15 px-2 py-0.5 text-[10px] font-bold text-sky-300">
                            MAIS RÁPIDA
                          </span>
                        )}
                      </span>
                      <span className="text-base font-bold text-amber-300">
                        {fmt(a.custoTotal)}
                      </span>
                    </div>
                    <div className="mt-1.5 grid grid-cols-4 gap-1 text-[11px] text-slate-400">
                      <span>{a.distanciaKm.toLocaleString("pt-BR")} km</span>
                      <span>
                        {Math.floor(a.duracaoMin / 60)}h
                        {String(a.duracaoMin % 60).padStart(2, "0")}
                      </span>
                      <span title="pedágios">🛂 {fmt(a.custoPedagio)}</span>
                      <span title="combustível">⛽ {fmt(a.custoCombustivel)}</span>
                    </div>
                  </button>
                );
              })}

              {/* frete */}
              {frete && alt && (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-emerald-200">
                      Piso mínimo de frete
                    </span>
                    <span className="text-base font-bold text-emerald-300">
                      {fmt(frete.piso)}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] leading-snug text-slate-400">
                    Tabela A · {TIPOS_CARGA.find((t) => t.id === frete.tipoCarga)?.nome} ·{" "}
                    {frete.eixosUsados} eixos · CCD {fmt(frete.ccd)}/km + CC {fmt(frete.cc)}
                    {retornoVazio ? " + retorno vazio" : ""}. {frete.observacao}
                  </p>
                </div>
              )}

              {/* pedágios da rota selecionada */}
              {alt && alt.pedagios.length > 0 && (
                <details
                  className="rounded-xl border border-slate-800 bg-slate-900/50 p-3"
                  open
                >
                  <summary className="cursor-pointer text-sm font-semibold text-slate-200">
                    Pedágios ({alt.pedagios.length}) — {fmt(alt.custoPedagio)}
                  </summary>
                  <ul className="mt-2 space-y-1.5">
                    {alt.pedagios.map((p, i) => (
                      <li
                        key={i}
                        className="flex items-baseline justify-between gap-2 text-xs"
                      >
                        <span className="text-slate-300">
                          <span className="text-slate-500">km {p.distKm} ·</span> {p.name}
                          {p.rodovia && (
                            <span className="text-slate-500"> · {p.rodovia}</span>
                          )}
                          {p.estimada && (
                            <span
                              className="ml-1 text-amber-400/80"
                              title="tarifa estimada"
                            >
                              ~
                            </span>
                          )}
                        </span>
                        <span className="shrink-0 font-semibold text-slate-200">
                          {fmt(p.custo)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </details>
              )}
              {alt && alt.pedagios.length === 0 && (
                <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-3 py-2 text-xs text-emerald-300">
                  Nenhum pedágio detectado nesta rota. 🎉
                </p>
              )}

              {resultado.avisos.length > 0 && (
                <ul className="space-y-1 pt-1">
                  {resultado.avisos.map((a, i) => (
                    <li key={i} className="text-[11px] leading-snug text-slate-500">
                      ⓘ {a}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </aside>

        {/* mapa */}
        <main className="order-1 h-[42dvh] min-h-[260px] flex-1 md:order-2 md:h-auto">
          <MapView
            pontos={pontosMapa}
            alternativas={resultado?.alternativas ?? []}
            selecionada={selecionada}
            onSelect={onSelectAlt}
          />
        </main>
      </div>
    </div>
  );
}
