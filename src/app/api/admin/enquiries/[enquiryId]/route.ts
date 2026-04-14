import { z } from "zod";
import { updateEnquiry } from "@/lib/enquiry-store";

const patchSchema = z.object({
	status: z.enum(["new", "contacted", "archived"]).optional(),
});

export async function PATCH(request: Request, context: { params: Promise<{ enquiryId: string }> }) {
	const { enquiryId } = await context.params;
	const raw = await request.json().catch(() => null);
	const parsed = patchSchema.safeParse(raw);

	if (!parsed.success) {
		return Response.json({ error: "Invalid enquiry payload" }, { status: 400 });
	}

	try {
		const enquiry = await updateEnquiry(enquiryId, parsed.data);
		return Response.json({ enquiry });
	} catch (error) {
		return Response.json(
			{ error: error instanceof Error ? error.message : "Could not update enquiry" },
			{ status: 400 },
		);
	}
}
