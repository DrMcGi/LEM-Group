import { z } from "zod";
import { getPropertyById, updateProperty } from "@/lib/property-store";

const roomSchema = z.object({
  id: z.string().min(1),
  roomNumber: z.string().min(1),
  pricePerMonth: z.number().int().nonnegative(),
  availability: z.enum(["available", "booked", "maintenance"]),
  images: z.array(z.string()).default([]),
  description: z.string().default(""),
  features: z.array(z.string()).default([]),
  bookingDetails: z
    .object({
      bookedUntil: z.string().optional(),
      tenant: z.string().optional(),
      tenantDetails: z
        .object({
          firstName: z.string().max(80),
          lastName: z.string().max(80),
          phoneNumber: z.string().min(3).max(40).optional(),
          email: z.string().email().optional(),
          residentialAddress: z.string().min(3).max(300).optional(),
          idNumber: z.string().min(3).max(60).optional(),
          notes: z.string().max(500).optional(),
        })
        .optional(),
      leaseAgreementUrl: z.string().url().optional(),
    })
    .optional(),
  lastBookingDetails: z
    .object({
      bookedUntil: z.string().optional(),
      tenant: z.string().optional(),
      tenantDetails: z
        .object({
          firstName: z.string().max(80),
          lastName: z.string().max(80),
          phoneNumber: z.string().min(3).max(40).optional(),
          email: z.string().email().optional(),
          residentialAddress: z.string().min(3).max(300).optional(),
          idNumber: z.string().min(3).max(60).optional(),
          notes: z.string().max(500).optional(),
        })
        .optional(),
      leaseAgreementUrl: z.string().url().optional(),
    })
    .optional(),
});

const updateSchema = z.object({
  name: z.string().min(2).max(200).optional(),
  pricePerMonth: z.number().int().nonnegative().optional(),
  summary: z.string().min(10).max(500).optional(),
  description: z.string().min(10).optional(),
  details: z.array(z.string()).optional(),
  highlights: z.array(z.string()).optional(),
  rooms: z.array(roomSchema).optional(),
});

export async function GET(_: Request, context: { params: Promise<{ propertyId: string }> }) {
  const { propertyId } = await context.params;
  const property = await getPropertyById(propertyId);

  if (!property) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  return Response.json({ property });
}

export async function PUT(request: Request, context: { params: Promise<{ propertyId: string }> }) {
  const { propertyId } = await context.params;
  const raw = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(raw);

  if (!parsed.success) {
    return Response.json({ error: "Invalid property payload" }, { status: 400 });
  }

  try {
    const updated = await updateProperty(propertyId, parsed.data);
    return Response.json({ property: updated });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Could not update property" },
      { status: 400 },
    );
  }
}
