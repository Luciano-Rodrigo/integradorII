import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { setSession } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();
    if (!name?.trim() || !email?.trim() || typeof password !== "string" || password.length < 8) {
      return NextResponse.json({ error: "Informe nome, e-mail e uma senha com ao menos 8 caracteres." }, { status: 400 });
    }
    const normalizedEmail = email.trim().toLowerCase();
    const passwordHash = await bcrypt.hash(password, 12);
    const role = process.env.ADMIN_EMAIL?.toLowerCase() === normalizedEmail ? "admin" : "user";
    const result = await pool.query(
      "INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role",
      [name.trim(), normalizedEmail, passwordHash, role],
    );
    await setSession(result.rows[0]);
    return NextResponse.json({ user: result.rows[0] }, { status: 201 });
  } catch (error) {
    if ((error as { code?: string }).code === "23505") return NextResponse.json({ error: "Este e-mail já possui cadastro." }, { status: 409 });
    console.error(error);
    return NextResponse.json({ error: "Não foi possível criar sua conta." }, { status: 500 });
  }
}
