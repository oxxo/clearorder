"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ClipboardList,
  Clock,
  DollarSign,
  AlertTriangle,
  Plus,
  Search,
  Target,
  CheckCircle2,
  Eye,
} from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { AIInsightsCard } from "@/components/ai-insights-card";
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

const STATUS_FILTERS = [
  { value: "all", label: "All" },
  { value: "draft", label: "Draft" },
  { value: "submitted", label: "Submitted" },
  { value: "verified", label: "Verified" },
  { value: "approved", label: "Approved" },
  { value: "shipped", label: "Shipped" },
  { value: "complete", label: "Complete" },
] as const;

export default function DashboardPage() {
  const { orders } = useOrders();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredOrders = useMemo(() => {
    let result = orders;

    if (statusFilter !== "all") {
      result = result.filter((o) => o.status === statusFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (o) =>
          o.id.toLowerCase().includes(q) ||
          o.patient.firstName.toLowerCase().includes(q) ||
          o.patient.lastName.toLowerCase().includes(q) ||
          o.payerName.toLowerCase().includes(q)
      );
    }

    return result;
  }, [orders, search, statusFilter]);

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
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <stat.icon className="h-4 w-4 text-primary" />
                  </div>
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

      {/* Pipeline Visualization */}
      {orders.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Pipeline
            </h3>
          </div>
          <div className="flex h-2.5 rounded-full overflow-hidden bg-muted">
            {(["draft", "submitted", "verified", "approved", "shipped", "complete"] as const).map((status) => {
              const count = orders.filter((o) => o.status === status).length;
              if (count === 0) return null;
              const pct = (count / orders.length) * 100;
              const colors: Record<string, string> = {
                draft: "bg-gray-400",
                submitted: "bg-blue-500",
                verified: "bg-yellow-500",
                approved: "bg-green-500",
                shipped: "bg-purple-500",
                complete: "bg-emerald-500",
              };
              return (
                <div
                  key={status}
                  className={`${colors[status]} transition-all duration-500`}
                  style={{ width: `${pct}%` }}
                  title={`${status}: ${count} order${count > 1 ? "s" : ""}`}
                />
              );
            })}
          </div>
          <div className="flex gap-4 mt-1.5">
            {(["draft", "submitted", "verified", "approved", "shipped", "complete"] as const).map((status) => {
              const count = orders.filter((o) => o.status === status).length;
              if (count === 0) return null;
              const dotColors: Record<string, string> = {
                draft: "bg-gray-400",
                submitted: "bg-blue-500",
                verified: "bg-yellow-500",
                approved: "bg-green-500",
                shipped: "bg-purple-500",
                complete: "bg-emerald-500",
              };
              return (
                <div key={status} className="flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-full ${dotColors[status]}`} />
                  <span className="text-[10px] text-muted-foreground capitalize">
                    {status} ({count})
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* AI Revenue Intelligence */}
      <div className="mb-6">
        <AIInsightsCard orders={orders} />
      </div>

      {/* Success Metrics — Sprint 1 KPIs */}
      <Card className="mb-6">
        <div className="px-6 pt-5 pb-1">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Sprint 1 Success Metrics
          </h3>
        </div>
        <CardContent className="pt-3">
          <div className="grid grid-cols-3 gap-6">
            {[
              {
                icon: Clock,
                label: "Time to Create Order",
                target: "< 3 min",
                baseline: "12 min (Excel)",
                improvement: "75%",
                color: "text-blue-600",
                bg: "bg-blue-50",
              },
              {
                icon: Target,
                label: "Pricing Accuracy",
                target: "100%",
                baseline: "~60% (Excel)",
                improvement: "40pp",
                color: "text-emerald-600",
                bg: "bg-emerald-50",
              },
              {
                icon: Eye,
                label: "Risk Visibility",
                target: "100%",
                baseline: "0% (Excel)",
                improvement: "∞",
                color: "text-purple-600",
                bg: "bg-purple-50",
              },
            ].map((metric) => (
              <div key={metric.label} className="flex items-start gap-3">
                <div
                  className={`h-9 w-9 rounded-lg ${metric.bg} flex items-center justify-center shrink-0`}
                >
                  <metric.icon className={`h-4.5 w-4.5 ${metric.color}`} />
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs text-muted-foreground">{metric.label}</p>
                  <p className="text-lg font-semibold tabular-nums">{metric.target}</p>
                  <p className="text-[11px] text-muted-foreground">
                    Baseline: {metric.baseline}{" "}
                    <span className="text-emerald-600 font-medium">
                      ↑ {metric.improvement}
                    </span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <div className="p-6 pb-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Recent Orders</h2>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search orders..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
          </div>
          <div className="flex gap-1.5 mb-4">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  statusFilter === f.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
        <div className="px-6 pb-6">
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
              {filteredOrders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    {search || statusFilter !== "all"
                      ? "No orders match your search or filter."
                      : "No orders yet. Create your first order to get started."}
                  </TableCell>
                </TableRow>
              )}
              {filteredOrders.map((order) => (
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
