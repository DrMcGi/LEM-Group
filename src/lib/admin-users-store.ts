import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { AdminUser } from "@/types";

const storageDirectory = path.join(process.cwd(), "storage");
const usersFile = path.join(storageDirectory, "admin-users.json");

async function ensureStorage() {
  await mkdir(storageDirectory, { recursive: true });
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
  await writeFile(usersFile, JSON.stringify(users, null, 2), "utf8");
}

async function ensureInitialAdminIfConfigured() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME ?? "Administrator";

  if (!email || !password) {
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
  const users = await readUsersFile();

  return users.sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));
}

export async function findAdminUserByEmail(email: string): Promise<AdminUser | null> {
  await ensureInitialAdminIfConfigured();
  const users = await readUsersFile();
  const normalized = email.trim().toLowerCase();
  return users.find((user) => user.email === normalized) ?? null;
}

export async function createAdminUser(input: {
  email: string;
  name: string;
  password: string;
}): Promise<Omit<AdminUser, "passwordHash">> {
  const existing = await readUsersFile();
  const normalizedEmail = input.email.trim().toLowerCase();

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
