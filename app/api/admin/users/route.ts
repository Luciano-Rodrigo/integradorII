import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { ensureDatabase, pool } from "@/lib/db";

export async function GET() {
  const user = await currentUser();
  if (user?.role !== "admin") return NextResponse.json({ error: "Acesso restrito." }, { status: 403 });
  await ensureDatabase();
  const result = await pool.query("SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC");
  return NextResponse.json({ users: result.rows });
}

export async function POST(request: Request) {
  const admin = await currentUser();
  if (admin?.role !== "admin") return NextResponse.json({ error: "Acesso restrito." }, { status: 403 });

  try {
    await ensureDatabase();
    const { name, email, password, role } = await request.json();
    if (!name?.trim() || !email?.trim() || typeof password !== "string" || password.length < 8 || !["user", "admin"].includes(role)) {
      return NextResponse.json({ error: "Informe nome, e-mail, senha de ao menos 8 caracteres e um perfil válido." }, { status: 400 });
    }
    const passwordHash = await bcrypt.hash(password, 12);
    const result = await pool.query(
      "INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role, created_at",
      [name.trim(), email.trim().toLowerCase(), passwordHash, role],
    );
    return NextResponse.json({ user: result.rows[0] }, { status: 201 });
  } catch (error) {
    if ((error as { code?: string }).code === "23505") return NextResponse.json({ error: "Este e-mail já possui cadastro." }, { status: 409 });
    console.error(error);
    return NextResponse.json({ error: "Não foi possível criar o acesso." }, { status: 500 });
  }
}
