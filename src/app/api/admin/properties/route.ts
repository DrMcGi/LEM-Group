import { getProperties } from "@/lib/property-store";

export async function GET() {
  const properties = await getProperties();
  return Response.json({ properties });
}
