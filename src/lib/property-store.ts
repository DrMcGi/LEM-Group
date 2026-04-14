import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Property, RoomAvailability } from "@/types";
import { properties as seedProperties } from "@/data/properties";
import { ensureSchema, isPostgresConfigured, isVercelRuntime, sql } from "@/lib/db";

const storageDirectory = path.join(process.cwd(), "storage");
const propertiesFile = path.join(storageDirectory, "properties.json");

async function ensureStorage() {
  try {
    await mkdir(storageDirectory, { recursive: true });
  } catch {
    // On Vercel/serverless the filesystem may be read-only; ignore and fall back.
  }
}

async function readPropertiesFile(): Promise<Property[] | null> {
  await ensureStorage();

  try {
    const fileContent = await readFile(propertiesFile, "utf8");
    const parsed = JSON.parse(fileContent) as Property[];
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

async function writePropertiesFile(properties: Property[]) {
  await ensureStorage();

  if (isVercelRuntime()) {
    throw new Error("Persistent storage is not configured. Connect Postgres on Vercel (POSTGRES_URL) to enable saving changes.");
  }

  await writeFile(propertiesFile, JSON.stringify(properties, null, 2), "utf8");
}

async function ensureSeeded() {
  if (isPostgresConfigured()) {
    await ensureSchema();

    const countResult = await sql<{ count: string }>`SELECT COUNT(*)::text as count FROM properties`;
    const count = Number(countResult.rows[0]?.count ?? "0");
    if (count > 0) {
      return;
    }

    for (const property of seedProperties) {
      const json = JSON.stringify(property);
      await sql`
        INSERT INTO properties (id, data, updated_at)
        VALUES (${property.id}, ${json}::jsonb, NOW())
        ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = EXCLUDED.updated_at
      `;
    }

    return;
  }

  const existing = await readPropertiesFile();
  if (existing && existing.length) {
    return;
  }

  if (isVercelRuntime()) {
    // Avoid crashing the entire site on Vercel if Postgres isn't connected yet.
    return;
  }

  await writePropertiesFile(seedProperties);
}

export async function getProperties(): Promise<Property[]> {
  await ensureSeeded();

  if (isPostgresConfigured()) {
    await ensureSchema();
    const result = await sql<{ id: string; data: unknown }>`SELECT id, data FROM properties`;

    const list = result.rows
      .map((row) => {
        const data = row.data;
        if (typeof data === "string") {
          return JSON.parse(data) as Property;
        }
        return data as Property;
      })
      .filter(Boolean);

    if (list.length > 0) {
      return list;
    }
  }

  const stored = await readPropertiesFile();
  return stored ?? seedProperties;
}

export async function getPropertyMap(): Promise<Map<string, Property>> {
  const list = await getProperties();
  return new Map(list.map((property) => [property.id, property] as const));
}

export async function getPropertyById(propertyId: string): Promise<Property | null> {
  const list = await getProperties();
  return list.find((item) => item.id === propertyId) ?? null;
}

export async function updateProperty(propertyId: string, patch: Partial<Property>): Promise<Property> {
  const list = await getProperties();
  const index = list.findIndex((item) => item.id === propertyId);

  if (index === -1) {
    throw new Error("Property not found");
  }

  const next: Property = {
    ...list[index],
    ...patch,
    location: patch.location ? { ...list[index].location, ...patch.location } : list[index].location,
  };

  list[index] = next;
  if (isPostgresConfigured()) {
    await ensureSchema();
    const json = JSON.stringify(next);
    await sql`
      INSERT INTO properties (id, data, updated_at)
      VALUES (${propertyId}, ${json}::jsonb, NOW())
      ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = EXCLUDED.updated_at
    `;
  } else {
    await writePropertiesFile(list);
  }

  return next;
}

export async function updateRoomAvailability(propertyId: string, roomId: string, availability: RoomAvailability) {
  const property = await getPropertyById(propertyId);
  if (!property) {
    throw new Error("Property not found");
  }
  if (!property.rooms) {
    throw new Error("Property has no rooms");
  }

  const rooms = property.rooms.map((room) => (room.id === roomId ? { ...room, availability } : room));
  return updateProperty(propertyId, { rooms });
}
