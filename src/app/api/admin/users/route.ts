import { z } from "zod";
import { createAdminUser, getAdminUsers, setAdminUserDisabled, toSafeAdminUser } from "@/lib/admin-users-store";

const createSchema = z.object({
  email: z.string().min(3).max(320),
  name: z.string().min(2).max(120),
  password: z.string().min(8).max(200),
});

export async function GET() {
  const users = await getAdminUsers();
  return Response.json({ users: users.map(toSafeAdminUser) });
}

export async function POST(request: Request) {
  const raw = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(raw);

  if (!parsed.success) {
    return Response.json({ error: "Invalid user payload" }, { status: 400 });
  }

  try {
    const user = await createAdminUser(parsed.data);
    return Response.json({ user }, { status: 201 });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Could not create user" },
      { status: 400 },
    );
  }
}

const patchSchema = z.object({
  userId: z.string().min(1),
  disabled: z.boolean(),
});

export async function PATCH(request: Request) {
  const raw = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(raw);

  if (!parsed.success) {
    return Response.json({ error: "Invalid user payload" }, { status: 400 });
  }

  try {
    const user = await setAdminUserDisabled(parsed.data.userId, parsed.data.disabled);
    return Response.json({ user });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Could not update user" },
      { status: 400 },
    );
  }
}
