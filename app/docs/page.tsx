import Link from "next/link";

export const metadata = { title: "API — Irmão da Estrada" };

const EXEMPLO = `GET /api/v1/rota
  ?origem=-23.5505,-46.6333      # lat,lon (obrigatório)
  &destino=-22.9068,-43.1729     # lat,lon (obrigatório)
  &parada=-23.2,-45.9            # opcional, repetível
  &tipo=caminhao                 # moto | carro | onibus | caminhao (padrão: carro)
  &eixos=5                       # ônibus/caminhão (padrão: 5)
  &consumo=2.8                   # km/l (padrão: 11.5)
  &combustivel=diesel            # gasolina | etanol | diesel | gnv
  &preco=6.05                    # R$/l — se omitido, usa média por UF/nacional
  &geometria=1                   # inclui a polyline da rota na resposta`;

const RESPOSTA = `{
  "alternativas": [
    {
      "index": 0,
      "distanciaKm": 434.2,
      "duracaoMin": 326,
      "pedagios": [
        { "name": "Itatiaia", "rodovia": "BR-116/RJ", "tarifa": 9.4,
          "custo": 47.0, "distKm": 271.3, "estimada": false }
      ],
      "custoPedagio": 188.5,
      "custoCombustivel": 938.2,
      "litros": 155.1,
      "custoTotal": 1126.7
    }
  ],
  "veiculo": { "tipo": "caminhao", "eixos": 5, "multiplicador": 5 },
  "precoCombustivel": 6.05,
  "avisos": ["..."]
}`;

export default function Docs() {
  return (
    <div className="min-h-dvh bg-slate-950 px-4 py-8 text-slate-100">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="text-sm text-amber-300 hover:text-amber-200">
          ← voltar ao app
        </Link>
        <h1 className="mt-4 text-2xl font-bold">
          API Irmão da <span className="text-amber-400">Estrada</span> v1
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-400">
          Integre cálculo de rota, pedágio e combustível ao seu sistema com uma única
          chamada HTTP. Sem autenticação nesta versão de desenvolvimento.
        </p>

        <h2 className="mt-8 text-base font-semibold text-slate-200">Requisição</h2>
        <pre className="mt-2 overflow-x-auto rounded-xl border border-slate-800 bg-slate-900 p-4 text-xs leading-relaxed text-slate-300">
          {EXEMPLO}
        </pre>

        <h2 className="mt-6 text-base font-semibold text-slate-200">Resposta</h2>
        <pre className="mt-2 overflow-x-auto rounded-xl border border-slate-800 bg-slate-900 p-4 text-xs leading-relaxed text-slate-300">
          {RESPOSTA}
        </pre>

        <h2 className="mt-6 text-base font-semibold text-slate-200">
          Fontes de dados
        </h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-400">
          <li>
            Praças de pedágio e tarifas: dados abertos da ANTT (concessões federais);
            praças estaduais via OpenStreetMap com tarifa estimada (campo{" "}
            <code className="text-amber-300">estimada</code>).
          </li>
          <li>Roteamento: OSRM sobre OpenStreetMap.</li>
          <li>Combustível: média por estado (referência ANP), editável por requisição.</li>
          <li>Frete: piso mínimo Tabela A ANTT (estimativa).</li>
        </ul>
      </div>
    </div>
  );
}
