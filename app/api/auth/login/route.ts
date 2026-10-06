import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { setSession } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    const result = await pool.query("SELECT id, name, email, role, password_hash FROM users WHERE email = $1", [email?.trim().toLowerCase()]);
    const user = result.rows[0];
    if (!user || !(await bcrypt.compare(password ?? "", user.password_hash))) {
      return NextResponse.json({ error: "E-mail ou senha inválidos." }, { status: 401 });
    }
    await setSession(user);
    return NextResponse.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Não foi possível entrar." }, { status: 500 });
  }
}
