export type LatLng = { lat: number; lon: number };

export type Place = LatLng & {
  label: string;
};

export type Praca = {
  name: string;
  concessionaria: string;
  rodovia: string;
  uf: string;
  km: number;
  municipio: string;
  lat: number;
  lon: number;
  tarifa: number; // categoria 1 (carro), em R$
  estimada: boolean;
  fonte?: string;
  sentido?: string; // Crescente/Decrescente (dados ANTT)
  rumo?: number | null; // direção cardinal do pórtico em graus (free flow)
};

export type VehicleType = "moto" | "carro" | "onibus" | "caminhao";

export type Vehicle = {
  id: string;
  nome: string;
  tipo: VehicleType;
  eixos: number; // relevante para ônibus/caminhão
  consumo: number; // km/l
  combustivel: Combustivel;
};

export type Combustivel = "gasolina" | "etanol" | "diesel" | "gnv";

export type TollHit = Praca & {
  custo: number; // tarifa x multiplicador da categoria
  distKm: number; // posição aproximada ao longo da rota
};

export type RouteAlternative = {
  index: number;
  distanciaKm: number;
  duracaoMin: number;
  geometry: [number, number][]; // [lon, lat]
  pedagios: TollHit[];
  custoPedagio: number;
  custoCombustivel: number;
  litros: number;
  custoTotal: number;
};

export type RouteResponse = {
  alternativas: RouteAlternative[];
  veiculo: { tipo: VehicleType; eixos: number; multiplicador: number };
  precoCombustivel: number;
  consumo: number;
  avisos: string[];
};
