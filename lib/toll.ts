import pracasData from "@/data/pracas.json";
import { haversineKm, pointToSegmentKm } from "./geo";
import type { Praca, TollHit, VehicleType } from "./types";

const pracas = pracasData as Praca[];

/** Distância máxima praça ↔ rota para considerar que a rota passa pela praça. */
const MATCH_KM = 0.15;

/**
 * Multiplicador sobre a tarifa de categoria 1, conforme o padrão das
 * concessões federais: moto paga 50%, carro 100%, veículos comerciais de
 * rodagem dupla pagam tarifa × nº de eixos.
 */
export function multiplicador(tipo: VehicleType, eixos: number): number {
  switch (tipo) {
    case "moto":
      return 0.5;
    case "carro":
      return 1;
    case "onibus":
    case "caminhao":
      return Math.max(2, Math.min(10, eixos));
  }
}

/**
 * Encontra as praças de pedágio atravessadas pela rota.
 * Estratégia: grade espacial pré-filtrada por bounding box + distância
 * ponto-segmento. Retorna na ordem em que aparecem na rota.
 */
export function pedagiosNaRota(
  geometry: [number, number][], // [lon, lat]
  tipo: VehicleType,
  eixos: number,
): TollHit[] {
  if (geometry.length < 2) return [];

  let minLat = 90, maxLat = -90, minLon = 180, maxLon = -180;
  for (const [lon, lat] of geometry) {
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
    if (lon < minLon) minLon = lon;
    if (lon > maxLon) maxLon = lon;
  }
  const pad = 0.05; // ~5 km
  const candidatas = pracas.filter(
    (p) =>
      p.lat >= minLat - pad && p.lat <= maxLat + pad &&
      p.lon >= minLon - pad && p.lon <= maxLon + pad,
  );
  if (candidatas.length === 0) return [];

  const mult = multiplicador(tipo, eixos);
  const hits: TollHit[] = [];

  // distância acumulada por vértice para ordenar os pedágios ao longo da rota
  const acum: number[] = [0];
  for (let i = 1; i < geometry.length; i++) {
    const a = { lon: geometry[i - 1][0], lat: geometry[i - 1][1] };
    const b = { lon: geometry[i][0], lat: geometry[i][1] };
    acum.push(acum[i - 1] + haversineKm(a, b));
  }

  for (const praca of candidatas) {
    const p = { lat: praca.lat, lon: praca.lon };
    let best = Infinity;
    let bestIdx = 0;
    for (let i = 1; i < geometry.length; i++) {
      const a = { lon: geometry[i - 1][0], lat: geometry[i - 1][1] };
      const b = { lon: geometry[i][0], lat: geometry[i][1] };
      // pré-filtro barato por vértice
      if (Math.abs(a.lat - p.lat) > 0.01 || Math.abs(a.lon - p.lon) > 0.012) continue;
      const d = pointToSegmentKm(p, a, b);
      if (d < best) {
        best = d;
        bestIdx = i;
      }
    }
    if (best <= MATCH_KM) {
      // pórtico direcional (free flow): só cobra se a viagem segue o rumo dele.
      // O nome Norte/Sul refere-se ao sentido do corredor, então compara com o
      // azimute global da viagem, não com a curva local da pista.
      if (praca.rumo != null && !mesmaDirecao(geometry, praca.rumo)) continue;
      hits.push({
        ...praca,
        custo: Math.round(praca.tarifa * mult * 100) / 100,
        distKm: Math.round(acum[bestIdx] * 10) / 10,
      });
    }
  }

  hits.sort((a, b) => a.distKm - b.distKm);
  return dedupeParesDirecionais(hits);
}

/** Azimute (graus) da viagem inteira: do primeiro ao último ponto da rota. */
function bearingGlobal(geometry: [number, number][]): number {
  const [lon1, lat1] = geometry[0];
  const [lon2, lat2] = geometry[geometry.length - 1];
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const f1 = (lat1 * Math.PI) / 180;
  const f2 = (lat2 * Math.PI) / 180;
  const y = Math.sin(dLon) * Math.cos(f2);
  const x = Math.cos(f1) * Math.sin(f2) - Math.sin(f1) * Math.cos(f2) * Math.cos(dLon);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

function mesmaDirecao(geometry: [number, number][], rumo: number): boolean {
  const diff = Math.abs(((bearingGlobal(geometry) - rumo + 540) % 360) - 180);
  return diff <= 90; // diff é o desvio angular em relação ao rumo do pórtico
}

/**
 * Praças "gêmeas" — par direcional ou praça principal + bloqueio "(B)"
 * (ex.: P04/P05 Viúva Graça) — ficam a poucos km uma da outra e a viagem
 * paga só uma. Mantém a principal (sem "(B)") ou a primeira do par.
 */
function dedupeParesDirecionais(hits: TollHit[]): TollHit[] {
  const core = (s: string) =>
    s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/\(.*?\)|p\d+|\d+|[^a-z]/g, "");
  const out: TollHit[] = [];
  for (const h of hits) {
    // pórticos free flow são todos cobráveis em sequência — nunca são gêmeos
    if (h.rumo != null) {
      out.push(h);
      continue;
    }
    const idx = out.findIndex(
      (o) =>
        o.rumo == null &&
        o.concessionaria === h.concessionaria &&
        core(o.name) !== "" &&
        core(o.name) === core(h.name) &&
        Math.abs(o.distKm - h.distKm) < 6,
    );
    if (idx === -1) {
      out.push(h);
    } else if (out[idx].name.includes("(B)") && !h.name.includes("(B)")) {
      out[idx] = h; // prefere a praça principal à de bloqueio
    }
  }
  return out;
}

export function todasPracas(): Praca[] {
  return pracas;
}
