import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME, verifyAdminSession } from "@/lib/admin-auth";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifyAdminSession(token) : null;

  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  return Response.json({ user: session });
}
