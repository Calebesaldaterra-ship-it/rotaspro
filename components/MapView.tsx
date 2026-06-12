"use client";

import { useEffect, useRef } from "react";
import maplibregl, { Map as MlMap, Marker } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { LatLng, RouteAlternative } from "@/lib/types";

const ALT_COLORS = ["#fbbf24", "#64748b", "#475569"];

export default function MapView({
  pontos,
  alternativas,
  selecionada,
  onSelect,
}: {
  pontos: (LatLng & { label?: string })[];
  alternativas: RouteAlternative[];
  selecionada: number;
  onSelect: (i: number) => void;
}) {
  const div = useRef<HTMLDivElement>(null);
  const map = useRef<MlMap | null>(null);
  const markers = useRef<Marker[]>([]);
  const lastBounds = useRef<maplibregl.LngLatBounds | null>(null);

  useEffect(() => {
    if (!div.current || map.current) return;
    map.current = new maplibregl.Map({
      container: div.current,
      style: {
        version: 8,
        sources: {
          osm: {
            type: "raster",
            tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
            tileSize: 256,
            attribution: "© OpenStreetMap",
          },
        },
        layers: [
          { id: "osm", type: "raster", source: "osm" },
        ],
      },
      center: [-47.9, -15.8],
      zoom: 3.6,
      attributionControl: { compact: true },
    });
    map.current.addControl(new maplibregl.NavigationControl(), "top-right");
    // reenquadra a rota quando o contêiner muda de tamanho (rotação, resize)
    const ro = new ResizeObserver(() => {
      map.current?.resize();
      if (lastBounds.current) {
        map.current?.fitBounds(lastBounds.current, { padding: 60, duration: 0 });
      }
    });
    ro.observe(div.current);
    return () => {
      ro.disconnect();
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // desenha rotas + marcadores
  useEffect(() => {
    const m = map.current;
    if (!m) return;

    const draw = () => {
      // limpa camadas anteriores
      for (let i = 0; i < 3; i++) {
        if (m.getLayer(`rota-${i}`)) m.removeLayer(`rota-${i}`);
        if (m.getSource(`rota-${i}`)) m.removeSource(`rota-${i}`);
      }
      markers.current.forEach((mk) => mk.remove());
      markers.current = [];

      // alternativas não selecionadas primeiro (ficam por baixo)
      const ordem = alternativas
        .map((_, i) => i)
        .sort((a, b) => (a === selecionada ? 1 : 0) - (b === selecionada ? 1 : 0));

      for (const i of ordem) {
        const alt = alternativas[i];
        const sel = i === selecionada;
        m.addSource(`rota-${i}`, {
          type: "geojson",
          data: {
            type: "Feature",
            properties: {},
            geometry: { type: "LineString", coordinates: alt.geometry },
          },
        });
        m.addLayer({
          id: `rota-${i}`,
          type: "line",
          source: `rota-${i}`,
          layout: { "line-cap": "round", "line-join": "round" },
          paint: {
            "line-color": sel ? ALT_COLORS[0] : ALT_COLORS[1],
            "line-width": sel ? 5.5 : 3.5,
            "line-opacity": sel ? 0.95 : 0.55,
          },
        });
        m.on("click", `rota-${i}`, () => onSelect(i));
      }

      // marcadores origem/paradas/destino
      pontos.forEach((p, idx) => {
        const el = document.createElement("div");
        const last = idx === pontos.length - 1;
        el.className = "rp-marker";
        el.style.cssText =
          "width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;" +
          "font:700 12px system-ui;color:#0f172a;border:2.5px solid #0f172a;box-shadow:0 2px 6px rgba(0,0,0,.5);" +
          `background:${last ? "#34d399" : idx === 0 ? "#fbbf24" : "#e2e8f0"}`;
        el.textContent = idx === 0 ? "A" : last ? "B" : String(idx);
        markers.current.push(
          new maplibregl.Marker({ element: el }).setLngLat([p.lon, p.lat]).addTo(m),
        );
      });

      // pedágios da rota selecionada
      const alt = alternativas[selecionada];
      if (alt) {
        for (const ped of alt.pedagios) {
          const el = document.createElement("div");
          el.style.cssText =
            "width:18px;height:18px;border-radius:5px;background:#f87171;border:2px solid #7f1d1d;" +
            "display:flex;align-items:center;justify-content:center;font:700 10px system-ui;color:#fff;cursor:pointer;";
          el.textContent = "$";
          const mk = new maplibregl.Marker({ element: el })
            .setLngLat([ped.lon, ped.lat])
            .setPopup(
              new maplibregl.Popup({ offset: 12, closeButton: false }).setHTML(
                `<div style="font:13px system-ui;color:#0f172a">
                   <b>${ped.name}</b><br/>${ped.rodovia || ped.concessionaria}<br/>
                   <b>R$ ${ped.custo.toFixed(2)}</b>${ped.estimada ? " (estimado)" : ""}
                 </div>`,
              ),
            )
            .addTo(m);
          markers.current.push(mk);
        }
        // enquadra a rota
        const b = new maplibregl.LngLatBounds();
        alt.geometry.forEach((c) => b.extend(c as [number, number]));
        lastBounds.current = b;
        m.fitBounds(b, { padding: 60, duration: 600 });
      } else if (pontos.length > 0) {
        const b = new maplibregl.LngLatBounds();
        pontos.forEach((p) => b.extend([p.lon, p.lat]));
        if (pontos.length === 1) m.flyTo({ center: [pontos[0].lon, pontos[0].lat], zoom: 10 });
        else m.fitBounds(b, { padding: 80, duration: 600 });
      }
    };

    if (m.isStyleLoaded()) draw();
    else m.once("load", draw);
  }, [pontos, alternativas, selecionada, onSelect]);

  return <div ref={div} className="h-full w-full" />;
}
