import { sql as vercelSql } from "@vercel/postgres";

let schemaPromise: Promise<void> | null = null;

export function isPostgresConfigured() {
  return Boolean(
    process.env.POSTGRES_URL ||
      process.env.POSTGRES_URL_NON_POOLING ||
      process.env.POSTGRES_PRISMA_URL ||
      process.env.VERCEL_POSTGRES_URL,
  );
}

export function isVercelRuntime() {
  return process.env.VERCEL === "1" || process.env.VERCEL === "true";
}

export const sql = vercelSql;

export async function ensureSchema() {
  if (!isPostgresConfigured()) {
    return;
  }

  if (!schemaPromise) {
    schemaPromise = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS admin_users (
          id TEXT PRIMARY KEY,
          email TEXT NOT NULL UNIQUE,
          name TEXT NOT NULL,
          password_hash TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL,
          disabled BOOLEAN NOT NULL DEFAULT FALSE
        );
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS enquiries (
          id TEXT PRIMARY KEY,
          full_name TEXT NOT NULL,
          phone_number TEXT NOT NULL,
          email TEXT NOT NULL,
          property_id TEXT NOT NULL,
          message TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL,
          status TEXT NOT NULL DEFAULT 'new',
          updated_at TIMESTAMPTZ
        );
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS properties (
          id TEXT PRIMARY KEY,
          data JSONB NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL
        );
      `;
    })();
  }

  await schemaPromise;
}
