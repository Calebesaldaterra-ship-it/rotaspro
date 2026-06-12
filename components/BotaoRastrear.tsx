"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  origemLabel?: string;
  destinoLabel?: string;
  disabled?: boolean;
};

type Estado = "idle" | "criando" | "rastreando" | "erro";

export default function BotaoRastrear({ origemLabel, destinoLabel, disabled }: Props) {
  const [estado, setEstado] = useState<Estado>("idle");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const watchRef = useRef<number | null>(null);

  // limpa ao desmontar
  useEffect(() => {
    return () => {
      pararRastreamento();
    };
  }, []);

  function pararRastreamento() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (watchRef.current !== null) navigator.geolocation.clearWatch(watchRef.current);
    intervalRef.current = null;
    watchRef.current = null;
  }

  async function iniciar() {
    if (!navigator.geolocation) {
      alert("Seu dispositivo não suporta GPS.");
      return;
    }

    setEstado("criando");

    try {
      // cria sessão no servidor
      const res = await fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ origemLabel, destinoLabel }),
      });
      if (!res.ok) throw new Error("Falha ao criar sessão");
      const { id } = await res.json();
      setSessionId(id);
      setEstado("rastreando");

      // envia posição a cada 10s
      const enviarPosicao = (pos: GeolocationPosition) => {
        const { latitude, longitude, accuracy, speed, heading } = pos.coords;
        fetch(`/api/track/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lat: latitude,
            lon: longitude,
            accuracy,
            speed: speed ? speed * 3.6 : null, // m/s → km/h
            heading,
          }),
        }).catch(console.error);
      };

      // primeira posição imediatamente
      navigator.geolocation.getCurrentPosition(enviarPosicao, console.error, {
        enableHighAccuracy: true,
        timeout: 10000,
      });

      // atualiza a cada 10s via watchPosition
      watchRef.current = navigator.geolocation.watchPosition(
        enviarPosicao,
        console.error,
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
      );
    } catch {
      setEstado("erro");
    }
  }

  async function parar() {
    pararRastreamento();
    if (sessionId) {
      await fetch(`/api/track/${sessionId}`, { method: "DELETE" }).catch(console.error);
    }
    setSessionId(null);
    setEstado("idle");
  }

  const shareUrl = sessionId
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/track/${sessionId}`
    : null;

  async function copiarLink() {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      prompt("Copie o link abaixo:", shareUrl);
    }
  }

  function compartilharWhatsApp() {
    if (!shareUrl) return;
    const texto = `Estou rastreando minha rota ao vivo pelo RotasPro. Acompanhe aqui: ${shareUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, "_blank");
  }

  if (estado === "rastreando" && shareUrl) {
    return (
      <div className="mt-3 rounded-xl border border-emerald-500/40 bg-emerald-500/5 p-3 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-sm font-semibold text-emerald-200">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            Rastreamento ativo
          </span>
          <button
            onClick={parar}
            className="text-xs text-red-400 hover:text-red-300 border border-red-500/30 rounded-lg px-2 py-1"
          >
            Parar
          </button>
        </div>
        <p className="text-xs text-slate-400">
          Compartilhe este link para que acompanhem sua rota:
        </p>
        <div className="flex gap-1.5">
          <input
            readOnly
            value={shareUrl}
            className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-slate-300 outline-none truncate"
          />
          <button
            onClick={copiarLink}
            className="shrink-0 rounded-lg border border-slate-700 px-2.5 py-1.5 text-xs text-slate-300 hover:border-slate-500 transition"
          >
            {copiado ? "✓" : "Copiar"}
          </button>
        </div>
        <button
          onClick={compartilharWhatsApp}
          className="w-full rounded-xl bg-emerald-600 py-2 text-sm font-bold text-white hover:bg-emerald-500 transition"
        >
          Compartilhar via WhatsApp
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={iniciar}
      disabled={disabled || estado === "criando"}
      className="mt-3 w-full rounded-xl border border-slate-700 py-2.5 text-sm font-semibold text-slate-300 transition hover:border-emerald-500/60 hover:text-emerald-300 disabled:opacity-40 disabled:cursor-not-allowed"
    >
      {estado === "criando"
        ? "Ativando GPS…"
        : estado === "erro"
          ? "Erro — tentar novamente"
          : "📍 Compartilhar rota ao vivo"}
    </button>
  );
}
