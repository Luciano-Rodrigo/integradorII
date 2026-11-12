import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { ensureDatabase, pool } from "@/lib/db";

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function GET() {
  const user = await currentUser();
  if (user?.role !== "admin") return NextResponse.json({ error: "Acesso restrito." }, { status: 403 });
  await ensureDatabase();
  const result = await pool.query("SELECT * FROM receptors ORDER BY organization_name ASC");
  return NextResponse.json({ receptors: result.rows });
}

export async function POST(request: Request) {
  const user = await currentUser();
  if (user?.role !== "admin") return NextResponse.json({ error: "Acesso restrito." }, { status: 403 });

  try {
    await ensureDatabase();
    const data = await request.json();
    const organizationName = text(data.organizationName);
    const contactEmail = text(data.contactEmail).toLowerCase();
    const phone = text(data.phone);
    const address = text(data.address);
    const city = text(data.city);
    const latitude = Number(data.latitude);
    const longitude = Number(data.longitude);
    const photoUrl = text(data.photoData);
    const materials = Array.isArray(data.materials) ? data.materials.filter((item: unknown): item is string => typeof item === "string" && item.trim().length > 0) : [];

    if (!organizationName || !contactEmail || !phone || !address || !city || !materials.length || !Number.isFinite(latitude) || latitude < -90 || latitude > 90 || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
      return NextResponse.json({ error: "Preencha os dados obrigatórios, os materiais e as coordenadas válidas." }, { status: 400 });
    }
    if (photoUrl && (!/^data:image\/(jpeg|png|webp);base64,/i.test(photoUrl) || photoUrl.length > 2_800_000)) {
      return NextResponse.json({ error: "A foto deve ser JPG, PNG ou WebP e ter no máximo 2 MB." }, { status: 400 });
    }

    const result = await pool.query(
      `INSERT INTO receptors (organization_name, contact_email, phone, address, city, latitude, longitude, materials, offers_pickup, pickup_conditions, opening_hours, website, photo_url, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
       RETURNING *`,
      [organizationName, contactEmail, phone, address, city, latitude, longitude, materials, Boolean(data.offersPickup), text(data.pickupConditions) || null, text(data.openingHours) || "Horário não informado", text(data.website) || null, photoUrl || null, user.id],
    );
    return NextResponse.json({ receptor: result.rows[0] }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Não foi possível cadastrar o receptor." }, { status: 500 });
  }
}
