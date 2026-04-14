import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { InquiryInput, InquiryRecord } from "@/types";

const storageDirectory = path.join(process.cwd(), "storage");
const inquiriesFile = path.join(storageDirectory, "inquiries.json");

async function ensureStorage() {
  await mkdir(storageDirectory, { recursive: true });
}

export async function getInquiries(): Promise<InquiryRecord[]> {
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
  const existing = await getInquiries();

  const record: InquiryRecord = {
    ...input,
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    status: "new",
  };

  const next = [record, ...existing];
  await writeFile(inquiriesFile, JSON.stringify(next, null, 2), "utf8");

  return record;
}

export async function updateInquiry(
  inquiryId: string,
  patch: Partial<Pick<InquiryRecord, "status" | "updatedAt">>,
): Promise<InquiryRecord> {
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
