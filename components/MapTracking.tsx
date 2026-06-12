"use client";

import { useEffect, useRef } from "react";
import maplibregl, { Map as MlMap, Marker } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

export default function MapTracking({
  lat,
  lon,
  heading,
  accuracy,
}: {
  lat: number;
  lon: number;
  heading?: number;
  accuracy?: number;
}) {
  const div = useRef<HTMLDivElement>(null);
  const map = useRef<MlMap | null>(null);
  const marker = useRef<Marker | null>(null);
  const circle = useRef<boolean>(false);
  const initialized = useRef(false);

  // Inicializa mapa
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
        layers: [{ id: "osm", type: "raster", source: "osm" }],
      },
      center: [lon, lat],
      zoom: 13,
      attributionControl: { compact: true },
    });
    map.current.addControl(new maplibregl.NavigationControl(), "top-right");

    const ro = new ResizeObserver(() => map.current?.resize());
    ro.observe(div.current);
    return () => {
      ro.disconnect();
      map.current?.remove();
      map.current = null;
      marker.current = null;
      circle.current = false;
      initialized.current = false;
    };
  }, []);

  // Atualiza posição do marcador e círculo de precisão
  useEffect(() => {
    const m = map.current;
    if (!m) return;

    const lngLat: [number, number] = [lon, lat];

    if (!marker.current) {
      // cria marcador com ícone de caminhão
      const el = document.createElement("div");
      el.style.cssText = `
        width: 36px; height: 36px;
        background: #fbbf24;
        border: 3px solid #fff;
        border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        font-size: 18px;
        box-shadow: 0 2px 8px rgba(0,0,0,.5);
        cursor: default;
      `;
      el.textContent = "🚛";
      if (heading !== undefined) {
        el.style.transform = `rotate(${heading}deg)`;
      }
      marker.current = new maplibregl.Marker({ element: el })
        .setLngLat(lngLat)
        .addTo(m);
    } else {
      marker.current.setLngLat(lngLat);
      if (heading !== undefined) {
        const el = marker.current.getElement();
        el.style.transform = `rotate(${heading}deg)`;
      }
    }

    // círculo de precisão
    if (accuracy && accuracy > 0) {
      const srcId = "accuracy-circle";
      if (circle.current && m.getSource(srcId)) {
        (m.getSource(srcId) as maplibregl.GeoJSONSource).setData({
          type: "Feature",
          geometry: { type: "Point", coordinates: lngLat },
          properties: {},
        });
      } else if (!circle.current) {
        m.once("load", () => {
          if (!m.getSource(srcId)) {
            m.addSource(srcId, {
              type: "geojson",
              data: {
                type: "Feature",
                geometry: { type: "Point", coordinates: lngLat },
                properties: {},
              },
            });
            m.addLayer({
              id: srcId,
              type: "circle",
              source: srcId,
              paint: {
                "circle-radius": {
                  stops: [
                    [0, 0],
                    [20, accuracy / 0.075 / Math.cos((lat * Math.PI) / 180)],
                  ],
                  base: 2,
                },
                "circle-color": "#fbbf24",
                "circle-opacity": 0.15,
                "circle-stroke-width": 1,
                "circle-stroke-color": "#fbbf24",
                "circle-stroke-opacity": 0.4,
              },
            });
            circle.current = true;
          }
        });
      }
    }

    // centraliza no motorista
    if (!initialized.current) {
      m.flyTo({ center: lngLat, zoom: 14, duration: 1000 });
      initialized.current = true;
    } else {
      m.panTo(lngLat, { duration: 800 });
    }
  }, [lat, lon, heading, accuracy]);

  return <div ref={div} className="w-full h-full" />;
}
