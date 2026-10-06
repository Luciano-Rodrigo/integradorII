import { Pool } from "pg";

const globalForDb = globalThis as unknown as { pool?: Pool; schemaReady?: Promise<void> };

export const pool =
  globalForDb.pool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
  });

if (process.env.NODE_ENV !== "production") globalForDb.pool = pool;

const schema = `
  CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  CREATE TABLE IF NOT EXISTS receptor_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization_name TEXT NOT NULL,
    contact_email TEXT NOT NULL,
    phone TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    materials TEXT[] NOT NULL DEFAULT '{}',
    offers_pickup BOOLEAN NOT NULL DEFAULT FALSE,
    pickup_conditions TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  CREATE INDEX IF NOT EXISTS receptor_requests_status_idx ON receptor_requests(status);
  CREATE TABLE IF NOT EXISTS receptors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_name TEXT NOT NULL,
    contact_email TEXT NOT NULL,
    phone TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL CHECK (latitude BETWEEN -90 AND 90),
    longitude DOUBLE PRECISION NOT NULL CHECK (longitude BETWEEN -180 AND 180),
    materials TEXT[] NOT NULL DEFAULT '{}',
    offers_pickup BOOLEAN NOT NULL DEFAULT FALSE,
    pickup_conditions TEXT,
    opening_hours TEXT NOT NULL DEFAULT 'Horário não informado',
    website TEXT,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  CREATE INDEX IF NOT EXISTS receptors_location_idx ON receptors(latitude, longitude);
`;

export async function ensureDatabase() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL não está configurada.");
  if (!globalForDb.schemaReady) {
    globalForDb.schemaReady = pool.query(schema).then(() => undefined).catch((error) => {
      globalForDb.schemaReady = undefined;
      throw error;
    });
  }
  return globalForDb.schemaReady;
}
