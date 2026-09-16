import { prisma } from "@/lib/db";

export async function GET() {
  const offers = await prisma.offer.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });

  return Response.json({ offers });
}
