import Link from "next/link";
import { AdminHeader } from "@/components/admin/admin-header";
import { getInquiries } from "@/lib/inquiry-store";
import { getProperties } from "@/lib/property-store";

export const metadata = {
  title: "Admin | LEM Accommodation",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminDashboardPage() {
  const [inquiries, properties] = await Promise.all([getInquiries(), getProperties()]);

  const newCount = inquiries.filter((item) => (item.status ?? "new") === "new").length;
  const availableRooms = properties
    .flatMap((p) => p.rooms ?? [])
    .filter((room) => room.availability === "available").length;

  return (
    <>
      <AdminHeader />
      <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold tracking-tight text-stone-900">Admin dashboard</h1>
        <p className="mt-2 text-stone-700">Manage enquiries and listings.</p>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <Link
            href="/admin/inquiries"
            className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm transition hover:border-teal-300 hover:bg-teal-50"
          >
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">Enquiries</div>
            <div className="mt-3 text-2xl font-bold text-stone-900">{newCount} new</div>
            <div className="mt-2 text-sm text-stone-600">View and update enquiry statuses.</div>
          </Link>

          <Link
            href="/admin/properties"
            className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm transition hover:border-teal-300 hover:bg-teal-50"
          >
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">Properties</div>
            <div className="mt-3 text-2xl font-bold text-stone-900">{properties.length} listings</div>
            <div className="mt-2 text-sm text-stone-600">Update pricing and room availability.</div>
          </Link>
        </div>

        <div className="mt-6">
          <Link
            href="/admin/users"
            className="inline-flex items-center justify-center rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-800 transition hover:bg-stone-50"
          >
            Manage admin users
          </Link>
          <span className="ml-3 text-sm text-stone-600">Available rooms: {availableRooms}</span>
        </div>
      </main>
    </>
  );
}
