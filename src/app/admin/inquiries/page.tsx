import { properties } from "@/data/properties";
import { getInquiries } from "@/lib/inquiry-store";

export const metadata = {
  title: "Inquiries | LEM Accommodation",
};

export default async function AdminInquiriesPage() {
  const inquiries = await getInquiries();

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight text-stone-900">Recent Inquiries</h1>
      <p className="mt-2 text-stone-700">A lightweight internal view of submitted leads.</p>

      <div className="mt-8 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-stone-50">
            <tr>
              <th className="px-4 py-3 font-semibold text-stone-700">Date</th>
              <th className="px-4 py-3 font-semibold text-stone-700">Name</th>
              <th className="px-4 py-3 font-semibold text-stone-700">Contact</th>
              <th className="px-4 py-3 font-semibold text-stone-700">Property</th>
              <th className="px-4 py-3 font-semibold text-stone-700">Message</th>
            </tr>
          </thead>
          <tbody>
            {inquiries.map((inquiry) => {
              const property = properties.find((item) => item.id === inquiry.propertyId);

              return (
                <tr key={inquiry.id} className="border-t border-stone-100 align-top">
                  <td className="px-4 py-3 text-stone-600">{new Date(inquiry.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-3 font-medium text-stone-900">{inquiry.fullName}</td>
                  <td className="px-4 py-3 text-stone-700">
                    <div>{inquiry.phoneNumber}</div>
                    <div>{inquiry.email}</div>
                  </td>
                  <td className="px-4 py-3 text-stone-700">{property?.name ?? inquiry.propertyId}</td>
                  <td className="px-4 py-3 text-stone-700">{inquiry.message}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {!inquiries.length ? (
          <p className="px-4 py-8 text-center text-stone-600">No inquiries yet.</p>
        ) : null}
      </div>
    </main>
  );
}
