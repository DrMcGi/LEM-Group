import type { EnquiryInput, EnquiryRecord } from "@/types";
import {
  getInquiries,
  saveInquiry,
  updateInquiry,
} from "@/lib/inquiry-store";

export async function getEnquiries(): Promise<EnquiryRecord[]> {
  return getInquiries();
}

export async function saveEnquiry(input: EnquiryInput): Promise<EnquiryRecord> {
  return saveInquiry(input);
}

export async function updateEnquiry(
  enquiryId: string,
  patch: Partial<Pick<EnquiryRecord, "status" | "updatedAt">>,
): Promise<EnquiryRecord> {
  return updateInquiry(enquiryId, patch);
}
