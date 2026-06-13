import { NextRequest, NextResponse } from "next/server";
import { calcularRota } from "@/lib/routing";
import type { Combustivel, VehicleType } from "@/lib/types";

/**
 * API pública v1 — exemplo:
 * GET /api/v1/rota?origem=-23.5505,-46.6333&destino=-22.9068,-43.1729
 *     &tipo=caminhao&eixos=5&consumo=2.8&combustivel=diesel&preco=6.05
 *     &geometria=0
 * Coordenadas em "lat,lon". Paradas opcionais: &parada=lat,lon (repetível).
 */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;

  const parse = (s: string | null) => {
    const m = s?.split(",").map(Number);
    return m && m.length === 2 && m.every(Number.isFinite)
      ? { lat: m[0], lon: m[1] }
      : null;
  };

  const origem = parse(sp.get("origem"));
  const destino = parse(sp.get("destino"));
  if (!origem || !destino) {
    return NextResponse.json(
      { erro: "Parâmetros obrigatórios: origem=lat,lon e destino=lat,lon" },
      { status: 400 },
    );
  }
  const paradas = sp.getAll("parada").map(parse).filter((p) => p !== null);

  const TIPOS_VALIDOS: VehicleType[] = ["moto", "carro", "onibus", "caminhao"];
  const COMBUSTIVEIS_VALIDOS: Combustivel[] = ["gasolina", "etanol", "diesel", "gnv"];
  const tipoParam = sp.get("tipo") ?? "carro";
  const tipo = (TIPOS_VALIDOS.includes(tipoParam as VehicleType) ? tipoParam : "carro") as VehicleType;
  const eixos = Number(sp.get("eixos") ?? (tipo === "caminhao" ? 5 : 2));
  const consumo = Number(sp.get("consumo") ?? 11.5);
  const combustivelParam = sp.get("combustivel") ?? "gasolina";
  const combustivel = (COMBUSTIVEIS_VALIDOS.includes(combustivelParam as Combustivel) ? combustivelParam : "gasolina") as Combustivel;
  const preco = sp.get("preco") ? Number(sp.get("preco")) : undefined;
  const incluirGeometria = sp.get("geometria") === "1";

  try {
    const r = await calcularRota({
      pontos: [origem, ...paradas, destino],
      tipo,
      eixos,
      consumo,
      combustivel,
      precoCombustivel: preco,
    });
    return NextResponse.json({
      ...r,
      alternativas: r.alternativas.map((a) => ({
        ...a,
        geometry: incluirGeometria ? a.geometry : undefined,
      })),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro ao calcular a rota.";
    return NextResponse.json({ erro: msg }, { status: 502 });
  }
}
