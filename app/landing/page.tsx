import LandingIsland from "@/components/LandingIsland";

export const metadata = {
  title: "RotasPro — Calcule rotas com custo real",
  description:
    "Pedágio, combustível, frete ANTT e rastreamento ao vivo para motoristas e transportadores no Brasil.",
};

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-slate-950 flex flex-col items-center justify-start">
      <LandingIsland />
    </main>
  );
}
