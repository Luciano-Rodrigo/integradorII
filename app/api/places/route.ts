import { NextResponse } from "next/server";

type OverpassElement = {
  id: number;
  type: "node" | "way" | "relation";
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

const cache = new Map<string, { expires: number; data: unknown }>();

function numberParam(value: string | null, min: number, max: number) {
  const number = Number(value);
  return Number.isFinite(number) && number >= min && number <= max ? number : null;
}

function address(tags: Record<string, string>) {
  const street = [tags["addr:street"], tags["addr:housenumber"]].filter(Boolean).join(", ");
  return [street, tags["addr:suburb"], tags["addr:city"]].filter(Boolean).join(" · ") || "Endereço não informado no OpenStreetMap";
}

function materialLabels(tags: Record<string, string>) {
  const labels: string[] = [];
  if (tags["recycling:electronics"] === "yes" || tags["recycling:electrical_items"] === "yes") labels.push("Eletrônicos");
  if (tags["recycling:batteries"] === "yes") labels.push("Baterias");
  if (tags["recycling:mobile_phones"] === "yes") labels.push("Celulares");
  if (tags["recycling:computers"] === "yes") labels.push("Computadores");
  return labels.length ? labels : ["Materiais recicláveis"];
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = numberParam(searchParams.get("lat"), -90, 90);
  const lng = numberParam(searchParams.get("lng"), -180, 180);
  if (lat === null || lng === null) return NextResponse.json({ error: "Coordenadas inválidas." }, { status: 400 });

  const key = `${lat.toFixed(2)}:${lng.toFixed(2)}`;
  const cached = cache.get(key);
  if (cached && cached.expires > Date.now()) return NextResponse.json(cached.data, { headers: { "Cache-Control": "public, max-age=300" } });

  const query = `[out:json][timeout:20];
    (
      nwr(around:12000,${lat},${lng})["amenity"="recycling"];
      nwr(around:12000,${lat},${lng})["recycling:electronics"="yes"];
      nwr(around:12000,${lat},${lng})["recycling:electrical_items"="yes"];
      nwr(around:12000,${lat},${lng})["recycling:batteries"="yes"];
    );
    out center tags 80;`;

  try {
    const response = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": "DescarteCerto/1.0 (contato via plataforma)" },
      body: new URLSearchParams({ data: query }),
      next: { revalidate: 300 },
    });
    if (!response.ok) throw new Error(`Overpass ${response.status}`);
    const payload = await response.json() as { elements?: OverpassElement[] };
    const places = (payload.elements ?? []).map((element) => {
      const tags = element.tags ?? {};
      const placeLat = element.lat ?? element.center?.lat;
      const placeLng = element.lon ?? element.center?.lon;
      if (placeLat === undefined || placeLng === undefined) return null;
      return {
        id: `osm-${element.type}-${element.id}`,
        name: tags.name || tags.operator || "Ponto de reciclagem",
        address: address(tags),
        lat: placeLat,
        lng: placeLng,
        materials: materialLabels(tags),
        phone: tags.phone || tags["contact:phone"] || null,
        website: tags.website || tags["contact:website"] || null,
        hours: tags.opening_hours || "Horário não informado",
        pickup: tags["collection:pickup"] === "yes" || tags["recycling:pickup"] === "yes",
        pickupConditions: "Informação não cadastrada no OpenStreetMap",
        source: "OpenStreetMap",
      };
    }).filter(Boolean);
    const data = { places, source: "OpenStreetMap / Overpass" };
    cache.set(key, { data, expires: Date.now() + 5 * 60 * 1000 });
    return NextResponse.json(data, { headers: { "Cache-Control": "public, max-age=300" } });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Não foi possível consultar os pontos reais agora. Tente novamente em instantes." }, { status: 503 });
  }
}
