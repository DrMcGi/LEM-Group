import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Property, RoomAvailability } from "@/types";
import { properties as seedProperties } from "@/data/properties";
import { ensureSchema, isPostgresConfigured, isVercelRuntime, sql } from "@/lib/db";

const storageDirectory = path.join(process.cwd(), "storage");
const propertiesFile = path.join(storageDirectory, "properties.json");

const seedPropertyMap: Map<string, Property> = new Map(seedProperties.map((property) => [property.id, property] as const));

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
    try {
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
    } catch {
      // If Postgres is configured but temporarily unreachable (e.g. during build), fall back.
    }
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

function isBookingExpired(bookedUntil: string, now: Date) {
  const datePart = bookedUntil.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
    const parsed = new Date(bookedUntil);
    if (Number.isNaN(parsed.getTime())) return false;
    const normalized = parsed.toISOString().slice(0, 10);
    const endOfDay = new Date(`${normalized}T23:59:59.999Z`);
    return now.getTime() > endOfDay.getTime();
  }

  const endOfDay = new Date(`${datePart}T23:59:59.999Z`);
  return now.getTime() > endOfDay.getTime();
}

function normalizeExpiredBookings(list: Property[], now: Date) {
  let changed = false;
  const changedPropertyIds = new Set<string>();

  const next = list.map((property) => {
    if (!property.rooms || property.rooms.length === 0) {
      return property;
    }

    let roomsChanged = false;
    const nextRooms = property.rooms.map((room) => {
      const bookedUntil = room.bookingDetails?.bookedUntil;
      if (room.availability !== "booked" || !bookedUntil) {
        return room;
      }

      if (!isBookingExpired(bookedUntil, now)) {
        return room;
      }

      roomsChanged = true;
      changed = true;

      return {
        ...room,
        availability: "available" as const,
        lastBookingDetails: room.bookingDetails,
        bookingDetails: undefined,
      };
    });

    if (!roomsChanged) {
      return property;
    }

    changedPropertyIds.add(property.id);
    return {
      ...property,
      rooms: nextRooms,
    };
  });

  return { next, changed, changedPropertyIds };
}

function normalizeSeedBackfill(list: Property[]) {
  let changed = false;
  const changedPropertyIds = new Set<string>();

  const next = list.map((property) => {
    const seed = seedPropertyMap.get(property.id);
    if (!seed) {
      return property;
    }

    const patch: Partial<Property> = {};

    if ((!property.directionsUrl || property.directionsUrl.trim().length === 0) && seed.directionsUrl) {
      patch.directionsUrl = seed.directionsUrl;
    }

    if ((!property.mapEmbedUrl || property.mapEmbedUrl.trim().length === 0) && seed.mapEmbedUrl) {
      patch.mapEmbedUrl = seed.mapEmbedUrl;
    }

    if (Object.keys(patch).length === 0) {
      return property;
    }

    changed = true;
    changedPropertyIds.add(property.id);

    return {
      ...property,
      ...patch,
    };
  });

  return { next, changed, changedPropertyIds };
}

function normalizeProperties(list: Property[], now: Date) {
  const expired = normalizeExpiredBookings(list, now);
  const backfilled = normalizeSeedBackfill(expired.next);

  if (!expired.changed && !backfilled.changed) {
    return { next: backfilled.next, changed: false, changedPropertyIds: new Set<string>() };
  }

  const changedPropertyIds = new Set<string>([...expired.changedPropertyIds, ...backfilled.changedPropertyIds]);
  return { next: backfilled.next, changed: true, changedPropertyIds };
}

export async function getProperties(): Promise<Property[]> {
  await ensureSeeded();
  const now = new Date();

  if (isPostgresConfigured()) {
    try {
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
        const normalized = normalizeProperties(list, now);

        if (normalized.changed) {
          try {
            for (const propertyId of normalized.changedPropertyIds) {
              const property = normalized.next.find((item) => item.id === propertyId);
              if (!property) continue;
              const json = JSON.stringify(property);
              await sql`UPDATE properties SET data = ${json}::jsonb, updated_at = NOW() WHERE id = ${propertyId}`;
            }
          } catch {
            // Best-effort persistence; return normalized data even if saving fails.
          }
        }

        return normalized.next;
      }
    } catch {
      // If Postgres is configured but unreachable, fall back to local seed/file.
    }
  }

  const stored = await readPropertiesFile();
  const base = stored ?? seedProperties;
  const normalized = normalizeProperties(base, now);

  if (normalized.changed) {
    try {
      await writePropertiesFile(normalized.next);
    } catch {
      // Ignore (e.g. read-only filesystem on Vercel).
    }
  }

  return normalized.next;
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
