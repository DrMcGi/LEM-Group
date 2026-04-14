import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { InquiryInput, InquiryRecord } from "@/types";
import { ensureSchema, isPostgresConfigured, isVercelRuntime, sql } from "@/lib/db";

const storageDirectory = path.join(process.cwd(), "storage");
const inquiriesFile = path.join(storageDirectory, "inquiries.json");

async function ensureStorage() {
  try {
    await mkdir(storageDirectory, { recursive: true });
  } catch {
    // On Vercel/serverless the filesystem may be read-only; ignore and fall back.
  }
}

export async function getInquiries(): Promise<InquiryRecord[]> {
  if (isPostgresConfigured()) {
    await ensureSchema();

    const result = await sql<{
      id: string;
      fullName: string;
      phoneNumber: string;
      email: string;
      propertyId: string;
      message: string;
      createdAt: Date | string;
      status: "new" | "contacted" | "archived" | string;
      updatedAt: Date | string | null;
    }>`
      SELECT
        id,
        full_name as "fullName",
        phone_number as "phoneNumber",
        email,
        property_id as "propertyId",
        message,
        created_at as "createdAt",
        status,
        updated_at as "updatedAt"
      FROM enquiries
      ORDER BY created_at DESC
    `;

    return result.rows.map((row) => ({
      id: row.id,
      fullName: row.fullName,
      phoneNumber: row.phoneNumber,
      email: row.email,
      propertyId: row.propertyId,
      message: row.message,
      createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
      status: (row.status as InquiryRecord["status"]) ?? "new",
      updatedAt: row.updatedAt ? (row.updatedAt instanceof Date ? row.updatedAt.toISOString() : String(row.updatedAt)) : undefined,
    }));
  }

  await ensureStorage();

  try {
    const fileContent = await readFile(inquiriesFile, "utf8");
    const parsed = JSON.parse(fileContent) as InquiryRecord[];
    const normalized = (Array.isArray(parsed) ? parsed : []).map((record) => ({
      ...record,
      status: record.status ?? "new",
    }));
    return normalized.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  } catch {
    return [];
  }
}

export async function saveInquiry(input: InquiryInput): Promise<InquiryRecord> {
  const record: InquiryRecord = {
    ...input,
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    status: "new",
  };

  if (isPostgresConfigured()) {
    await ensureSchema();
    await sql`
      INSERT INTO enquiries (id, full_name, phone_number, email, property_id, message, created_at, status)
      VALUES (
        ${record.id},
        ${record.fullName},
        ${record.phoneNumber},
        ${record.email},
        ${record.propertyId},
        ${record.message},
        ${record.createdAt},
        ${record.status}
      )
    `;
    return record;
  }

  if (isVercelRuntime()) {
    throw new Error("Persistent storage is not configured. Connect Postgres on Vercel (POSTGRES_URL) to accept enquiries.");
  }

  const existing = await getInquiries();
  const next = [record, ...existing];
  await writeFile(inquiriesFile, JSON.stringify(next, null, 2), "utf8");
  return record;
}

export async function updateInquiry(
  inquiryId: string,
  patch: Partial<Pick<InquiryRecord, "status" | "updatedAt">>,
): Promise<InquiryRecord> {
  if (isPostgresConfigured()) {
    await ensureSchema();

    const status = patch.status ?? "new";
    const result = await sql<{
      id: string;
      fullName: string;
      phoneNumber: string;
      email: string;
      propertyId: string;
      message: string;
      createdAt: Date | string;
      status: "new" | "contacted" | "archived" | string;
      updatedAt: Date | string | null;
    }>`
      UPDATE enquiries
      SET status = ${status}, updated_at = NOW()
      WHERE id = ${inquiryId}
      RETURNING
        id,
        full_name as "fullName",
        phone_number as "phoneNumber",
        email,
        property_id as "propertyId",
        message,
        created_at as "createdAt",
        status,
        updated_at as "updatedAt"
    `;

    const row = result.rows[0];
    if (!row) {
      throw new Error("Inquiry not found");
    }

    return {
      id: row.id,
      fullName: row.fullName,
      phoneNumber: row.phoneNumber,
      email: row.email,
      propertyId: row.propertyId,
      message: row.message,
      createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
      status: (row.status as InquiryRecord["status"]) ?? "new",
      updatedAt: row.updatedAt ? (row.updatedAt instanceof Date ? row.updatedAt.toISOString() : String(row.updatedAt)) : undefined,
    };
  }

  if (isVercelRuntime()) {
    throw new Error("Persistent storage is not configured. Connect Postgres on Vercel (POSTGRES_URL) to update enquiries.");
  }

  const existing = await getInquiries();
  const index = existing.findIndex((inquiry) => inquiry.id === inquiryId);

  if (index === -1) {
    throw new Error("Inquiry not found");
  }

  const current = existing[index];
  const next: InquiryRecord = {
    ...current,
    ...patch,
    updatedAt: new Date().toISOString(),
    status: patch.status ?? current.status ?? "new",
  };

  const updated = [...existing];
  updated[index] = next;
  await writeFile(inquiriesFile, JSON.stringify(updated, null, 2), "utf8");

  return next;
}
