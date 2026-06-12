import { NextRequest, NextResponse } from "next/server";
import { calcularRota, precosPorUF } from "@/lib/routing";
import { pisoMinimoFrete, type TipoCarga } from "@/lib/freight";
import { registrarUso, verificarAcesso } from "@/lib/acesso";
import type { Combustivel, LatLng, VehicleType } from "@/lib/types";

type Body = {
  pontos: LatLng[];
  tipo?: VehicleType;
  eixos?: number;
  consumo?: number;
  combustivel?: Combustivel;
  precoCombustivel?: number;
  ufOrigem?: string;
  frete?: { tipoCarga: TipoCarga; retornoVazio?: boolean };
};

export async function POST(req: NextRequest) {
  const acesso = await verificarAcesso(req);
  if (!acesso.permitido) {
    return NextResponse.json(
      { erro: acesso.motivo, paywall: true },
      { status: 402 },
    );
  }

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ erro: "JSON inválido" }, { status: 400 });
  }

  const tipo = body.tipo ?? "carro";
  const eixos = body.eixos ?? (tipo === "carro" ? 2 : tipo === "moto" ? 2 : 5);
  const consumo = body.consumo ?? { moto: 25, carro: 11.5, onibus: 3.2, caminhao: 2.8 }[tipo];
  const combustivel =
    body.combustivel ?? (tipo === "carro" || tipo === "moto" ? "gasolina" : "diesel");
  const preco =
    body.precoCombustivel ??
    (precosPorUF(body.ufOrigem) as Record<string, number>)[combustivel];

  try {
    const resultado = await calcularRota({
      pontos: body.pontos,
      tipo,
      eixos,
      consumo,
      combustivel,
      precoCombustivel: preco,
    });

    let frete = null;
    if (body.frete && (tipo === "caminhao" || tipo === "onibus")) {
      const melhor = resultado.alternativas[0];
      frete = {
        ...pisoMinimoFrete(
          body.frete.tipoCarga,
          eixos,
          melhor.distanciaKm,
          body.frete.retornoVazio,
        ),
        tipoCarga: body.frete.tipoCarga,
        observacao:
          "Estimativa do piso mínimo (Tabela A ANTT). Confira a resolução vigente.",
      };
    }

    const res = NextResponse.json({
      ...resultado,
      frete,
      usosRestantes: acesso.assinante ? null : acesso.usosRestantes,
    });
    if (!acesso.assinante) registrarUso(req, res);
    return res;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro ao calcular a rota.";
    return NextResponse.json({ erro: msg }, { status: 502 });
  }
}
