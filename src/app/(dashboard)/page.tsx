"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ClipboardList,
  Clock,
  DollarSign,
  AlertTriangle,
  Plus,
} from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { useOrders } from "@/lib/orders-context";
import { formatCurrency, formatRelativeDate, ROUTES } from "@/lib/utils";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

function AnimatedNumber({ value, prefix = "" }: { value: number; prefix?: string }) {
  return (
    <motion.span
      key={value}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="tabular-nums"
    >
      {prefix}{typeof value === "number" && prefix === "$" ? formatCurrency(value).replace("$", "") : value}
    </motion.span>
  );
}

export default function DashboardPage() {
  const { orders } = useOrders();
  const router = useRouter();

  const stats = {
    totalOrders: orders.length,
    pendingReview: orders.filter(
      (o) => o.status === "submitted" || o.status === "verified"
    ).length,
    monthlyRevenue: orders.reduce((sum, o) => sum + o.totalAllowedAmount, 0),
    revenueAtRisk: orders
      .filter((o) => o.status === "draft" || o.status === "submitted")
      .reduce((sum, o) => sum + o.totalAllowedAmount, 0),
  };

  const statCards = [
    {
      label: "Orders This Month",
      value: stats.totalOrders,
      icon: ClipboardList,
      format: "number" as const,
    },
    {
      label: "Pending Review",
      value: stats.pendingReview,
      icon: Clock,
      format: "number" as const,
      highlight: stats.pendingReview > 0 ? "text-amber-600" : undefined,
    },
    {
      label: "Monthly Revenue",
      value: stats.monthlyRevenue,
      icon: DollarSign,
      format: "currency" as const,
    },
    {
      label: "Revenue at Risk",
      value: stats.revenueAtRisk,
      icon: AlertTriangle,
      format: "currency" as const,
      highlight: "text-red-600",
    },
  ];

  return (
    <div>
      <PageHeader
        title="Orders"
        description="Manage patient orders and track billing status"
        action={
          <Link href={ROUTES.newOrder}>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Order
            </Button>
          </Link>
        }
      />

      {/* Stats Cards */}
      <motion.div
        className="grid grid-cols-4 gap-4 mb-8"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {statCards.map((stat) => (
          <motion.div key={stat.label} variants={item}>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.label}
                  </p>
                  <stat.icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <p
                  className={`text-2xl font-bold mt-2 ${stat.highlight ?? ""}`}
                >
                  {stat.format === "currency" ? (
                    <AnimatedNumber value={stat.value} prefix="$" />
                  ) : (
                    <AnimatedNumber value={stat.value} />
                  )}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Orders Table */}
      <Card>
        <div className="p-6 pb-0">
          <h2 className="text-lg font-semibold">Recent Orders</h2>
        </div>
        <div className="p-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Payer</TableHead>
                <TableHead className="text-center">Items</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow
                  key={order.id}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => router.push(ROUTES.orderDetail(order.id))}
                >
                  <TableCell className="font-medium font-mono text-sm">
                    {order.id}
                  </TableCell>
                  <TableCell>
                    {order.patient.firstName} {order.patient.lastName}
                  </TableCell>
                  <TableCell>{order.payerName}</TableCell>
                  <TableCell className="text-center">
                    {order.lineItems.length}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatCurrency(order.totalAllowedAmount)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={order.status} />
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {formatRelativeDate(order.createdAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
