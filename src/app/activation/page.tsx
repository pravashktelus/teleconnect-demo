import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { OrderActions } from "./order-actions";

export default async function ActivationDashboard() {
  const user = await getUser();
  if (!user || user.role !== "ACTIVATION") redirect("/login");

  const orders = await prisma.order.findMany({
    where: {
      status: {
        in: ["INSTALLATION_COMPLETE", "ACTIVATION_PENDING"],
      },
    },
    include: {
      plan: true,
      serviceArea: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const today = new Date().toISOString().split("T")[0];

  const pendingOrders = orders.filter((o) => o.status === "INSTALLATION_COMPLETE");
  const inProgressOrders = orders.filter((o) => o.status === "ACTIVATION_PENDING");

  const activatedToday = await prisma.order.count({
    where: {
      status: "ACTIVATED",
      activatedAt: { gte: new Date(today) },
    },
  });

  const totalActivated = await prisma.order.count({
    where: { status: "ACTIVATED" },
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900" data-testid="activation-heading">Activation Dashboard</h1>
          <p className="text-gray-500 mt-1">Activate broadband connections for customers</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right" data-testid="stat-activated-today">
            <p className="text-xs text-gray-500 uppercase font-medium">Today</p>
            <p className="text-xl font-bold text-emerald-600">{activatedToday}</p>
          </div>
          <div className="w-px h-10 bg-gray-200" />
          <div className="text-right" data-testid="stat-total-activated">
            <p className="text-xs text-gray-500 uppercase font-medium">Total</p>
            <p className="text-xl font-bold text-gray-900">{totalActivated}</p>
          </div>
        </div>
      </div>

      {/* Kanban Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[500px]">
        {/* Column 1: Ready for Activation */}
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b-2 border-purple-300">
            <div className="w-3 h-3 rounded-full bg-purple-500" />
            <h2 className="font-semibold text-gray-900">Ready for Activation</h2>
            <Badge variant="outline" className="ml-auto text-purple-700 border-purple-300" data-testid="stat-pending-activation">
              {pendingOrders.length}
            </Badge>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto">
            {pendingOrders.length === 0 ? (
              <div className="flex items-center justify-center h-40 border-2 border-dashed border-gray-200 rounded-xl">
                <p className="text-sm text-gray-400">No orders waiting</p>
              </div>
            ) : (
              pendingOrders.map((order, index) => (
                <div
                  key={order.id}
                  data-testid={`pending-card-${index}`}
                  className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-mono text-xs font-bold text-gray-700">{order.orderNumber}</p>
                      <p className="text-sm font-medium text-gray-900 mt-0.5">{order.customerName}</p>
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                      {order.plan.name}
                    </Badge>
                    <Badge variant="outline" className="text-xs bg-gray-50 text-gray-600 border-gray-200">
                      {order.plan.speed}
                    </Badge>
                  </div>
                  <div className="text-xs text-gray-500 mb-3">
                    {order.serviceArea.area}, {order.serviceArea.city}
                  </div>
                  <OrderActions orderId={order.id} currentStatus={order.status} />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Column 2: Activation In Progress */}
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b-2 border-amber-300">
            <div className="w-3 h-3 rounded-full bg-amber-500 animate-pulse" />
            <h2 className="font-semibold text-gray-900">Activation In Progress</h2>
            <Badge variant="outline" className="ml-auto text-amber-700 border-amber-300">
              {inProgressOrders.length}
            </Badge>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto">
            {inProgressOrders.length === 0 ? (
              <div className="flex items-center justify-center h-40 border-2 border-dashed border-gray-200 rounded-xl">
                <p className="text-sm text-gray-400">No activations in progress</p>
              </div>
            ) : (
              inProgressOrders.map((order, index) => (
                <div
                  key={order.id}
                  data-testid={`progress-card-${index}`}
                  className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-mono text-xs font-bold text-gray-700">{order.orderNumber}</p>
                      <p className="text-sm font-medium text-gray-900 mt-0.5">{order.customerName}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                      <span className="text-xs text-amber-700 font-medium">Processing</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                      {order.plan.name}
                    </Badge>
                    <Badge variant="outline" className="text-xs bg-gray-50 text-gray-600 border-gray-200">
                      {order.plan.speed}
                    </Badge>
                  </div>
                  <div className="text-xs text-gray-500 mb-3">
                    {order.customerEmail} • {order.serviceArea.area}, {order.serviceArea.city}
                  </div>
                  <OrderActions orderId={order.id} currentStatus={order.status} />
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
