import { prisma } from "@/lib/db";

export async function GET() {
  const serviceAreas = await prisma.serviceArea.findMany({
    where: { isActive: true },
    orderBy: [{ state: "asc" }, { city: "asc" }, { area: "asc" }],
  });

  // Group by state, then by city
  const grouped: Record<string, Record<string, typeof serviceAreas>> = {};

  for (const area of serviceAreas) {
    if (!grouped[area.state]) {
      grouped[area.state] = {};
    }
    if (!grouped[area.state][area.city]) {
      grouped[area.state][area.city] = [];
    }
    grouped[area.state][area.city].push(area);
  }

  return Response.json({ serviceAreas: grouped });
}
