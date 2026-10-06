import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { pool } from "@/lib/db";

export async function GET() {
  const user = await currentUser();
  if (user?.role !== "admin") return NextResponse.json({ error: "Acesso restrito." }, { status: 403 });
  const result = await pool.query(
    `SELECT r.*, u.name AS requester_name, u.email AS requester_email
     FROM receptor_requests r JOIN users u ON u.id = r.user_id
     ORDER BY CASE r.status WHEN 'pending' THEN 0 ELSE 1 END, r.created_at DESC`,
  );
  return NextResponse.json({ requests: result.rows });
}
