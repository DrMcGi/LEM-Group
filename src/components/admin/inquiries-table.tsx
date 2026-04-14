"use client";

import { useMemo, useState } from "react";
import type { InquiryRecord, Property } from "@/types";

type Props = {
  inquiries: InquiryRecord[];
  properties: Property[];
};

type Status = InquiryRecord["status"];

export function InquiriesTable({ inquiries, properties }: Props) {
  const propertyMap = useMemo(() => new Map(properties.map((p) => [p.id, p.name] as const)), [properties]);
  const [local, setLocal] = useState(inquiries);
  const [saving, setSaving] = useState<Record<string, boolean>>({});

  async function updateStatus(inquiryId: string, status: Status) {
    setSaving((prev) => ({ ...prev, [inquiryId]: true }));

    try {
      const response = await fetch(`/api/admin/enquiries/${encodeURIComponent(inquiryId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        return;
      }

      setLocal((prev) => prev.map((item) => (item.id === inquiryId ? { ...item, status } : item)));
    } finally {
      setSaving((prev) => ({ ...prev, [inquiryId]: false }));
    }
  }

  return (
    <div className="mt-8 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
      <table className="w-full border-collapse text-left text-sm">
        <thead className="bg-stone-50">
          <tr>
            <th className="px-4 py-3 font-semibold text-stone-700">Date</th>
            <th className="px-4 py-3 font-semibold text-stone-700">Name</th>
            <th className="px-4 py-3 font-semibold text-stone-700">Contact</th>
            <th className="px-4 py-3 font-semibold text-stone-700">Property</th>
            <th className="px-4 py-3 font-semibold text-stone-700">Message</th>
            <th className="px-4 py-3 font-semibold text-stone-700">Status</th>
          </tr>
        </thead>
        <tbody>
          {local.map((inquiry) => (
            <tr key={inquiry.id} className="border-t border-stone-100 align-top">
              <td className="px-4 py-3 text-stone-600 whitespace-nowrap">{new Date(inquiry.createdAt).toLocaleString()}</td>
              <td className="px-4 py-3 font-medium text-stone-900">{inquiry.fullName}</td>
              <td className="px-4 py-3 text-stone-700">
                <div>{inquiry.phoneNumber}</div>
                <div className="break-all">{inquiry.email}</div>
              </td>
              <td className="px-4 py-3 text-stone-700">{propertyMap.get(inquiry.propertyId) ?? inquiry.propertyId}</td>
              <td className="px-4 py-3 text-stone-700">{inquiry.message}</td>
              <td className="px-4 py-3 text-stone-700 whitespace-nowrap">
                <select
                  value={inquiry.status ?? "new"}
                  onChange={(e) => updateStatus(inquiry.id, e.target.value as Status)}
                  disabled={Boolean(saving[inquiry.id])}
                  className="rounded-lg border border-stone-300 bg-white px-2 py-1 text-sm font-semibold text-stone-800 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/30 disabled:opacity-60"
                >
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="archived">Archived</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {!local.length ? <p className="px-4 py-8 text-center text-stone-600">No enquiries yet.</p> : null}
    </div>
  );
}

export const EnquiriesTable = InquiriesTable;
