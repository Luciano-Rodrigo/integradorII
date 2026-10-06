import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { pool } from "@/lib/db";

export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Faça login para solicitar o cadastro." }, { status: 401 });
  try {
    const data = await request.json();
    const materials = Array.isArray(data.materials) ? data.materials.filter((item: unknown): item is string => typeof item === "string") : [];
    if (!data.organizationName?.trim() || !data.contactEmail?.trim() || !data.phone?.trim() || !data.address?.trim() || !data.city?.trim() || !materials.length) {
      return NextResponse.json({ error: "Preencha todos os campos obrigatórios e informe pelo menos um material." }, { status: 400 });
    }
    const result = await pool.query(
      `INSERT INTO receptor_requests (user_id, organization_name, contact_email, phone, address, city, materials, offers_pickup, pickup_conditions)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id, status, created_at`,
      [user.id, data.organizationName.trim(), data.contactEmail.trim().toLowerCase(), data.phone.trim(), data.address.trim(), data.city.trim(), materials, Boolean(data.offersPickup), data.pickupConditions?.trim() || null],
    );
    return NextResponse.json({ request: result.rows[0] }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Não foi possível enviar a solicitação." }, { status: 500 });
  }
}
