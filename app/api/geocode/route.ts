import { NextRequest, NextResponse } from "next/server";

const UF_POR_ESTADO: Record<string, string> = {
  Acre: "AC", Alagoas: "AL", Amapá: "AP", Amazonas: "AM", Bahia: "BA",
  Ceará: "CE", "Distrito Federal": "DF", "Espírito Santo": "ES", Goiás: "GO",
  Maranhão: "MA", "Mato Grosso": "MT", "Mato Grosso do Sul": "MS",
  "Minas Gerais": "MG", Pará: "PA", Paraíba: "PB", Paraná: "PR",
  Pernambuco: "PE", Piauí: "PI", "Rio de Janeiro": "RJ",
  "Rio Grande do Norte": "RN", "Rio Grande do Sul": "RS", Rondônia: "RO",
  Roraima: "RR", "Santa Catarina": "SC", "São Paulo": "SP", Sergipe: "SE",
  Tocantins: "TO",
};

type NominatimItem = {
  display_name: string;
  lat: string;
  lon: string;
  address?: { state?: string };
};

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 3) return NextResponse.json({ results: [] });

  const url =
    "https://nominatim.openstreetmap.org/search?format=jsonv2" +
    `&q=${encodeURIComponent(q)}&countrycodes=br&limit=6&addressdetails=1` +
    "&accept-language=pt-BR";
  const res = await fetch(url, {
    headers: { "User-Agent": "RotasPro/0.1 (app de rotas; contato local)" },
    next: { revalidate: 86400 },
  });
  if (!res.ok) {
    return NextResponse.json({ results: [], erro: "geocoder indisponível" }, { status: 502 });
  }
  const items = (await res.json()) as NominatimItem[];
  const results = items.map((i) => ({
    label: i.display_name.split(",").slice(0, 3).join(",").trim(),
    fullLabel: i.display_name,
    lat: parseFloat(i.lat),
    lon: parseFloat(i.lon),
    uf: i.address?.state ? (UF_POR_ESTADO[i.address.state] ?? null) : null,
  }));
  return NextResponse.json({ results });
}
