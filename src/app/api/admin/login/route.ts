import { cookies } from "next/headers";
import { z } from "zod";
import { SESSION_COOKIE_NAME, getSessionCookieOptions, signAdminSession } from "@/lib/admin-auth";
import { findAdminUserByEmail, toSafeAdminUser, verifyAdminPassword } from "@/lib/admin-users-store";

const loginSchema = z.object({
  email: z.string().min(3).max(320),
  password: z.string().min(6).max(200),
});

export async function POST(request: Request) {
  const raw = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(raw);

  if (!parsed.success) {
    return Response.json({ error: "Invalid login payload" }, { status: 400 });
  }

  const user = await findAdminUserByEmail(parsed.data.email);
  if (!user || user.disabled) {
    return Response.json({ error: "Invalid email or password" }, { status: 401 });
  }

  const ok = await verifyAdminPassword(user, parsed.data.password);
  if (!ok) {
    return Response.json({ error: "Invalid email or password" }, { status: 401 });
  }

  const token = await signAdminSession({
    sub: user.id,
    email: user.email,
    name: user.name,
    role: "admin",
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    ...getSessionCookieOptions(),
    maxAge: 60 * 60 * 24 * 7,
  });

  return Response.json({ user: toSafeAdminUser(user) });
}
