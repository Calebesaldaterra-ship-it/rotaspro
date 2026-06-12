import type { LatLng } from "./types";

const R = 6371; // km

export function haversineKm(a: LatLng, b: LatLng): number {
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const la1 = (a.lat * Math.PI) / 180;
  const la2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/**
 * Distância (km) de um ponto a um segmento, em projeção equiretangular local —
 * precisa o suficiente para segmentos curtos de rodovia.
 */
export function pointToSegmentKm(p: LatLng, a: LatLng, b: LatLng): number {
  const cos = Math.cos((p.lat * Math.PI) / 180);
  const ax = a.lon * cos, ay = a.lat;
  const bx = b.lon * cos, by = b.lat;
  const px = p.lon * cos, py = p.lat;
  const dx = bx - ax, dy = by - ay;
  const len2 = dx * dx + dy * dy;
  let t = len2 === 0 ? 0 : ((px - ax) * dx + (py - ay) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const qx = ax + t * dx, qy = ay + t * dy;
  const degDist = Math.sqrt((px - qx) ** 2 + (py - qy) ** 2);
  return degDist * 111.32; // graus -> km
}

/** Decodifica polyline do OSRM (precision 5) para [lon, lat][]. */
export function decodePolyline(str: string): [number, number][] {
  let index = 0, lat = 0, lng = 0;
  const coords: [number, number][] = [];
  while (index < str.length) {
    for (const which of [0, 1] as const) {
      let result = 0, shift = 0, byte = 0x20;
      while (byte >= 0x20) {
        byte = str.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      }
      const delta = result & 1 ? ~(result >> 1) : result >> 1;
      if (which === 0) lat += delta;
      else lng += delta;
    }
    coords.push([lng / 1e5, lat / 1e5]);
  }
  return coords;
}
