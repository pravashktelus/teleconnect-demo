import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const statusColors: Record<string, string> = {
  SUBMITTED: "bg-blue-100 text-blue-800",
  CRM_REVIEW: "bg-yellow-100 text-yellow-800",
  CRM_APPROVED: "bg-green-100 text-green-800",
  INSTALLATION_SCHEDULED: "bg-orange-100 text-orange-800",
  INSTALLATION_COMPLETE: "bg-teal-100 text-teal-800",
  ACTIVATION_PENDING: "bg-purple-100 text-purple-800",
  ACTIVATED: "bg-emerald-100 text-emerald-800",
  COMPLETED: "bg-gray-100 text-gray-800",
};

function formatStatus(status: string) {
  // ORIGINAL: ACTIVATED
  // Display-only relabel for the customer view; DB value and API stay "ACTIVATED".
  if (status === "ACTIVATED") return "ACTIVE";
  return status.replace(/_/g, " ");
}

export default async function OrdersPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  const orders = await prisma.order.findMany({
    where: { createdById: user.id },
    include: {
      plan: true,
      serviceArea: true,
      offer: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900" data-testid="orders-heading">My Orders</h1>
          <p className="text-gray-500 mt-1">
            Track all your broadband connection orders
          </p>
        </div>
        <Link href="/customer/order">
          <Button data-testid="btn-new-order" className="bg-blue-600 hover:bg-blue-700">
            + New Order
          </Button>
        </Link>
      </div>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500 mb-4">
              You haven&apos;t placed any orders yet.
            </p>
            <Link href="/customer/order">
              <Button variant="outline">Place your first order</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order, index) => (
            <Card
              key={order.id}
              data-testid={`order-item-${index}`}
              className="hover:shadow-sm transition-shadow"
            >
              <CardContent className="py-5 px-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm font-bold text-gray-900">
                        {order.orderNumber}
                      </span>
                      <Badge
                        className={`${statusColors[order.status] || "bg-gray-100 text-gray-800"} text-xs font-medium`}
                      >
                        {formatStatus(order.status)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>{order.plan.name} • {order.plan.speed}</span>
                      <span>•</span>
                      <span>
                        {order.serviceArea.area}, {order.serviceArea.city}
                      </span>
                    </div>
                  </div>
                  <div className="text-right text-sm">
                    <p className="text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                    {order.expectedDate && (
                      <p className="text-gray-400 text-xs mt-1">
                        Expected: {order.expectedDate}
                      </p>
                    )}
                  </div>
                </div>

                {/* Expandable details */}
                <details className="mt-4 group">
                  <summary className="text-sm text-blue-600 cursor-pointer hover:text-blue-700 font-medium">
                    View Details
                  </summary>
                  <div className="mt-3 pt-3 border-t grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-400 text-xs uppercase font-semibold mb-1">
                        Customer
                      </p>
                      <p className="text-gray-700">{order.customerName}</p>
                      <p className="text-gray-500">{order.customerEmail}</p>
                      <p className="text-gray-500">{order.customerPhone}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs uppercase font-semibold mb-1">
                        Installation Address
                      </p>
                      <p className="text-gray-700">{order.installAddress}</p>
                      <p className="text-gray-500">
                        {order.serviceArea.area}, {order.serviceArea.city} -{" "}
                        {order.serviceArea.pincode}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs uppercase font-semibold mb-1">
                        Plan
                      </p>
                      <p className="text-gray-700">
                        {order.plan.name} ({order.plan.speed})
                      </p>
                      <p className="text-gray-500">
                        ₹{order.basePrice}/mo
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs uppercase font-semibold mb-1">
                        Pricing
                      </p>
                      {order.discountAmount > 0 && (
                        <p className="text-green-600">
                          Discount: -₹{order.discountAmount}
                          {order.offer && ` (${order.offer.name})`}
                        </p>
                      )}
                      <p className="font-semibold text-gray-900">
                        Final: ₹{order.finalPrice}/mo
                      </p>
                    </div>
                    {order.installDate && (
                      <div>
                        <p className="text-gray-400 text-xs uppercase font-semibold mb-1">
                          Installation
                        </p>
                        <p className="text-gray-700">
                          {order.installDate}{" "}
                          {order.installSlot && `(${order.installSlot})`}
                        </p>
                      </div>
                    )}
                    {order.connectionId && (
                      <div>
                        <p className="text-gray-400 text-xs uppercase font-semibold mb-1">
                          Connection ID
                        </p>
                        <p className="font-mono text-gray-700">
                          {order.connectionId}
                        </p>
                      </div>
                    )}
                  </div>
                </details>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
