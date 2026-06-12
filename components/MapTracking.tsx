"use client";

import { useEffect, useRef } from "react";
import maplibregl, { Map as MlMap, Marker } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

export default function MapTracking({
  lat,
  lon,
  heading,
}: {
  lat: number;
  lon: number;
  heading?: number;
  accuracy?: number;
}) {
  const div = useRef<HTMLDivElement>(null);
  const map = useRef<MlMap | null>(null);
  const marker = useRef<Marker | null>(null);
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
      initialized.current = false;
    };
  }, []);

  // Atualiza posição do marcador
  useEffect(() => {
    const m = map.current;
    if (!m) return;

    const lngLat: [number, number] = [lon, lat];

    if (!marker.current) {
      const el = document.createElement("div");
      el.style.cssText = `
        width: 40px; height: 40px;
        background: #fbbf24;
        border: 3px solid #fff;
        border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        font-size: 20px;
        box-shadow: 0 2px 8px rgba(0,0,0,.5);
        cursor: default;
        transform-origin: center;
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
        marker.current.getElement().style.transform = `rotate(${heading}deg)`;
      }
    }

    if (!initialized.current) {
      m.flyTo({ center: lngLat, zoom: 14, duration: 1000 });
      initialized.current = true;
    } else {
      m.panTo(lngLat, { duration: 800 });
    }
  }, [lat, lon, heading]);

  return <div ref={div} className="w-full h-full" />;
}
