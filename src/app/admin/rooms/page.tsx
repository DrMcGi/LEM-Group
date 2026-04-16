import { AdminHeader } from "@/components/admin/admin-header";
import { getProperties } from "@/lib/property-store";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Rooms Summary | LEM Accommodation",
  robots: {
    index: false,
    follow: false,
  },
};

function formatDate(value?: string) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-ZA");
}

function toDownloadUrl(url: string) {
  if (!url) return "";
  if (url.startsWith("/api/admin/blob")) return url;
  if (url.startsWith("/api/blob")) return url.replace(/^\/api\/blob/, "/api/admin/blob");
  if (url.includes(".blob.vercel-storage.com/")) return `/api/admin/blob?url=${encodeURIComponent(url)}`;
  return url;
}

export default async function AdminRoomsSummaryPage() {
  const properties = await getProperties();

  const allRooms = properties
    .filter((p) => (p.rooms?.length ?? 0) > 0)
    .flatMap((property) =>
      (property.rooms ?? []).map((room) => ({
        property,
        room,
      })),
    );

  const booked = allRooms.filter(({ room }) => room.availability === "booked");
  const available = allRooms.filter(({ room }) => room.availability === "available");
  const maintenance = allRooms.filter(({ room }) => room.availability === "maintenance");

  return (
    <>
      <AdminHeader />
      <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold tracking-tight text-stone-900">Rooms summary</h1>
        <p className="mt-2 text-stone-700">
          Overview of booked vs available rooms, including tenant credentials and lease agreement placeholders.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Total rooms</p>
            <p className="mt-2 text-3xl font-black text-stone-900">{allRooms.length}</p>
          </div>
          <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Booked</p>
            <p className="mt-2 text-3xl font-black text-red-700">{booked.length}</p>
          </div>
          <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Available</p>
            <p className="mt-2 text-3xl font-black text-emerald-700">{available.length}</p>
          </div>
        </div>

        {maintenance.length ? (
          <p className="mt-4 text-sm text-stone-600">
            Maintenance rooms: <span className="font-semibold">{maintenance.length}</span>
          </p>
        ) : null}

        <section className="mt-10">
          <h2 className="text-2xl font-bold text-stone-900">Booked rooms</h2>
          <p className="mt-1 text-sm text-stone-600">Rooms marked as booked, with stored tenant credentials and lease PDFs (if uploaded).</p>

          <div className="mt-4 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-stone-50">
                <tr>
                  <th className="px-4 py-3 font-semibold text-stone-700">Property</th>
                  <th className="px-4 py-3 font-semibold text-stone-700">Room</th>
                  <th className="px-4 py-3 font-semibold text-stone-700">Booked until</th>
                  <th className="px-4 py-3 font-semibold text-stone-700">Tenant</th>
                  <th className="px-4 py-3 font-semibold text-stone-700">Contacts</th>
                  <th className="px-4 py-3 font-semibold text-stone-700">ID</th>
                  <th className="px-4 py-3 font-semibold text-stone-700">Address</th>
                  <th className="px-4 py-3 font-semibold text-stone-700">Lease PDF</th>
                </tr>
              </thead>
              <tbody>
                {booked.map(({ property, room }) => {
                  const tenantDetails = room.bookingDetails?.tenantDetails;
                  const tenantName =
                    [tenantDetails?.firstName, tenantDetails?.lastName].filter(Boolean).join(" ").trim() ||
                    room.bookingDetails?.tenant ||
                    "—";

                  return (
                    <tr key={`${property.id}:${room.id}`} className="border-t border-stone-100 align-top">
                      <td className="px-4 py-3 font-semibold text-stone-900">{property.name}</td>
                      <td className="px-4 py-3 font-semibold text-stone-900">{room.roomNumber}</td>
                      <td className="px-4 py-3 text-stone-700">{formatDate(room.bookingDetails?.bookedUntil)}</td>
                      <td className="px-4 py-3 text-stone-700">{tenantName || "—"}</td>
                      <td className="px-4 py-3 text-stone-700">
                        <div className="grid gap-1">
                          <div>{tenantDetails?.phoneNumber ?? "—"}</div>
                          <div className="break-all">{tenantDetails?.email ?? "—"}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-stone-700">{tenantDetails?.idNumber ?? "—"}</td>
                      <td className="px-4 py-3 text-stone-700">{tenantDetails?.residentialAddress ?? "—"}</td>
                      <td className="px-4 py-3 text-stone-700">
                        {room.bookingDetails?.leaseAgreementUrl ? (
                          <a
                            href={toDownloadUrl(room.bookingDetails.leaseAgreementUrl)}
                            target="_blank"
                            rel="noreferrer"
                            className="font-semibold text-teal-800 underline underline-offset-4"
                          >
                            Download
                          </a>
                        ) : (
                          <span className="text-stone-500">Not uploaded</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {!booked.length ? <p className="px-4 py-8 text-center text-stone-600">No booked rooms.</p> : null}
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-2xl font-bold text-stone-900">Available rooms</h2>
          <p className="mt-1 text-sm text-stone-600">Rooms marked as available.</p>

          <div className="mt-4 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-stone-50">
                <tr>
                  <th className="px-4 py-3 font-semibold text-stone-700">Property</th>
                  <th className="px-4 py-3 font-semibold text-stone-700">Room</th>
                  <th className="px-4 py-3 font-semibold text-stone-700">Price / month</th>
                </tr>
              </thead>
              <tbody>
                {available.map(({ property, room }) => (
                  <tr key={`${property.id}:${room.id}`} className="border-t border-stone-100">
                    <td className="px-4 py-3 font-semibold text-stone-900">{property.name}</td>
                    <td className="px-4 py-3 text-stone-700">{room.roomNumber}</td>
                    <td className="px-4 py-3 text-stone-700">{room.pricePerMonth.toLocaleString("en-ZA")}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {!available.length ? <p className="px-4 py-8 text-center text-stone-600">No available rooms.</p> : null}
          </div>
        </section>
      </main>
    </>
  );
}
