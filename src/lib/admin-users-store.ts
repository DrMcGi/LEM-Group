import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { AdminUser } from "@/types";
import { ensureSchema, isPostgresConfigured, isVercelRuntime, sql } from "@/lib/db";

const storageDirectory = path.join(process.cwd(), "storage");
const usersFile = path.join(storageDirectory, "admin-users.json");

async function ensureStorage() {
  try {
    await mkdir(storageDirectory, { recursive: true });
  } catch {
    // On Vercel/serverless the filesystem may be read-only; ignore and fall back.
  }
}

async function readUsersFile(): Promise<AdminUser[]> {
  await ensureStorage();

  try {
    const fileContent = await readFile(usersFile, "utf8");
    const parsed = JSON.parse(fileContent) as AdminUser[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeUsersFile(users: AdminUser[]) {
  await ensureStorage();

  if (isVercelRuntime()) {
    throw new Error("Persistent storage is not configured. Connect Postgres on Vercel (POSTGRES_URL) to manage admin users.");
  }

  await writeFile(usersFile, JSON.stringify(users, null, 2), "utf8");
}

async function ensureInitialAdminIfConfigured() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME ?? "Administrator";

  if (!email || !password) {
    return;
  }

  if (isPostgresConfigured()) {
    await ensureSchema();

    const normalizedEmail = email.trim().toLowerCase();
    const result = await sql<{ count: string }>`SELECT COUNT(*)::text as count FROM admin_users`;
    const count = Number(result.rows[0]?.count ?? "0");
    if (count > 0) {
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const now = new Date().toISOString();
    const id = randomUUID();

    await sql`
      INSERT INTO admin_users (id, email, name, password_hash, created_at, disabled)
      VALUES (${id}, ${normalizedEmail}, ${name}, ${passwordHash}, ${now}, false)
    `;

    return;
  }

  if (isVercelRuntime()) {
    // Avoid filesystem writes on Vercel. Without Postgres, we cannot persist admin users.
    return;
  }

  const existing = await readUsersFile();
  if (existing.length > 0) {
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user: AdminUser = {
    id: randomUUID(),
    email: email.trim().toLowerCase(),
    name,
    passwordHash,
    createdAt: new Date().toISOString(),
    disabled: false,
  };

  await writeUsersFile([user]);
}

export async function getAdminUsers(): Promise<AdminUser[]> {
  await ensureInitialAdminIfConfigured();

  if (isPostgresConfigured()) {
    await ensureSchema();
    const result = await sql<{
      id: string;
      email: string;
      name: string;
      created_at: Date | string;
      password_hash: string;
      disabled: boolean;
    }>`
      SELECT id, email, name, password_hash, created_at, disabled
      FROM admin_users
      ORDER BY created_at ASC
    `;

    return result.rows.map((row) => ({
      id: row.id,
      email: row.email,
      name: row.name,
      passwordHash: row.password_hash,
      createdAt: (row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at)),
      disabled: row.disabled,
    }));
  }

  const users = await readUsersFile();
  return users.sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));
}

export async function findAdminUserByEmail(email: string): Promise<AdminUser | null> {
  await ensureInitialAdminIfConfigured();

  const normalized = email.trim().toLowerCase();

  if (isPostgresConfigured()) {
    await ensureSchema();
    const result = await sql<{
      id: string;
      email: string;
      name: string;
      password_hash: string;
      created_at: Date | string;
      disabled: boolean;
    }>`
      SELECT id, email, name, password_hash, created_at, disabled
      FROM admin_users
      WHERE email = ${normalized}
      LIMIT 1
    `;

    const row = result.rows[0];
    if (!row) {
      return null;
    }

    return {
      id: row.id,
      email: row.email,
      name: row.name,
      passwordHash: row.password_hash,
      createdAt: (row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at)),
      disabled: row.disabled,
    };
  }

  const users = await readUsersFile();
  return users.find((user) => user.email === normalized) ?? null;
}

