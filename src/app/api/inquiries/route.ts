import { propertyMap } from "@/data/properties";
import { getInquiries, saveInquiry } from "@/lib/inquiry-store";
import { z } from "zod";

const inquirySchema = z.object({
  fullName: z.string().min(2, "Please enter your full name"),
  phoneNumber: z.string().min(7, "Please enter a valid phone number"),
  email: z.email("Please enter a valid email address"),
  propertyId: z.string(),
  message: z.string().min(10, "Please add more details to your message"),
});

export async function GET() {
  const inquiries = await getInquiries();
  return Response.json({ inquiries });
}

export async function POST(request: Request) {
  const raw = await request.json();
  const parsed = inquirySchema.safeParse(raw);

  if (!parsed.success) {
    return Response.json(
      {
        error: "Invalid inquiry payload",
        issues: parsed.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 400 },
    );
  }

  if (!propertyMap.has(parsed.data.propertyId)) {
    return Response.json({ error: "Selected property does not exist" }, { status: 400 });
  }

  const inquiry = await saveInquiry(parsed.data);
  return Response.json({ inquiry }, { status: 201 });
}
