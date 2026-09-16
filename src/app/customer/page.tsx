import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const statusColors: Record<string, string> = {
  SUBMITTED: "bg-blue-100 text-blue-800 border-blue-200",
  CRM_REVIEW: "bg-yellow-100 text-yellow-800 border-yellow-200",
  CRM_APPROVED: "bg-green-100 text-green-800 border-green-200",
  INSTALLATION_SCHEDULED: "bg-orange-100 text-orange-800 border-orange-200",
  INSTALLATION_COMPLETE: "bg-teal-100 text-teal-800 border-teal-200",
  ACTIVATION_PENDING: "bg-purple-100 text-purple-800 border-purple-200",
  ACTIVATED: "bg-emerald-100 text-emerald-800 border-emerald-200",
  COMPLETED: "bg-gray-100 text-gray-800 border-gray-200",
};

const statusIcons: Record<string, string> = {
  SUBMITTED: "📋",
  CRM_REVIEW: "🔍",
  CRM_APPROVED: "✅",
  INSTALLATION_SCHEDULED: "📅",
  INSTALLATION_COMPLETE: "🔧",
  ACTIVATION_PENDING: "⚡",
  ACTIVATED: "🎉",
};

function formatStatus(status: string) {
  // ORIGINAL: ACTIVATED
  // Display-only relabel for the customer view; DB value and API stay "ACTIVATED".
  if (status === "ACTIVATED") return "ACTIVE";
  return status.replace(/_/g, " ");
}

export default async function CustomerDashboard() {
  const user = await getUser();
  if (!user) redirect("/login");

  const orders = await prisma.order.findMany({
    where: { createdById: user.id },
    include: { plan: true, serviceArea: true },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  const totalOrders = await prisma.order.count({ where: { createdById: user.id } });
  const activeOrders = await prisma.order.count({
    where: { createdById: user.id, status: { notIn: ["ACTIVATED", "COMPLETED"] } },
  });

  return (
    <div className="space-y-10">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-8 text-white shadow-xl">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-10 -right-10 w-60 h-60 bg-white rounded-full blur-3xl" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white rounded-full blur-3xl" />
        </div>
        <div className="relative flex items-center justify-between">
          <div>
            <p className="text-blue-100 text-sm font-medium">Welcome back</p>
            <h1 className="text-3xl font-bold mt-1" data-testid="welcome-heading">{user.name}</h1>
            <p className="text-blue-100 mt-2 max-w-md">
              Manage your broadband connections, track orders, and get high-speed internet at your doorstep.
            </p>
          </div>
          <Link href="/customer/order">
            <Button data-testid="btn-new-connection" className="bg-white text-blue-700 hover:bg-blue-50 shadow-lg font-semibold px-6 h-12 text-base">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              New Connection
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div data-testid="stat-total-orders" className="p-5 rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="20" height="14" x="2" y="5" rx="2" /><line x1="2" x2="22" y1="10" y2="10" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{totalOrders}</p>
              <p className="text-xs text-gray-500 font-medium">Total Orders</p>
            </div>
          </div>
        </div>
        <div data-testid="stat-in-progress" className="p-5 rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{activeOrders}</p>
              <p className="text-xs text-gray-500 font-medium">In Progress</p>
            </div>
          </div>
        </div>
        <div data-testid="stat-activated" className="p-5 rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12.55a11 11 0 0 1 14.08 0" /><path d="M8.53 16.11a6 6 0 0 1 6.95 0" /><line x1="12" y1="20" x2="12.01" y2="20" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{totalOrders - activeOrders}</p>
              <p className="text-xs text-gray-500 font-medium">Activated</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-900">Recent Orders</h2>
          {orders.length > 0 && (
            <Link href="/customer/orders" data-testid="link-view-all" className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1">
              View all
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </Link>
          )}
        </div>

        {orders.length === 0 ? (
          <Card className="border-dashed border-2 border-gray-200 bg-gray-50/50">
            <CardContent className="py-16 text-center">
              <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12.55a11 11 0 0 1 14.08 0" />
                  <path d="M1.42 9a16 16 0 0 1 21.16 0" />
                  <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
                  <line x1="12" y1="20" x2="12.01" y2="20" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Get Connected</h3>
              <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                Order your high-speed broadband connection in just a few steps. Choose from our range of plans.
              </p>
              <Link href="/customer/order">
                <Button className="bg-blue-600 hover:bg-blue-700 px-6">
                  Place your first order
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {orders.map((order, index) => (
              <Card key={order.id} data-testid={`order-card-${index}`} className="group hover:shadow-md transition-all border border-gray-100 hover:border-blue-100">
                <CardContent className="py-5 px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center text-lg border border-blue-100">
                        {statusIcons[order.status] || "📦"}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-sm font-bold text-gray-900">
                            {order.orderNumber}
                          </span>
                          <Badge
                            variant="outline"
                            className={`${statusColors[order.status] || "bg-gray-100 text-gray-800"} text-[10px] font-semibold uppercase tracking-wide`}
                          >
                            {formatStatus(order.status)}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-500">
                          {order.plan.name} • {order.plan.speed} • {order.serviceArea.area}, {order.serviceArea.city}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-700">
                        ₹{order.finalPrice}/mo
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(order.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link href="/customer/order" className="group">
          <div className="p-6 rounded-xl border border-gray-100 bg-white hover:border-blue-200 hover:shadow-md transition-all">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-md shadow-blue-200 group-hover:shadow-lg transition-shadow">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">New Broadband Connection</h3>
                <p className="text-sm text-gray-500">Order a new connection in 5 easy steps</p>
              </div>
            </div>
          </div>
        </Link>
        <Link href="/customer/orders" className="group">
          <div className="p-6 rounded-xl border border-gray-100 bg-white hover:border-blue-200 hover:shadow-md transition-all">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-md shadow-emerald-200 group-hover:shadow-lg transition-shadow">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Track My Orders</h3>
                <p className="text-sm text-gray-500">View status and details of all orders</p>
              </div>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
