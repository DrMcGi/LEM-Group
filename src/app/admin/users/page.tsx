import { AdminHeader } from "@/components/admin/admin-header";
import { UsersPanel } from "@/components/admin/users-panel";

export const metadata = {
  title: "Admin Users | LEM Accommodation",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminUsersPage() {
  return (
    <>
      <AdminHeader />
      <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold tracking-tight text-stone-900">Admin users</h1>
        <p className="mt-2 text-stone-700">Manage access to the admin portal.</p>

        <div className="mt-8">
          <UsersPanel />
        </div>
      </main>
    </>
  );
}
