import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME, getSessionCookieOptions } from "@/lib/admin-auth";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, "", {
    ...getSessionCookieOptions(),
    maxAge: 0,
  });

  return Response.json({ ok: true });
}
