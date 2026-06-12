"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { getSupabase } from "@/lib/supabase";
import dynamic from "next/dynamic";

const MapTracking = dynamic(() => import("@/components/MapTracking"), { ssr: false });

type Sessao = {
  id: string;
  origem_label: string | null;
  destino_label: string | null;
  lat: number | null;
  lon: number | null;
  accuracy: number | null;
  speed: number | null;
  heading: number | null;
  updated_at: string | null;
  is_active: boolean;
};

function tempoAtras(iso: string | null): string {
  if (!iso) return "—";
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 10) return "agora mesmo";
  if (diff < 60) return `${diff}s atrás`;
  if (diff < 3600) return `${Math.floor(diff / 60)}min atrás`;
  return `${Math.floor(diff / 3600)}h atrás`;
}

export default function TrackPage() {
  const { id } = useParams<{ id: string }>();
  const [sessao, setSessao] = useState<Sessao | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const channelRef = useRef<any>(null);

  // atualiza o "X atrás" a cada 5s
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 5000);
    return () => clearInterval(t);
  }, []);

  // busca inicial + subscribe Realtime
  useEffect(() => {
    if (!id) return;
    const sb = getSupabase();
    if (!sb) { setErro("Supabase não configurado"); return; }

    // busca inicial
    sb.from("tracking_sessions")
      .select("*")
      .eq("id", id)
      .single()
      .then(({ data, error }) => {
        if (error || !data) { setErro("Rastreamento não encontrado."); return; }
        setSessao(data as Sessao);
      });

    // subscribe a mudanças em tempo real
    const channel = sb
      .channel(`track:${id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "tracking_sessions",
          filter: `id=eq.${id}`,
        },
        (payload) => {
          setSessao((prev) => ({ ...(prev ?? {}), ...payload.new } as Sessao));
        }
      )
      .subscribe();

    channelRef.current = channel;
    return () => { sb.removeChannel(channel); };
  }, [id]);

  if (erro) {
    return (
      <div className="flex h-dvh items-center justify-center bg-slate-950 text-center px-4">
        <div>
          <p className="text-4xl mb-3">🔍</p>
          <p className="text-slate-300 font-semibold">{erro}</p>
          <p className="mt-1 text-sm text-slate-500">
            O link pode ter expirado (válido por 24h) ou ser inválido.
          </p>
        </div>
      </div>
    );
  }

  if (!sessao) {
    return (
      <div className="flex h-dvh items-center justify-center bg-slate-950">
        <div className="text-slate-400 text-sm">Carregando rastreamento…</div>
      </div>
    );
  }

  const temPosicao = sessao.lat !== null && sessao.lon !== null;
  const velKmh = sessao.speed ? Math.round(sessao.speed) : null;

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
            <p className="text-[11px] text-slate-500">rastreamento ao vivo</p>
          </div>
        </div>
        {sessao.is_active ? (
          <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Ao vivo
          </span>
        ) : (
          <span className="rounded-full bg-slate-800 px-2.5 py-1 text-xs text-slate-500">
            Encerrado
          </span>
        )}
      </header>

      {/* info */}
      <div className="border-b border-slate-800 px-4 py-2.5 text-xs text-slate-400 flex flex-wrap gap-x-4 gap-y-1">
        {sessao.origem_label && (
          <span>🟢 <span className="text-slate-300">{sessao.origem_label}</span></span>
        )}
        {sessao.destino_label && (
          <span>🔴 <span className="text-slate-300">{sessao.destino_label}</span></span>
        )}
        {velKmh !== null && (
          <span>🚛 <span className="text-slate-300">{velKmh} km/h</span></span>
        )}
        <span key={tick} className="ml-auto">
          Atualizado: <span className="text-slate-300">{tempoAtras(sessao.updated_at)}</span>
        </span>
      </div>

      {/* mapa */}
      <div className="flex-1 relative">
        {temPosicao ? (
          <MapTracking
            lat={sessao.lat!}
            lon={sessao.lon!}
            heading={sessao.heading ?? undefined}
            accuracy={sessao.accuracy ?? undefined}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-center px-4">
            <div>
              <p className="text-4xl mb-3">📡</p>
              <p className="text-slate-300 font-semibold">Aguardando posição GPS…</p>
              <p className="mt-1 text-sm text-slate-500">
                O motorista ainda não enviou a localização.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
