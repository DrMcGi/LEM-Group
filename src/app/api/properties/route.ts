import { properties } from "@/data/properties";

export async function GET() {
  return Response.json({ properties });
}
