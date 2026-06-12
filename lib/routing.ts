import combustiveis from "@/data/combustiveis.json";
import { decodePolyline } from "./geo";
import { pedagiosNaRota, multiplicador } from "./toll";
import type {
  Combustivel,
  LatLng,
  RouteAlternative,
  RouteResponse,
  VehicleType,
} from "./types";

const OSRM = process.env.OSRM_URL ?? "https://router.project-osrm.org";

type OsrmRoute = {
  distance: number; // m
  duration: number; // s
  geometry: string; // polyline5
};

export async function calcularRota(opts: {
  pontos: LatLng[]; // origem, paradas..., destino
  tipo: VehicleType;
  eixos: number;
  consumo: number; // km/l
  combustivel: Combustivel;
  precoCombustivel?: number; // R$/l — se ausente, usa média nacional
  alternativas?: boolean;
}): Promise<RouteResponse> {
  const { pontos, tipo, eixos, consumo, combustivel } = opts;
  if (pontos.length < 2) throw new Error("Informe origem e destino.");

  const coords = pontos.map((p) => `${p.lon},${p.lat}`).join(";");
  // OSRM só aceita alternatives sem waypoints intermediários
  const wantAlts = (opts.alternativas ?? true) && pontos.length === 2;
  const url =
    `${OSRM}/route/v1/driving/${coords}` +
    `?overview=full&geometries=polyline&steps=false` +
    (wantAlts ? "&alternatives=2" : "");

  const res = await fetch(url, {
    headers: { "User-Agent": "RotasPro/0.1 (MVP)" },
    next: { revalidate: 0 },
  });
  if (!res.ok) throw new Error(`Serviço de rotas indisponível (${res.status}).`);
  const data = (await res.json()) as { code: string; routes?: OsrmRoute[] };
  if (data.code !== "Ok" || !data.routes?.length) {
    throw new Error("Não foi possível traçar a rota entre os pontos informados.");
  }

  const preco =
    opts.precoCombustivel ??
    (combustiveis.nacional as Record<Combustivel, number>)[combustivel];

  const avisos: string[] = [];
  const alternativas: RouteAlternative[] = data.routes.map((r, i) => {
    const geometry = decodePolyline(r.geometry);
    const pedagios = pedagiosNaRota(geometry, tipo, eixos);
    const distanciaKm = r.distance / 1000;
    const litros = consumo > 0 ? distanciaKm / consumo : 0;
    const custoPedagio = pedagios.reduce((s, p) => s + p.custo, 0);
    const custoCombustivel = litros * preco;
    return {
      index: i,
      distanciaKm: Math.round(distanciaKm * 10) / 10,
      duracaoMin: Math.round(r.duration / 60),
      geometry,
      pedagios,
      custoPedagio: Math.round(custoPedagio * 100) / 100,
      custoCombustivel: Math.round(custoCombustivel * 100) / 100,
      litros: Math.round(litros * 10) / 10,
      custoTotal: Math.round((custoPedagio + custoCombustivel) * 100) / 100,
    };
  });

  if (alternativas.some((a) => a.pedagios.some((p) => p.estimada))) {
    avisos.push(
      "Algumas tarifas são estimadas (média da concessionária ou regional).",
    );
  }
  avisos.push(
    "Cobertura de pedágios: concessões federais (ANTT) e praças mapeadas no OpenStreetMap.",
  );

  return {
    alternativas,
    veiculo: { tipo, eixos, multiplicador: multiplicador(tipo, eixos) },
    precoCombustivel: preco,
    consumo,
    avisos,
  };
}

export function precosPorUF(uf?: string) {
  const t = combustiveis as {
    nacional: Record<string, number>;
    estados: Record<string, Record<string, number>>;
  };
  return (uf && t.estados[uf.toUpperCase()]) || t.nacional;
}
