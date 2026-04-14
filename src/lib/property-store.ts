import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Property, RoomAvailability } from "@/types";
import { properties as seedProperties } from "@/data/properties";

const storageDirectory = path.join(process.cwd(), "storage");
const propertiesFile = path.join(storageDirectory, "properties.json");

async function ensureStorage() {
  await mkdir(storageDirectory, { recursive: true });
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
  await writeFile(propertiesFile, JSON.stringify(properties, null, 2), "utf8");
}

async function ensureSeeded() {
  const existing = await readPropertiesFile();
  if (existing && existing.length) {
    return;
  }

  await writePropertiesFile(seedProperties);
}

export async function getProperties(): Promise<Property[]> {
  await ensureSeeded();
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
  await writePropertiesFile(list);

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
