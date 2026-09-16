import { z } from "zod";
import { prisma } from "@/lib/db";
import { getUser } from "@/lib/auth";

// Valid status transitions per role
const validTransitions: Record<string, Record<string, string[]>> = {
  CRM: {
    SUBMITTED: ["CRM_REVIEW"],
    CRM_REVIEW: ["CRM_APPROVED"],
  },
  INSTALLATION: {
    CRM_APPROVED: ["INSTALLATION_SCHEDULED"],
    INSTALLATION_SCHEDULED: ["INSTALLATION_COMPLETE"],
  },
  ACTIVATION: {
    INSTALLATION_COMPLETE: ["ACTIVATION_PENDING"],
    ACTIVATION_PENDING: ["ACTIVATED"],
  },
};

const updateOrderSchema = z.object({
  status: z.string().optional(),
  notes: z.string().optional(),
  installDate: z.string().optional(),
  installSlot: z.enum(["MORNING", "AFTERNOON", "EVENING"]).optional(),
  connectionId: z.string().optional(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      plan: true,
      serviceArea: true,
      offer: true,
      createdBy: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  if (!order) {
    return Response.json({ error: "Order not found" }, { status: 404 });
  }

  // Customers can only see their own orders
  if (user.role === "CUSTOMER" && order.createdById !== user.id) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  return Response.json({ order });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const parsed = updateOrderSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const order = await prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      return Response.json({ error: "Order not found" }, { status: 404 });
    }

    // Validate status transition if status is being updated
    if (data.status) {
      const roleTransitions = validTransitions[user.role];
      if (!roleTransitions) {
        return Response.json(
          { error: "Your role cannot update order status" },
          { status: 403 }
        );
      }

      const allowedStatuses = roleTransitions[order.status];
      if (!allowedStatuses || !allowedStatuses.includes(data.status)) {
        return Response.json(
          {
            error: `Invalid status transition from ${order.status} to ${data.status} for role ${user.role}`,
          },
          { status: 400 }
        );
      }
    }

    // Build update data
    const updateData: Record<string, unknown> = {};

    if (data.status) updateData.status = data.status;
    if (data.notes) updateData.notes = data.notes;
    if (data.installDate) updateData.installDate = data.installDate;
    if (data.installSlot) updateData.installSlot = data.installSlot;
    if (data.connectionId) updateData.connectionId = data.connectionId;

    // Set activatedAt when status becomes ACTIVATED
    if (data.status === "ACTIVATED") {
      updateData.activatedAt = new Date();
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: updateData,
      include: {
        plan: true,
        serviceArea: true,
        offer: true,
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return Response.json({ order: updatedOrder });
  } catch {
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
