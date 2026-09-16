import { prisma } from "@/lib/db";

export async function GET() {
  const plans = await prisma.plan.findMany({
    where: { isActive: true },
    orderBy: { price: "asc" },
  });

  return Response.json({ plans });
}
