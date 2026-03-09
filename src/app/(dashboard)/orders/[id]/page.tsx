"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { useOrders } from "@/lib/orders-context";
import { formatCurrency, formatDate, ROUTES } from "@/lib/utils";

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { getOrderById } = useOrders();

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
        <p className="text-muted-foreground">
          No order found with ID {id}.
        </p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.push(ROUTES.dashboard)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Orders
        </Button>
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
                onClick={() => router.push(ROUTES.newOrder)}
              >
                Edit Order
              </Button>
            )}
          </div>
        }
      />

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
                {order.patient.diagnosisCode && (
                  <div className="col-span-2">
                    <span className="text-xs text-muted-foreground">Diagnosis</span>
                    <p className="text-sm">
                      <span className="font-mono text-primary">{order.patient.diagnosisCode}</span>
                      {" — "}
                      {order.patient.diagnosisDescription}
                    </p>
                  </div>
                )}
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
                    <p className="text-xs">Document generation available in Sprint 2</p>
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
