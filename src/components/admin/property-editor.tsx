"use client";

import { useMemo, useState } from "react";
import type { Property, RoomAvailability } from "@/types";

type Props = {
  property: Property;
};

export function PropertyEditor({ property }: Props) {
  const [name, setName] = useState(property.name);
  const [summary, setSummary] = useState(property.summary);
  const [pricePerMonth, setPricePerMonth] = useState<number>(property.pricePerMonth);
  const [rooms, setRooms] = useState(property.rooms ?? []);
  const [status, setStatus] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<Record<string, boolean>>({});

  const hasRooms = useMemo(() => rooms.length > 0, [rooms.length]);

  async function save() {
    setSaving(true);
    setStatus("");

    try {
      const response = await fetch(`/api/admin/properties/${encodeURIComponent(property.id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          summary,
          pricePerMonth,
          rooms: hasRooms ? rooms : undefined,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        setStatus(payload?.error ?? "Could not save changes.");
        return;
      }

      setStatus("Saved.");
    } catch {
      setStatus("Could not save changes.");
    } finally {
      setSaving(false);
    }
  }

  function updateRoom(roomId: string, patch: Partial<(typeof rooms)[number]>) {
    setRooms((prev) => prev.map((room) => (room.id === roomId ? { ...room, ...patch } : room)));
  }

  async function uploadRoomImage(roomId: string, file: File) {
    setUploading((prev) => ({ ...prev, [roomId]: true }));
    setStatus("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("propertyId", property.id);
      formData.append("roomId", roomId);

      const response = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      const payload = (await response.json().catch(() => null)) as { url?: string; error?: string } | null;
      if (!response.ok || !payload?.url) {
        setStatus(payload?.error ?? "Image upload failed.");
        return;
      }

      updateRoom(roomId, {
        images: [...(rooms.find((r) => r.id === roomId)?.images ?? []), payload.url],
      });
      setStatus("Image uploaded. Remember to Save changes.");
    } catch {
      setStatus("Image upload failed.");
    } finally {
      setUploading((prev) => ({ ...prev, [roomId]: false }));
    }
  }

  function toDateInputValue(value?: string) {
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    return d.toISOString().slice(0, 10);
  }

  function fromDateInputValue(value: string) {
    if (!value) return undefined;
    return `${value}T00:00:00.000Z`;
  }

  return (
    <div className="rounded-3xl border border-black/10 bg-white/90 p-6 shadow-lg sm:p-8">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-semibold text-stone-800">
          Property name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-xl border border-stone-300 bg-white px-3 py-2 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/40"
          />
        </label>

        <label className="grid gap-2 text-sm font-semibold text-stone-800">
          Starting price (per month)
          <input
            type="number"
            value={pricePerMonth}
            onChange={(e) => setPricePerMonth(Number(e.target.value))}
            className="rounded-xl border border-stone-300 bg-white px-3 py-2 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/40"
          />
        </label>

        <label className="md:col-span-2 grid gap-2 text-sm font-semibold text-stone-800">
          Summary
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            className="min-h-24 rounded-xl border border-stone-300 bg-white px-3 py-2 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/40"
          />
        </label>
      </div>

      {hasRooms ? (
        <div className="mt-8">
          <h2 className="text-xl font-bold tracking-tight text-stone-900">Rooms</h2>
          <p className="mt-1 text-sm text-stone-600">Update availability, pricing, booking info and images per room.</p>

          <div className="mt-4 overflow-hidden rounded-2xl border border-stone-200">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-stone-50">
                <tr>
                  <th className="px-4 py-3 font-semibold text-stone-700">Room</th>
                  <th className="px-4 py-3 font-semibold text-stone-700">Price / month</th>
                  <th className="px-4 py-3 font-semibold text-stone-700">Availability</th>
                  <th className="px-4 py-3 font-semibold text-stone-700">Booked until</th>
                  <th className="px-4 py-3 font-semibold text-stone-700">Tenant (optional)</th>
                  <th className="px-4 py-3 font-semibold text-stone-700">Images (one per line)</th>
                </tr>
              </thead>
              <tbody>
                {rooms.map((room) => (
                  <tr key={room.id} className="border-t border-stone-100">
                    <td className="px-4 py-3 font-semibold text-stone-900">{room.roomNumber}</td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        value={room.pricePerMonth}
                        onChange={(e) => updateRoom(room.id, { pricePerMonth: Number(e.target.value) })}
                        className="w-36 rounded-lg border border-stone-300 bg-white px-2 py-1 font-semibold text-stone-800 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/30"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={room.availability}
                        onChange={(e) => updateRoom(room.id, { availability: e.target.value as RoomAvailability })}
                        className="rounded-lg border border-stone-300 bg-white px-2 py-1 font-semibold text-stone-800 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/30"
                      >
                        <option value="available">Available</option>
                        <option value="booked">Booked</option>
                        <option value="maintenance">Maintenance</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="date"
                        value={toDateInputValue(room.bookingDetails?.bookedUntil)}
                        onChange={(e) => {
                          const bookedUntil = fromDateInputValue(e.target.value);
                          updateRoom(room.id, {
                            bookingDetails: {
                              ...(room.bookingDetails ?? {}),
                              bookedUntil,
                            },
                          });
                        }}
                        className="w-40 rounded-lg border border-stone-300 bg-white px-2 py-1 font-semibold text-stone-800 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/30"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        value={room.bookingDetails?.tenant ?? ""}
                        onChange={(e) => {
                          const tenant = e.target.value;
                          updateRoom(room.id, {
                            bookingDetails: {
                              ...(room.bookingDetails ?? {}),
                              tenant: tenant || undefined,
                            },
                          });
                        }}
                        className="w-44 rounded-lg border border-stone-300 bg-white px-2 py-1 font-semibold text-stone-800 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/30"
                        placeholder="e.g. John D."
                      />
                    </td>
                    <td className="px-4 py-3">
                      <textarea
                        value={(room.images ?? []).join("\n")}
                        onChange={(e) => {
                          const lines = e.target.value
                            .split("\n")
                            .map((line) => line.trim())
                            .filter(Boolean);
                          updateRoom(room.id, { images: lines });
                        }}
                        rows={3}
                        className="min-w-[16rem] rounded-lg border border-stone-300 bg-white px-2 py-1 text-sm font-medium text-stone-800 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/30"
                        placeholder="/images/polokwane/room-1.jpg\nhttps://..."
                      />
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <label className="inline-flex items-center gap-2 rounded-xl border border-stone-300 bg-white px-3 py-1.5 text-sm font-semibold text-stone-800 transition hover:bg-stone-50">
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            disabled={Boolean(uploading[room.id])}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              e.currentTarget.value = "";
                              if (!file) return;
                              uploadRoomImage(room.id, file);
                            }}
                          />
                          {uploading[room.id] ? "Uploading..." : "Upload image"}
                        </label>
                        <span className="text-xs text-stone-500">
                          Uploads to Vercel Blob and appends the URL.
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-stone-500">
                        You can also paste paths from <span className="font-semibold">public</span> (e.g. /images/...) or full URLs.
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="inline-flex items-center justify-center rounded-xl bg-teal-700 px-5 py-2.5 font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save changes"}
        </button>

        {status ? <p className="text-sm font-semibold text-stone-700">{status}</p> : null}
      </div>
    </div>
  );
}
