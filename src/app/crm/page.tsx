import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { OrderActions } from "./order-actions";

const statusColors: Record<string, string> = {
  SUBMITTED: "bg-blue-100 text-blue-800",
  CRM_REVIEW: "bg-yellow-100 text-yellow-800",
  CRM_APPROVED: "bg-green-100 text-green-800",
  INSTALLATION_SCHEDULED: "bg-orange-100 text-orange-800",
  INSTALLATION_COMPLETE: "bg-teal-100 text-teal-800",
  ACTIVATION_PENDING: "bg-purple-100 text-purple-800",
  ACTIVATED: "bg-emerald-100 text-emerald-800",
};

function formatStatus(status: string) {
  return status.replace(/_/g, " ");
}

export default async function CRMDashboard() {
  const user = await getUser();
  if (!user || user.role !== "CRM") redirect("/login");

  const orders = await prisma.order.findMany({
    include: {
      plan: true,
      serviceArea: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const totalOrders = orders.length;
  const pendingReview = orders.filter((o) => o.status === "SUBMITTED").length;
  const approved = orders.filter((o) => o.status === "CRM_APPROVED").length;
  const inProgress = orders.filter((o) => o.status === "CRM_REVIEW").length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900" data-testid="crm-heading">CRM Dashboard</h1>
        <p className="text-gray-500 mt-1">Review and approve broadband orders</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card data-testid="stat-total">
          <CardContent className="py-4 px-5">
            <p className="text-sm text-gray-500">Total Orders</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{totalOrders}</p>
          </CardContent>
        </Card>
        <Card data-testid="stat-pending">
          <CardContent className="py-4 px-5">
            <p className="text-sm text-gray-500">Pending Review</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">{pendingReview}</p>
          </CardContent>
        </Card>
        <Card data-testid="stat-in-review">
          <CardContent className="py-4 px-5">
            <p className="text-sm text-gray-500">In Review</p>
            <p className="text-2xl font-bold text-yellow-600 mt-1">{inProgress}</p>
          </CardContent>
        </Card>
        <Card data-testid="stat-approved">
          <CardContent className="py-4 px-5">
            <p className="text-sm text-gray-500">Approved</p>
            <p className="text-2xl font-bold text-green-600 mt-1">{approved}</p>
          </CardContent>
        </Card>
      </div>

      {/* Orders Table */}
      <Card data-testid="orders-table">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Area</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    No orders found
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order, index) => (
                  <TableRow key={order.id} data-testid={`order-row-${index}`}>
                    <TableCell className="font-mono text-sm font-medium">
                      {order.orderNumber}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-gray-900">{order.customerName}</p>
                        <p className="text-xs text-gray-500">{order.customerEmail}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{order.plan.name}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {order.serviceArea.area}, {order.serviceArea.city}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={`${statusColors[order.status] || "bg-gray-100 text-gray-800"} text-xs font-medium`}
                      >
                        {formatStatus(order.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                      })}
                    </TableCell>
                    <TableCell>
                      <OrderActions orderId={order.id} currentStatus={order.status} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
