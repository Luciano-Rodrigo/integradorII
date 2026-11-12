import { NextResponse } from "next/server";
import { ensureDatabase, pool } from "@/lib/db";

function numberParam(value: string | null, min: number, max: number) {
  const number = Number(value);
  return Number.isFinite(number) && number >= min && number <= max ? number : null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = numberParam(searchParams.get("lat"), -90, 90);
  const lng = numberParam(searchParams.get("lng"), -180, 180);
  if (lat === null || lng === null) return NextResponse.json({ error: "Coordenadas inválidas." }, { status: 400 });

  try {
    await ensureDatabase();
    const registered = await pool.query(
      `SELECT id, organization_name, phone, address, city, latitude, longitude, materials, offers_pickup, pickup_conditions, opening_hours, website, photo_url
       FROM receptors ORDER BY organization_name ASC`,
    );
    const places = registered.rows.map((receptor) => ({
      id: `receptor-${receptor.id}`,
      name: receptor.organization_name,
      address: `${receptor.address} · ${receptor.city}`,
      lat: receptor.latitude,
      lng: receptor.longitude,
      materials: receptor.materials,
      phone: receptor.phone,
      website: receptor.website,
      photoUrl: receptor.photo_url,
      hours: receptor.opening_hours,
      pickup: receptor.offers_pickup,
      pickupConditions: receptor.pickup_conditions || "Coleta disponível; confirme as condições diretamente com o receptor.",
      source: "Receptor cadastrado",
    }));
    return NextResponse.json({ places }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Não foi possível carregar os receptores cadastrados agora." }, { status: 503 });
  }
}
