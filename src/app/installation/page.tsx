import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { OrderActions } from "./order-actions";

const statusColors: Record<string, string> = {
  CRM_APPROVED: "bg-green-100 text-green-800",
  INSTALLATION_SCHEDULED: "bg-orange-100 text-orange-800",
};

function formatStatus(status: string) {
  return status.replace(/_/g, " ");
}

export default async function InstallationDashboard() {
  const user = await getUser();
  if (!user || user.role !== "INSTALLATION") redirect("/login");

  const orders = await prisma.order.findMany({
    where: {
      status: {
        in: ["CRM_APPROVED", "INSTALLATION_SCHEDULED"],
      },
    },
    include: {
      plan: true,
      serviceArea: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const today = new Date().toISOString().split("T")[0];

  const pendingAssignment = orders.filter((o) => o.status === "CRM_APPROVED").length;
  const scheduled = orders.filter((o) => o.status === "INSTALLATION_SCHEDULED").length;

  const completedToday = await prisma.order.count({
    where: {
      status: "INSTALLATION_COMPLETE",
      updatedAt: { gte: new Date(today) },
    },
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900" data-testid="installation-heading">Installation Dashboard</h1>
        <p className="text-gray-500 mt-1">Schedule and manage broadband installations</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div data-testid="stat-pending-assignment" className="p-5 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200">
          <p className="text-sm font-medium text-green-700">Pending Assignment</p>
          <p className="text-3xl font-bold text-green-800 mt-1">{pendingAssignment}</p>
        </div>
        <div data-testid="stat-scheduled" className="p-5 rounded-xl bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200">
          <p className="text-sm font-medium text-orange-700">Scheduled</p>
          <p className="text-3xl font-bold text-orange-800 mt-1">{scheduled}</p>
        </div>
        <div data-testid="stat-completed-today" className="p-5 rounded-xl bg-gradient-to-br from-teal-50 to-cyan-50 border border-teal-200">
          <p className="text-sm font-medium text-teal-700">Completed Today</p>
          <p className="text-3xl font-bold text-teal-800 mt-1">{completedToday}</p>
        </div>
      </div>

      {/* Orders as Cards Grid */}
      {orders.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
            </svg>
          </div>
          <p className="text-gray-500 text-lg">No pending installations</p>
          <p className="text-gray-400 text-sm mt-1">Orders will appear here once approved by CRM</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {orders.map((order, index) => (
            <Card key={order.id} data-testid={`install-card-${index}`} className="hover:shadow-lg transition-shadow border-l-4 border-l-orange-400">
              <CardContent className="p-5 space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-mono text-sm font-bold text-gray-900">{order.orderNumber}</p>
                    <Badge className={`${statusColors[order.status] || "bg-gray-100 text-gray-800"} text-xs mt-1`}>
                      {formatStatus(order.status)}
                    </Badge>
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  </span>
                </div>

                {/* Customer Info */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                    </svg>
                    <span className="text-sm font-medium text-gray-800">{order.customerName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72" />
                    </svg>
                    <span className="text-sm text-gray-600">{order.customerPhone}</span>
                  </div>
                </div>

                {/* Location */}
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Install Location</p>
                  <p className="text-sm text-gray-800">{order.installAddress}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {order.serviceArea.area}, {order.serviceArea.city} - {order.serviceArea.pincode}
                  </p>
                </div>

                {/* Plan */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Plan</span>
                  <span className="font-medium text-gray-800">{order.plan.name} • {order.plan.speed}</span>
                </div>

                {/* Scheduled info */}
                {order.installDate && (
                  <div className="flex items-center justify-between text-sm p-2 bg-orange-50 rounded-lg">
                    <span className="text-orange-700 font-medium">Scheduled</span>
                    <span className="text-orange-800 font-semibold">
                      {order.installDate} ({order.installSlot})
                    </span>
                  </div>
                )}

                {/* Actions */}
                <div className="pt-2 border-t">
                  <OrderActions orderId={order.id} currentStatus={order.status} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
