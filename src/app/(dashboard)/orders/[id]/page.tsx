"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, FileText, ChevronRight, CheckCircle2, Package } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { StatusStepper, getNextStatus, getNextStatusLabel } from "@/components/status-stepper";
import { useOrders } from "@/lib/orders-context";
import { formatCurrency, formatDate, ROUTES } from "@/lib/utils";

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { getOrderById, updateOrder } = useOrders();
  const [showCreatedBanner, setShowCreatedBanner] = useState(false);

  useEffect(() => {
    if (searchParams.get("created") === "true") {
      setShowCreatedBanner(true);
      const timer = setTimeout(() => setShowCreatedBanner(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  const order = getOrderById(id);

  if (!order) {
    return (
      <div>
        <PageHeader
          title="Order Not Found"
          breadcrumbs={[
            { label: "Orders", href: ROUTES.dashboard },
            { label: id },
          ]}
        />
        <Card className="py-16">
          <CardContent className="flex flex-col items-center text-center">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
              <FileText className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground mb-4">
              No order found with ID <span className="font-mono font-medium">{id}</span>.
            </p>
            <Button
              variant="outline"
              onClick={() => router.push(ROUTES.dashboard)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Orders
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={order.id}
        breadcrumbs={[
          { label: "Orders", href: ROUTES.dashboard },
          { label: order.id },
        ]}
        action={
          <div className="flex items-center gap-3">
            <StatusBadge status={order.status} />
            {order.status === "draft" && (
              <Button
                variant="outline"
                disabled
                title="Editing available in Sprint 2"
              >
                Edit Order
              </Button>
            )}
          </div>
        }
      />

      {/* Success Banner */}
      <AnimatePresence>
        {showCreatedBanner && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="mb-4 flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3"
          >
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <p className="text-sm font-medium text-emerald-800">
              Order {order.id} created successfully
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Status Stepper */}
      <Card className="mb-6">
        <CardContent className="pt-6 pb-4">
          <StatusStepper currentStatus={order.status} />
          {getNextStatus(order.status) && (
            <div className="flex justify-end mt-4">
              <Button
                onClick={() => {
                  const next = getNextStatus(order.status);
                  if (next) {
                    updateOrder({
                      ...order,
                      status: next,
                      updatedAt: new Date().toISOString(),
                    });
                    toast.success(`Order ${order.id} moved to ${next}`, {
                      description: `Status updated from ${order.status} to ${next}.`,
                    });
                  }
                }}
              >
                {getNextStatusLabel(order.status)}
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-8">
        {/* Left Column — Order Details */}
        <div className="flex-1 space-y-6 min-w-0">
          {/* Patient Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Patient Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                <div>
                  <span className="text-xs text-muted-foreground">Name</span>
                  <p className="text-sm font-medium">
                    {order.patient.firstName} {order.patient.lastName}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Date of Birth</span>
                  <p className="text-sm">{formatDate(order.patient.dob)}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Phone</span>
                  <p className="text-sm">{order.patient.phone || "—"}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Address</span>
                  <p className="text-sm">{order.patient.address || "—"}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-xs text-muted-foreground">Diagnosis</span>
                  {order.patient.diagnosisCode ? (
                    <p className="text-sm">
                      <span className="font-mono text-primary">{order.patient.diagnosisCode}</span>
                      {" — "}
                      {order.patient.diagnosisDescription}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">—</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Referring Provider */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Referring Provider</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <span className="text-xs text-muted-foreground">Provider</span>
                  <p className="text-sm font-medium">{order.referringProvider.name}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">NPI</span>
                  <p className="text-sm font-mono">{order.referringProvider.npi}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Clinic</span>
                  <p className="text-sm">{order.referringProvider.clinic}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Line Items */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Line Items ({order.lineItems.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {order.lineItems.length === 0 ? (
                <div className="flex flex-col items-center py-8 text-center">
                  <Package className="h-8 w-8 text-muted-foreground/40 mb-2" />
                  <p className="text-sm text-muted-foreground">No line items in this order.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {order.lineItems.map((item, index) => (
                    <div key={item.id}>
                      {index > 0 && <Separator className="mb-4" />}
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <p className="text-sm font-medium">{item.productName}</p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="font-mono text-primary">{item.hcpcsCode}</span>
                            <span>{item.vendor}</span>
                            {item.modifier && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                {item.modifier}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-right space-y-1">
                          <p className="text-sm font-medium tabular-nums">
                            {formatCurrency(item.totalAmount)}
                          </p>
                          <p className="text-xs text-muted-foreground tabular-nums">
                            {item.quantity} × {formatCurrency(item.allowedAmount)}
                          </p>
                          <Badge
                            variant="outline"
                            className={
                              item.pricingConfidence === "exact"
                                ? "bg-green-50 text-green-700 border-green-200 text-[10px]"
                                : "bg-yellow-50 text-yellow-700 border-yellow-200 text-[10px]"
                            }
                          >
                            {item.pricingConfidence === "exact" ? "Exact" : "Fallback"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          {order.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{order.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Sprint 2 Preview */}
          <Card className="border-dashed">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-muted-foreground">
                  <FileText className="h-5 w-5" />
                  <div>
                    <p className="text-sm font-medium">Generate Encounter Form</p>
                    <p className="text-xs">Sprint 2 — Required for 100% of Medicare claims. Auto-populates from order data.</p>
                  </div>
                </div>
                <Button variant="outline" disabled>
                  Coming Soon
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column — Order Summary */}
        <div className="w-80 shrink-0">
          <div className="sticky top-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <span className="text-xs text-muted-foreground">Payer</span>
                  <p className="text-sm font-medium">{order.payerName}</p>
                </div>

                <div>
                  <span className="text-xs text-muted-foreground">Created</span>
                  <p className="text-sm">{formatDate(order.createdAt)}</p>
                </div>

                <div>
                  <span className="text-xs text-muted-foreground">Last Updated</span>
                  <p className="text-sm">{formatDate(order.updatedAt)}</p>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Allowed Amount</span>
                    <span className="font-medium tabular-nums">
                      {formatCurrency(order.totalAllowedAmount)}
                    </span>
                  </div>

                  {order.insurancePays > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Insurance Pays</span>
                      <span className="tabular-nums">
                        {formatCurrency(order.insurancePays)}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Patient Responsibility</span>
                    <span className="tabular-nums">
                      {formatCurrency(order.patientResponsibility)}
                    </span>
                  </div>

                  <Separator />

                  <div className="flex justify-between text-base font-semibold">
                    <span>Total</span>
                    <span className="tabular-nums">
                      {formatCurrency(order.totalAllowedAmount)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
