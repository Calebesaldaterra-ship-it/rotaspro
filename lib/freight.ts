/**
 * Piso mínimo de frete — Tabela A da ANTT (carga lotação, transportador
 * contratado): piso = CCD × distância + CC.
 *
 * Coeficientes de referência (Resolução ANTT, ciclo 2025) — valores
 * aproximados para estimativa; confira a resolução vigente antes de fechar
 * frete. Estrutura preparada para atualização simples.
 */

export type TipoCarga =
  | "geral"
  | "granel_solido"
  | "granel_liquido"
  | "frigorificada"
  | "neogranel"
  | "perigosa_geral";

export const TIPOS_CARGA: { id: TipoCarga; nome: string }[] = [
  { id: "geral", nome: "Carga geral" },
  { id: "granel_solido", nome: "Granel sólido" },
  { id: "granel_liquido", nome: "Granel líquido" },
  { id: "frigorificada", nome: "Frigorificada" },
  { id: "neogranel", nome: "Neogranel" },
  { id: "perigosa_geral", nome: "Perigosa (carga geral)" },
];

// CCD (R$/km) e CC (R$) por nº de eixos carregados
type Coef = { ccd: number; cc: number };
const TABELA_A: Record<TipoCarga, Record<number, Coef>> = {
  geral: {
    2: { ccd: 3.92, cc: 416.92 },
    3: { ccd: 4.89, cc: 502.39 },
    4: { ccd: 5.61, cc: 552.79 },
    5: { ccd: 6.24, cc: 608.06 },
    6: { ccd: 6.87, cc: 661.34 },
    7: { ccd: 7.48, cc: 776.34 },
    9: { ccd: 8.51, cc: 871.32 },
  },
  granel_solido: {
    2: { ccd: 3.89, cc: 412.32 },
    3: { ccd: 4.85, cc: 496.06 },
    4: { ccd: 5.56, cc: 545.48 },
    5: { ccd: 6.18, cc: 599.84 },
    6: { ccd: 6.81, cc: 652.95 },
    7: { ccd: 7.41, cc: 766.69 },
    9: { ccd: 8.43, cc: 859.93 },
  },
  granel_liquido: {
    2: { ccd: 4.0, cc: 425.18 },
    3: { ccd: 4.98, cc: 511.81 },
    4: { ccd: 5.71, cc: 563.27 },
    5: { ccd: 6.36, cc: 620.04 },
    6: { ccd: 7.0, cc: 674.48 },
    7: { ccd: 7.63, cc: 791.39 },
    9: { ccd: 8.67, cc: 888.31 },
  },
  frigorificada: {
    2: { ccd: 4.46, cc: 459.05 },
    3: { ccd: 5.56, cc: 554.27 },
    4: { ccd: 6.36, cc: 609.32 },
    5: { ccd: 7.07, cc: 670.27 },
    6: { ccd: 7.78, cc: 728.66 },
    7: { ccd: 8.45, cc: 851.99 },
    9: { ccd: 9.62, cc: 956.61 },
  },
  neogranel: {
    2: { ccd: 3.86, cc: 409.95 },
    3: { ccd: 4.81, cc: 492.99 },
    4: { ccd: 5.52, cc: 542.05 },
    5: { ccd: 6.13, cc: 595.93 },
    6: { ccd: 6.75, cc: 648.62 },
    7: { ccd: 7.35, cc: 761.61 },
    9: { ccd: 8.36, cc: 854.06 },
  },
  perigosa_geral: {
    2: { ccd: 4.21, cc: 489.43 },
    3: { ccd: 5.19, cc: 575.69 },
    4: { ccd: 5.91, cc: 626.51 },
    5: { ccd: 6.55, cc: 682.18 },
    6: { ccd: 7.18, cc: 735.92 },
    7: { ccd: 7.81, cc: 853.85 },
    9: { ccd: 8.85, cc: 949.65 },
  },
};

const EIXOS_VALIDOS = [2, 3, 4, 5, 6, 7, 9];

export function pisoMinimoFrete(
  tipoCarga: TipoCarga,
  eixos: number,
  distanciaKm: number,
  retornoVazio = false,
): { piso: number; ccd: number; cc: number; eixosUsados: number } {
  // usa a faixa de eixos imediatamente acima quando não há valor exato (8 -> 9)
  const eixosUsados =
    EIXOS_VALIDOS.find((e) => e >= Math.max(2, Math.min(9, eixos))) ?? 9;
  const { ccd, cc } = TABELA_A[tipoCarga][eixosUsados];
  let piso = ccd * distanciaKm + cc;
  // retorno vazio: ANTT prevê 92% do CCD da volta quando contratado
  if (retornoVazio) piso += 0.92 * ccd * distanciaKm;
  return { piso: Math.round(piso * 100) / 100, ccd, cc, eixosUsados };
}
