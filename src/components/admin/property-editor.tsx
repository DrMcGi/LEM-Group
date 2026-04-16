"use client";

import { useMemo, useState } from "react";
import type { Property, RoomAvailability, RoomTenantDetails } from "@/types";

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
  const [deleting, setDeleting] = useState<Record<string, boolean>>({});

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

  function updateTenantDetails(roomId: string, patch: Partial<RoomTenantDetails>) {
    const currentRoom = rooms.find((room) => room.id === roomId);
    const currentBooking = currentRoom?.bookingDetails ?? {};
    const currentTenant: RoomTenantDetails = currentBooking.tenantDetails ?? {
      firstName: "",
      lastName: "",
    };

    const nextTenant: RoomTenantDetails = {
      ...currentTenant,
      ...patch,
    };

    const fullName = `${nextTenant.firstName} ${nextTenant.lastName}`.trim();

    updateRoom(roomId, {
      bookingDetails: {
        ...currentBooking,
        tenant: fullName || undefined,
        tenantDetails: nextTenant,
      },
    });
  }

  function isBlobUrl(url: string) {
    return url.includes(".blob.vercel-storage.com/");
  }

  function toDownloadUrl(url: string) {
    if (!url) return "";
    if (url.startsWith("/api/admin/blob")) return url;
    if (url.startsWith("/api/blob")) return url.replace(/^\/api\/blob/, "/api/admin/blob");
    if (isBlobUrl(url)) return `/api/admin/blob?url=${encodeURIComponent(url)}`;
    return url;
  }

  async function deleteRoomImage(roomId: string, imageUrl: string) {
    const nextImages = (rooms.find((r) => r.id === roomId)?.images ?? []).filter((url) => url !== imageUrl);

    const blobDelete = isBlobUrl(imageUrl) || imageUrl.startsWith("/api/blob");
    const message = blobDelete
      ? "This will permanently delete the uploaded image from storage and remove it from this room. Continue?"
      : "This will remove the image URL from this room. Continue?";

    if (!confirm(message)) {
      return;
    }

    setDeleting((prev) => ({ ...prev, [imageUrl]: true }));
    setStatus("");

    try {
      if (blobDelete) {
        const response = await fetch("/api/admin/blob", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: imageUrl }),
        });

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as { error?: string } | null;
          setStatus(payload?.error ?? "Could not delete image.");
          return;
        }
      }

      updateRoom(roomId, { images: nextImages });
      setStatus("Image deleted. Remember to Save changes.");
    } catch {
      setStatus("Could not delete image.");
    } finally {
      setDeleting((prev) => ({ ...prev, [imageUrl]: false }));
    }
  }

  async function uploadRoomAsset(roomId: string, file: File, kind: "image" | "lease") {
    const key = kind === "lease" ? `${roomId}:lease` : roomId;
    setUploading((prev) => ({ ...prev, [key]: true }));
    setStatus("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("propertyId", property.id);
      formData.append("roomId", roomId);
      formData.append("kind", kind);

      const response = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      const payload = (await response.json().catch(() => null)) as { url?: string; error?: string } | null;
      if (!response.ok || !payload?.url) {
        setStatus(payload?.error ?? (kind === "lease" ? "Lease upload failed." : "Image upload failed."));
        return;
      }

      if (kind === "image") {
        updateRoom(roomId, {
          images: [...(rooms.find((r) => r.id === roomId)?.images ?? []), payload.url],
        });
        setStatus("Image uploaded. Remember to Save changes.");
        return;
      }

      const current = rooms.find((r) => r.id === roomId);
      updateRoom(roomId, {
        bookingDetails: {
          ...(current?.bookingDetails ?? {}),
          leaseAgreementUrl: payload.url,
        },
      });
      setStatus("Lease uploaded. Remember to Save changes.");
    } catch {
      setStatus(kind === "lease" ? "Lease upload failed." : "Image upload failed.");
    } finally {
      setUploading((prev) => ({ ...prev, [key]: false }));
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
    // Store inclusive dates as end-of-day UTC.
    return `${value}T23:59:59.999Z`;
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
                  <th className="px-4 py-3 font-semibold text-stone-700">Booking credentials</th>
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
                    <td className="px-4 py-3 align-top">
                      <details className="rounded-xl border border-stone-200 bg-white px-3 py-2">
                        <summary className="cursor-pointer text-xs font-semibold text-stone-800">
                          {room.bookingDetails?.tenantDetails?.firstName || room.bookingDetails?.tenantDetails?.lastName || room.bookingDetails?.tenant
                            ? `Edit tenant & lease (${[
                                room.bookingDetails?.tenantDetails?.firstName,
                                room.bookingDetails?.tenantDetails?.lastName,
                              ]
                                .filter(Boolean)
                                .join(" ")
                                .trim() || room.bookingDetails?.tenant || ""})`
                            : "Add tenant & lease"}
                        </summary>

                        <div className="mt-3 grid gap-3">
                          <div className="grid gap-2 sm:grid-cols-2">
                            <label className="grid gap-1 text-xs font-semibold text-stone-700">
                              First name
                              <input
                                value={room.bookingDetails?.tenantDetails?.firstName ?? ""}
                                onChange={(e) => updateTenantDetails(room.id, { firstName: e.target.value })}
                                className="rounded-lg border border-stone-300 bg-white px-2 py-1 text-sm font-semibold text-stone-800 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/30"
                                placeholder="First name"
                              />
                            </label>
                            <label className="grid gap-1 text-xs font-semibold text-stone-700">
                              Last name
                              <input
                                value={room.bookingDetails?.tenantDetails?.lastName ?? ""}
                                onChange={(e) => updateTenantDetails(room.id, { lastName: e.target.value })}
                                className="rounded-lg border border-stone-300 bg-white px-2 py-1 text-sm font-semibold text-stone-800 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/30"
                                placeholder="Last name"
                              />
                            </label>
                          </div>

                          <div className="grid gap-2 sm:grid-cols-2">
                            <label className="grid gap-1 text-xs font-semibold text-stone-700">
                              Phone number
                              <input
                                value={room.bookingDetails?.tenantDetails?.phoneNumber ?? ""}
                                onChange={(e) => updateTenantDetails(room.id, { phoneNumber: e.target.value.trim() || undefined })}
                                className="rounded-lg border border-stone-300 bg-white px-2 py-1 text-sm font-semibold text-stone-800 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/30"
                                placeholder="e.g. 0712345678"
                              />
                            </label>
                            <label className="grid gap-1 text-xs font-semibold text-stone-700">
                              Email
                              <input
                                type="email"
                                value={room.bookingDetails?.tenantDetails?.email ?? ""}
                                onChange={(e) => updateTenantDetails(room.id, { email: e.target.value.trim() || undefined })}
                                className="rounded-lg border border-stone-300 bg-white px-2 py-1 text-sm font-semibold text-stone-800 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/30"
                                placeholder="e.g. tenant@email.com"
                              />
                            </label>
                          </div>

                          <div className="grid gap-2 sm:grid-cols-2">
                            <label className="grid gap-1 text-xs font-semibold text-stone-700">
                              ID number
                              <input
                                value={room.bookingDetails?.tenantDetails?.idNumber ?? ""}
                                onChange={(e) => updateTenantDetails(room.id, { idNumber: e.target.value.trim() || undefined })}
                                className="rounded-lg border border-stone-300 bg-white px-2 py-1 text-sm font-semibold text-stone-800 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/30"
                                placeholder="ID / Passport"
                              />
                            </label>
                          </div>

                          <label className="grid gap-1 text-xs font-semibold text-stone-700">
                            Residential address
                            <textarea
                              value={room.bookingDetails?.tenantDetails?.residentialAddress ?? ""}
                              onChange={(e) => updateTenantDetails(room.id, { residentialAddress: e.target.value.trim() || undefined })}
                              rows={2}
                              className="rounded-lg border border-stone-300 bg-white px-2 py-1 text-sm font-medium text-stone-800 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/30"
                              placeholder="Street, suburb, city"
                            />
                          </label>

                          <label className="grid gap-1 text-xs font-semibold text-stone-700">
                            Notes (optional)
                            <textarea
                              value={room.bookingDetails?.tenantDetails?.notes ?? ""}
                              onChange={(e) => updateTenantDetails(room.id, { notes: e.target.value.trim() || undefined })}
                              rows={2}
                              className="rounded-lg border border-stone-300 bg-white px-2 py-1 text-sm font-medium text-stone-800 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/30"
                              placeholder="Anything important for records"
                            />
                          </label>

                          <div className="rounded-xl border border-stone-200 bg-stone-50 p-3">
                            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-700">Lease agreement (PDF)</p>

                            {room.bookingDetails?.leaseAgreementUrl ? (
                              <a
                                href={toDownloadUrl(room.bookingDetails.leaseAgreementUrl)}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-2 inline-flex text-sm font-semibold text-teal-800 underline underline-offset-4"
                              >
                                Download current lease
                              </a>
                            ) : (
                              <p className="mt-2 text-xs text-stone-600">No lease uploaded yet. (Manual upload supported)</p>
                            )}

                            <div className="mt-3 flex flex-wrap items-center gap-2">
                              <label className="inline-flex items-center gap-2 rounded-xl border border-stone-300 bg-white px-3 py-1.5 text-sm font-semibold text-stone-800 transition hover:bg-stone-50">
                                <input
                                  type="file"
                                  accept="application/pdf"
                                  className="hidden"
                                  disabled={Boolean(uploading[`${room.id}:lease`])}
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    e.currentTarget.value = "";
                                    if (!file) return;
                                    uploadRoomAsset(room.id, file, "lease");
                                  }}
                                />
                                {uploading[`${room.id}:lease`] ? "Uploading..." : "Upload lease PDF"}
                              </label>
                              <span className="text-xs text-stone-500">Stored for records. (Payment/signing placeholders for later.)</span>
                            </div>
                          </div>
                        </div>
                      </details>
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

                      {(room.images ?? []).length ? (
                        <div className="mt-2 space-y-2">
                          {(room.images ?? []).map((url) => (
                            <div key={url} className="flex items-center justify-between gap-3 rounded-lg border border-stone-200 bg-white px-2 py-1">
                              <p className="text-xs text-stone-700 truncate" title={url}>
                                {url}
                              </p>
                              <button
                                type="button"
                                disabled={Boolean(deleting[url])}
                                onClick={() => deleteRoomImage(room.id, url)}
                                className="shrink-0 rounded-lg border border-stone-300 bg-white px-2 py-1 text-xs font-semibold text-stone-800 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {deleting[url] ? "Deleting..." : "Delete"}
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : null}

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
                              uploadRoomAsset(room.id, file, "image");
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
