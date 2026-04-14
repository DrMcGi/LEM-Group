import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminHeader } from "@/components/admin/admin-header";
import { PropertyEditor } from "@/components/admin/property-editor";
import { getPropertyById } from "@/lib/property-store";

type PageProps = {
  params: Promise<{ propertyId: string }>;
};

export const metadata = {
  title: "Edit Property | LEM Accommodation",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminPropertyEditPage({ params }: PageProps) {
  const { propertyId } = await params;
  const property = await getPropertyById(propertyId);

  if (!property) {
    notFound();
  }

  return (
    <>
      <AdminHeader />
      <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-stone-900">Edit property</h1>
            <p className="mt-2 text-stone-700">Update pricing and availability.</p>
          </div>

          <Link
            href="/admin/properties"
            className="rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-800 transition hover:bg-stone-50"
          >
            Back to properties
          </Link>
        </div>

        <div className="mt-8">
          <PropertyEditor property={property} />
        </div>
      </main>
    </>
  );
}
