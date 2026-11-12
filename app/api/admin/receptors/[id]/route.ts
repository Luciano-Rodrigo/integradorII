import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { ensureDatabase, pool } from "@/lib/db";

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function photos(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item.length > 0).slice(0, 4) : null;
}

function validPhotos(values: string[]) {
  return values.every((value) => /^data:image\/(jpeg|png|webp);base64,/i.test(value) && value.length <= 2_800_000);
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  if (user?.role !== "admin") return NextResponse.json({ error: "Acesso restrito." }, { status: 403 });

  try {
    await ensureDatabase();
    const { id } = await params;
    const data = await request.json();
    const organizationName = text(data.organizationName);
    const contactEmail = text(data.contactEmail).toLowerCase();
    const phone = text(data.phone);
    const address = text(data.address);
    const city = text(data.city);
    const latitude = Number(data.latitude);
    const longitude = Number(data.longitude);
    const materials = Array.isArray(data.materials) ? data.materials.filter((item: unknown): item is string => typeof item === "string" && item.trim().length > 0) : [];
    const photoData = photos(data.photoData);

    if (!organizationName || !contactEmail || !phone || !address || !city || !materials.length || !Number.isFinite(latitude) || latitude < -90 || latitude > 90 || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
      return NextResponse.json({ error: "Preencha os dados obrigatórios, os materiais e as coordenadas válidas." }, { status: 400 });
    }
    if (photoData && !validPhotos(photoData)) return NextResponse.json({ error: "As fotos devem ser JPG, PNG ou WebP e ter no máximo 2 MB cada." }, { status: 400 });

    const existing = await pool.query("SELECT photo_url, photo_urls FROM receptors WHERE id = $1", [id]);
    if (!existing.rowCount) return NextResponse.json({ error: "Receptor não encontrado." }, { status: 404 });
    const photoUrls = photoData ?? (existing.rows[0].photo_urls?.length ? existing.rows[0].photo_urls : existing.rows[0].photo_url ? [existing.rows[0].photo_url] : []);
    const result = await pool.query(
      `UPDATE receptors SET organization_name=$1, contact_email=$2, phone=$3, address=$4, city=$5, latitude=$6, longitude=$7, materials=$8, offers_pickup=$9, pickup_conditions=$10, opening_hours=$11, website=$12, photo_url=$13, photo_urls=$14
       WHERE id=$15 RETURNING *`,
      [organizationName, contactEmail, phone, address, city, latitude, longitude, materials, Boolean(data.offersPickup), text(data.pickupConditions) || null, text(data.openingHours) || "Horário não informado", text(data.website) || null, photoUrls[0] || null, photoUrls, id],
    );
    return NextResponse.json({ receptor: result.rows[0] });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Não foi possível atualizar o receptor." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  if (user?.role !== "admin") return NextResponse.json({ error: "Acesso restrito." }, { status: 403 });
  await ensureDatabase();
  const { id } = await params;
  const result = await pool.query("DELETE FROM receptors WHERE id = $1 RETURNING id", [id]);
  if (!result.rowCount) return NextResponse.json({ error: "Receptor não encontrado." }, { status: 404 });
  return NextResponse.json({ deletedId: result.rows[0].id });
}
