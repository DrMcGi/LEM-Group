import { getEnquiries } from "@/lib/enquiry-store";
import { getProperties } from "@/lib/property-store";
import { AdminHeader } from "@/components/admin/admin-header";
import { EnquiriesTable } from "@/components/admin/inquiries-table";

export const metadata = {
  title: "Enquiries | LEM Accommodation",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminInquiriesPage() {
  const [inquiries, properties] = await Promise.all([getEnquiries(), getProperties()]);

  return (
    <>
      <AdminHeader />
      <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold tracking-tight text-stone-900">Enquiries</h1>
        <p className="mt-2 text-stone-700">Review incoming leads and keep status up to date.</p>

        <EnquiriesTable inquiries={inquiries} properties={properties} />
      </main>
    </>
  );
}