export async function createAdminUser(input: {
  email: string;
  name: string;
  password: string;
}): Promise<Omit<AdminUser, "passwordHash">> {
  const normalizedEmail = input.email.trim().toLowerCase();

  if (isPostgresConfigured()) {
    await ensureSchema();

    const existing = await sql<{ id: string }>`SELECT id FROM admin_users WHERE email = ${normalizedEmail} LIMIT 1`;
    if (existing.rows.length > 0) {
      throw new Error("User already exists");
    }

    const passwordHash = await bcrypt.hash(input.password, 12);
    const now = new Date().toISOString();
    const user: AdminUser = {
      id: randomUUID(),
      email: normalizedEmail,
      name: input.name.trim() || normalizedEmail,
      passwordHash,
      createdAt: now,
      disabled: false,
    };

    await sql`
      INSERT INTO admin_users (id, email, name, password_hash, created_at, disabled)
      VALUES (${user.id}, ${user.email}, ${user.name}, ${user.passwordHash}, ${user.createdAt}, false)
    `;

    const { passwordHash: _, ...safe } = user;
    return safe;
  }

  const existing = await readUsersFile();
  if (existing.some((user) => user.email === normalizedEmail)) {
    throw new Error("User already exists");
  }

  const passwordHash = await bcrypt.hash(input.password, 12);
  const user: AdminUser = {
    id: randomUUID(),
    email: normalizedEmail,
    name: input.name.trim() || normalizedEmail,
    passwordHash,
    createdAt: new Date().toISOString(),
    disabled: false,
  };

  const next = [...existing, user];
  await writeUsersFile(next);

  const { passwordHash: _, ...safe } = user;
  return safe;
}

export async function verifyAdminPassword(user: AdminUser, password: string) {
  return bcrypt.compare(password, user.passwordHash);
}

export async function setAdminUserDisabled(userId: string, disabled: boolean) {
  if (isPostgresConfigured()) {
    await ensureSchema();

    const current = await sql<{ id: string; disabled: boolean }>`
      SELECT id, disabled FROM admin_users WHERE id = ${userId} LIMIT 1
    `;
    const row = current.rows[0];
    if (!row) {
      throw new Error("User not found");
    }

    if (disabled) {
      const enabledCountResult = await sql<{ count: string }>`
        SELECT COUNT(*)::text as count FROM admin_users WHERE disabled = false AND id <> ${userId}
      `;
      const enabledCount = Number(enabledCountResult.rows[0]?.count ?? "0");
      if (enabledCount === 0) {
        throw new Error("Cannot disable the last enabled admin user");
      }
    }

    const updated = await sql<{
      id: string;
      email: string;
      name: string;
      password_hash: string;
      created_at: Date | string;
      disabled: boolean;
    }>`
      UPDATE admin_users
      SET disabled = ${disabled}
      WHERE id = ${userId}
      RETURNING id, email, name, password_hash, created_at, disabled
    `;

    const next = updated.rows[0];
    if (!next) {
      throw new Error("User not found");
    }

    return toSafeAdminUser({
      id: next.id,
      email: next.email,
      name: next.name,
      passwordHash: next.password_hash,
      createdAt: (next.created_at instanceof Date ? next.created_at.toISOString() : String(next.created_at)),
      disabled: next.disabled,
    });
  }

  const users = await readUsersFile();
  const index = users.findIndex((user) => user.id === userId);

  if (index === -1) {
    throw new Error("User not found");
  }

  if (disabled) {
    const enabledCount = users.filter((u) => !u.disabled && u.id !== userId).length;
    if (enabledCount === 0) {
      throw new Error("Cannot disable the last enabled admin user");
    }
  }

  users[index] = { ...users[index], disabled };
  await writeUsersFile(users);

  return toSafeAdminUser(users[index]);
}

export function toSafeAdminUser(user: AdminUser): Omit<AdminUser, "passwordHash"> {
  const { passwordHash: _, ...safe } = user;
  return safe;
}
