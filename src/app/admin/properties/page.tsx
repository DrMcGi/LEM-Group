import Link from "next/link";
import { AdminHeader } from "@/components/admin/admin-header";
import { getProperties } from "@/lib/property-store";

export const metadata = {
  title: "Properties | LEM Accommodation",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminPropertiesPage() {
  const properties = await getProperties();

  return (
    <>
      <AdminHeader />
      <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold tracking-tight text-stone-900">Properties</h1>
        <p className="mt-2 text-stone-700">Edit pricing and availability for each listing.</p>

        <div className="mt-8 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-stone-50">
              <tr>
                <th className="px-4 py-3 font-semibold text-stone-700">Listing</th>
                <th className="px-4 py-3 font-semibold text-stone-700">Location</th>
                <th className="px-4 py-3 font-semibold text-stone-700">Type</th>
                <th className="px-4 py-3 font-semibold text-stone-700">Price / month</th>
                <th className="px-4 py-3 font-semibold text-stone-700">Rooms</th>
                <th className="px-4 py-3 font-semibold text-stone-700">Action</th>
              </tr>
            </thead>
            <tbody>
              {properties.map((property) => (
                <tr key={property.id} className="border-t border-stone-100">
                  <td className="px-4 py-3 font-semibold text-stone-900">{property.name}</td>
                  <td className="px-4 py-3 text-stone-700">{property.location.city}</td>
                  <td className="px-4 py-3 text-stone-700">{property.type}</td>
                  <td className="px-4 py-3 text-stone-700">{property.pricePerMonth.toLocaleString("en-ZA")}</td>
                  <td className="px-4 py-3 text-stone-700">{property.rooms?.length ?? 0}</td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/properties/${property.id}`}
                      className="inline-flex items-center justify-center rounded-xl bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-800"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!properties.length ? <p className="px-4 py-8 text-center text-stone-600">No properties found.</p> : null}
        </div>
      </main>
    </>
  );
}
