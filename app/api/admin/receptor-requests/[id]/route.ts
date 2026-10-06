import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { pool } from "@/lib/db";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  if (user?.role !== "admin") return NextResponse.json({ error: "Acesso restrito." }, { status: 403 });
  const { status } = await request.json();
  if (!["approved", "rejected"].includes(status)) return NextResponse.json({ error: "Status inválido." }, { status: 400 });
  const { id } = await params;
  const result = await pool.query(
    "UPDATE receptor_requests SET status = $1, reviewed_by = $2, reviewed_at = NOW() WHERE id = $3 RETURNING id, status",
    [status, user.id, id],
  );
  if (!result.rowCount) return NextResponse.json({ error: "Solicitação não encontrada." }, { status: 404 });
  return NextResponse.json({ request: result.rows[0] });
}
