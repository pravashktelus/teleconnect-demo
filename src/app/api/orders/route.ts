import { type NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getUser } from "@/lib/auth";

const createOrderSchema = z.object({
  customerName: z.string().min(1),
  customerEmail: z.string().email(),
  customerPhone: z.string().min(10),
  customerAddress: z.string().min(1),
  serviceAreaId: z.string().min(1),
  installAddress: z.string().min(1),
  planId: z.string().min(1),
  offerId: z.string().optional(),
});

export async function GET(request: NextRequest) {
  const user = await getUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const statusFilter = searchParams.get("status");

  let where: Record<string, unknown> = {};

  switch (user.role) {
    case "CUSTOMER":
      where = { createdById: user.id };
      break;
    case "CRM":
      // CRM sees all orders
      break;
    case "INSTALLATION":
      // Installation sees orders ready for them
      where = { status: { in: ["CRM_APPROVED", "INSTALLATION_SCHEDULED"] } };
      break;
    case "ACTIVATION":
      // Activation sees orders ready for them
      where = { status: { in: ["INSTALLATION_COMPLETE", "ACTIVATION_PENDING"] } };
      break;
    default:
      return Response.json({ error: "Invalid role" }, { status: 403 });
  }

  if (statusFilter) {
    where = { ...where, status: statusFilter };
  }

  const orders = await prisma.order.findMany({
    where,
    include: {
      plan: true,
      serviceArea: true,
      offer: true,
      createdBy: {
        select: { id: true, name: true, email: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return Response.json({ orders });
}

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = createOrderSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Fetch plan for pricing
    const plan = await prisma.plan.findUnique({
      where: { id: data.planId },
    });

    if (!plan) {
      return Response.json({ error: "Plan not found" }, { status: 404 });
    }

    // Calculate pricing
    let discountAmount = 0;
    if (data.offerId) {
      const offer = await prisma.offer.findUnique({
        where: { id: data.offerId },
      });
      if (offer) {
        if (offer.discountType === "PERCENTAGE") {
          discountAmount = (plan.price * offer.discount) / 100;
        } else {
          discountAmount = offer.discount;
        }
      }
    }

    const finalPrice = Math.max(0, plan.price - discountAmount);

    // Generate order number
    const orderNumber = `BRD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    // Expected date: 5 days from now
    const expectedDate = new Date();
    expectedDate.setDate(expectedDate.getDate() + 5);

    const order = await prisma.order.create({
      data: {
        orderNumber,
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        customerPhone: data.customerPhone,
        customerAddress: data.customerAddress,
        serviceAreaId: data.serviceAreaId,
        installAddress: data.installAddress,
        planId: data.planId,
        offerId: data.offerId || null,
        basePrice: plan.price,
        discountAmount,
        finalPrice,
        status: "SUBMITTED",
        expectedDate: expectedDate.toISOString().split("T")[0],
        createdById: user.id,
      },
      include: {
        plan: true,
        serviceArea: true,
        offer: true,
      },
    });

    return Response.json({ order }, { status: 201 });
  } catch {
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
