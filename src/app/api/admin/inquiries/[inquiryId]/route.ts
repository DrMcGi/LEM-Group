import { z } from "zod";
import { updateInquiry } from "@/lib/inquiry-store";

const patchSchema = z.object({
  status: z.enum(["new", "contacted", "archived"]).optional(),
});

export async function PATCH(request: Request, context: { params: Promise<{ inquiryId: string }> }) {
  const { inquiryId } = await context.params;
  const raw = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(raw);

  if (!parsed.success) {
    return Response.json({ error: "Invalid inquiry payload" }, { status: 400 });
  }

  try {
    const inquiry = await updateInquiry(inquiryId, parsed.data);
    return Response.json({ inquiry });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Could not update inquiry" },
      { status: 400 },
    );
  }
}
