import { NextRequest, NextResponse } from "next/server";
import { precosPorUF } from "@/lib/routing";

export async function GET(req: NextRequest) {
  const uf = req.nextUrl.searchParams.get("uf") ?? undefined;
  return NextResponse.json({ uf: uf ?? "BR", precos: precosPorUF(uf) });
}
