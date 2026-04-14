"use client";

import { useEffect, useState } from "react";

type SafeUser = {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  disabled?: boolean;
};

export function UsersPanel() {
  const [users, setUsers] = useState<SafeUser[]>([]);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [toggling, setToggling] = useState<Record<string, boolean>>({});

  async function refresh() {
    const response = await fetch("/api/admin/users", { cache: "no-store" });
    const payload = (await response.json().catch(() => null)) as { users?: SafeUser[] } | null;
    setUsers(payload?.users ?? []);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function createUser() {
    setBusy(true);
    setStatus("");

    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, password }),
      });

      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        setStatus(payload?.error ?? "Could not create user.");
        return;
      }

      setEmail("");
      setName("");
      setPassword("");
      setStatus("User created.");
      await refresh();
    } catch {
      setStatus("Could not create user.");
    } finally {
      setBusy(false);
    }
  }

  async function toggleUser(userId: string, disabled: boolean) {
    setToggling((prev) => ({ ...prev, [userId]: true }));
    setStatus("");

    try {
      const response = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, disabled }),
      });

      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        setStatus(payload?.error ?? "Could not update user.");
        return;
      }

      await refresh();
    } catch {
      setStatus("Could not update user.");
    } finally {
      setToggling((prev) => ({ ...prev, [userId]: false }));
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-black/10 bg-white/90 p-6 shadow-lg sm:p-8">
        <h2 className="text-xl font-bold tracking-tight text-stone-900">Create admin user</h2>
        <p className="mt-1 text-sm text-stone-600">Add additional admin accounts for the portal.</p>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <label className="grid gap-2 text-sm font-semibold text-stone-800">
            Email
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-xl border border-stone-300 bg-white px-3 py-2 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/40"
              placeholder="name@example.com"
            />
          </label>

          <label className="grid gap-2 text-sm font-semibold text-stone-800">
            Name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-xl border border-stone-300 bg-white px-3 py-2 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/40"
              placeholder="Full name"
            />
          </label>

          <label className="grid gap-2 text-sm font-semibold text-stone-800">
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-xl border border-stone-300 bg-white px-3 py-2 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/40"
              placeholder="Minimum 8 characters"
            />
          </label>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={createUser}
            disabled={busy}
            className="inline-flex items-center justify-center rounded-xl bg-teal-700 px-5 py-2.5 font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? "Creating..." : "Create user"}
          </button>
          {status ? <p className="text-sm font-semibold text-stone-700">{status}</p> : null}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-stone-50">
            <tr>
              <th className="px-4 py-3 font-semibold text-stone-700">Name</th>
              <th className="px-4 py-3 font-semibold text-stone-700">Email</th>
              <th className="px-4 py-3 font-semibold text-stone-700">Created</th>
              <th className="px-4 py-3 font-semibold text-stone-700">Status</th>
              <th className="px-4 py-3 font-semibold text-stone-700">Action</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-t border-stone-100">
                <td className="px-4 py-3 font-semibold text-stone-900">{user.name}</td>
                <td className="px-4 py-3 text-stone-700 break-all">{user.email}</td>
                <td className="px-4 py-3 text-stone-600 whitespace-nowrap">{new Date(user.createdAt).toLocaleString()}</td>
                <td className="px-4 py-3 text-stone-700">{user.disabled ? "Disabled" : "Enabled"}</td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    disabled={Boolean(toggling[user.id])}
                    onClick={() => toggleUser(user.id, !user.disabled)}
                    className="rounded-xl border border-stone-300 bg-white px-3 py-1.5 text-sm font-semibold text-stone-800 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {toggling[user.id] ? "Working..." : user.disabled ? "Enable" : "Disable"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!users.length ? <p className="px-4 py-8 text-center text-stone-600">No users found.</p> : null}
      </div>
    </div>
  );
}
