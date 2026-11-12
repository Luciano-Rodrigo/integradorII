import { NextResponse } from "next/server";

type GeocodeResult = { lat: string; lon: string; display_name: string };

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q")?.trim();
  if (!query || query.length < 3) return NextResponse.json({ error: "Informe um endereço com ao menos 3 caracteres." }, { status: 400 });
  try {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.search = new URLSearchParams({ q: query, format: "jsonv2", limit: "1", addressdetails: "1" }).toString();
    const response = await fetch(url, { headers: { "User-Agent": "DescarteCerto/1.0 (busca de receptores)" }, signal: AbortSignal.timeout(8000), next: { revalidate: 0 } });
    if (!response.ok) throw new Error(`Geocoding ${response.status}`);
    const results = await response.json() as GeocodeResult[];
    const first = results[0];
    if (!first) return NextResponse.json({ error: "Endereço não encontrado. Tente informar rua, número e cidade." }, { status: 404 });
    return NextResponse.json({ latitude: Number(first.lat), longitude: Number(first.lon), label: first.display_name }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Não foi possível localizar esse endereço agora." }, { status: 503 });
  }
}
