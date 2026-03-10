"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Plus, Trash2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/page-header";
import { ProductCombobox } from "@/components/product-combobox";
import { SmartPasteBanner } from "@/components/smart-paste-banner";
import { ClaimRiskBadge } from "@/components/claim-risk-badge";
import { useOrders } from "@/lib/orders-context";
import { PAYERS } from "@/lib/data";
import type { LineItem, Modifier, Product, Order, ParsedReferral, ClaimRisk } from "@/lib/types";
import {
  lookupPrice,
  calculateOrderTotals,
  formatCurrency,
  generateOrderId,
  ROUTES,
} from "@/lib/utils";

const MODIFIERS: { value: Modifier; label: string }[] = [
  { value: "RT", label: "RT (Right)" },
  { value: "LT", label: "LT (Left)" },
  { value: "KX", label: "KX (Medical Necessity)" },
  { value: "NU", label: "NU (New Equipment)" },
  { value: "RR", label: "RR (Rental)" },
];

interface FormLineItem extends LineItem {
  prevAllowedAmount?: number; // for delta indicators
}

export default function NewOrderPage() {
  const router = useRouter();
  const { addOrder } = useOrders();
  const lineItemCounter = useRef(0);

  // Patient
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dob, setDob] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [diagnosisCode, setDiagnosisCode] = useState("");
  const [diagnosisDesc, setDiagnosisDesc] = useState("");

  // Provider
  const [providerName, setProviderName] = useState("");
  const [providerNpi, setProviderNpi] = useState("");
  const [clinicName, setClinicName] = useState("");

  // Payer
  const [payerId, setPayerId] = useState<string>("");

  // Line Items
  const [lineItems, setLineItems] = useState<FormLineItem[]>([]);

  // Notes
  const [notes, setNotes] = useState("");

  // Confirm dialog
  const [showConfirm, setShowConfirm] = useState(false);

  // Validation
  const [errors, setErrors] = useState<Record<string, string>>({});

  // AI Confidence tracking (field name -> confidence 0-1)
  const [fieldConfidence, setFieldConfidence] = useState<Record<string, number>>({});

  // Claim Risk tracking (lineItem id -> risk)
  const [claimRisks, setClaimRisks] = useState<Record<string, ClaimRisk>>({});

  const handleSmartPaste = useCallback((data: ParsedReferral) => {
    const confidence: Record<string, number> = {};

    if (data.patientFirstName.value) {
      setFirstName(data.patientFirstName.value);
      confidence.firstName = data.patientFirstName.confidence;
    }
    if (data.patientLastName.value) {
      setLastName(data.patientLastName.value);
      confidence.lastName = data.patientLastName.confidence;
    }
    if (data.patientDob.value) {
      setDob(data.patientDob.value);
      confidence.dob = data.patientDob.confidence;
    }
    if (data.patientPhone.value) {
      setPhone(data.patientPhone.value);
      confidence.phone = data.patientPhone.confidence;
    }
    if (data.patientAddress.value) {
      setAddress(data.patientAddress.value);
      confidence.address = data.patientAddress.confidence;
    }
    if (data.diagnosisCode.value) {
      setDiagnosisCode(data.diagnosisCode.value);
      confidence.diagnosisCode = data.diagnosisCode.confidence;
    }
    if (data.diagnosisDescription.value) {
      setDiagnosisDesc(data.diagnosisDescription.value);
      confidence.diagnosisDesc = data.diagnosisDescription.confidence;
    }
    if (data.providerName.value) {
      setProviderName(data.providerName.value);
      confidence.providerName = data.providerName.confidence;
    }
    if (data.providerNpi.value) {
      setProviderNpi(data.providerNpi.value);
      confidence.providerNpi = data.providerNpi.confidence;
    }
    if (data.clinicName.value) {
      setClinicName(data.clinicName.value);
      confidence.clinicName = data.clinicName.confidence;
    }

    // Match payer by name (fuzzy — handles "Medicare Part B" → "Medicare")
    if (data.payerName.value) {
      const val = data.payerName.value.toLowerCase();
      const matched = PAYERS.find(
        (p) => {
          const name = p.name.toLowerCase();
          return name === val || name.includes(val) || val.includes(name);
        }
      );
      if (matched) {
        setPayerId(matched.id);
        confidence.payerId = data.payerName.confidence;
      }
    }

    setFieldConfidence(confidence);
    setErrors({});
    toast.success("AI extracted fields from referral", {
      description: "Review highlighted fields before submitting.",
    });
  }, []);

  const payer = PAYERS.find((p) => p.id === payerId);

  // Check claim risks when line items or payer changes (debounced 500ms)
  useEffect(() => {
    if (lineItems.length === 0 || !payerId) {
      setClaimRisks({});
      return;
    }

    const itemsWithProducts = lineItems.filter((li) => li.productId);
    if (itemsWithProducts.length === 0) return;

    const controller = new AbortController();

    const timeout = setTimeout(() => {
      fetch("/api/check-claim-risk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lineItems: itemsWithProducts.map((li) => ({
            id: li.id,
            hcpcsCode: li.hcpcsCode,
            productName: li.productName,
            quantity: li.quantity,
            modifier: li.modifier,
          })),
          payerName: payer?.name ?? "",
          payerType: payer?.type ?? "",
          diagnosisCode,
        }),
        signal: controller.signal,
      })
        .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
        .then((data) => {
          const map: Record<string, ClaimRisk> = {};
          for (const risk of data.risks ?? []) {
            map[risk.lineItemId] = {
              level: risk.level,
              reason: risk.reason,
              suggestion: risk.suggestion,
            };
          }
          setClaimRisks(map);
        })
        .catch(() => {});
    }, 500);

    return () => { clearTimeout(timeout); controller.abort(); };
  }, [lineItems, payerId, diagnosisCode, payer?.name, payer?.type]);

  function confidenceBorder(field: string): string {
    const c = fieldConfidence[field];
    if (c === undefined) return "";
    if (c >= 0.9) return "border-l-4 border-l-emerald-500";
    if (c >= 0.5) return "border-l-4 border-l-amber-500";
    return "border-l-4 border-l-red-500";
  }

  const recalculateLineItem = useCallback(
    (item: FormLineItem, newPayerId: string): FormLineItem => {
      if (!item.productId) return item;
      const { amount, confidence } = lookupPrice(newPayerId, item.hcpcsCode);
      return {
        ...item,
        prevAllowedAmount: item.allowedAmount > 0 ? item.allowedAmount : undefined,
        allowedAmount: amount,
        totalAmount: amount * item.quantity,
        pricingConfidence: confidence,
      };
    },
    []
  );

  const handlePayerChange = (newPayerId: string) => {
    const hadItems = lineItems.length > 0 && lineItems.some((li) => li.productId);
    const prevPayerId = payerId;
    setPayerId(newPayerId);

    if (hadItems && prevPayerId && prevPayerId !== newPayerId) {
      const newPayer = PAYERS.find((p) => p.id === newPayerId);
      const updated = lineItems.map((item) => recalculateLineItem(item, newPayerId));
      setLineItems(updated);
      toast.info(
        `Recalculating ${updated.filter((li) => li.productId).length} items for ${newPayer?.name} rates...`
      );
    } else if (hadItems) {
      setLineItems((prev) =>
        prev.map((item) => recalculateLineItem(item, newPayerId))
      );
    }
  };

  const addLineItem = () => {
    lineItemCounter.current++;
    const newItem: FormLineItem = {
      id: `NEW-${lineItemCounter.current}`,
      productId: "",
      hcpcsCode: "",
      productName: "",
      vendor: "",
      quantity: 1,
      modifier: null,
      allowedAmount: 0,
      totalAmount: 0,
      pricingConfidence: "manual",
    };
    setLineItems((prev) => [...prev, newItem]);
  };

  const removeLineItem = (id: string) => {
    setLineItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleProductSelect = (lineItemId: string, product: Product) => {
    setLineItems((prev) =>
      prev.map((item) => {
        if (item.id !== lineItemId) return item;
        const { amount, confidence } = payerId
          ? lookupPrice(payerId, product.hcpcsCode)
          : { amount: product.msrp, confidence: "fallback" as const };
        return {
          ...item,
          productId: product.id,
          hcpcsCode: product.hcpcsCode,
          productName: product.name,
          vendor: product.vendor,
          allowedAmount: amount,
          totalAmount: amount * item.quantity,
          pricingConfidence: confidence,
          prevAllowedAmount: undefined,
        };
      })
    );
  };

  const handleQuantityChange = (lineItemId: string, qty: number) => {
    setLineItems((prev) =>
      prev.map((item) => {
        if (item.id !== lineItemId) return item;
        const quantity = Math.max(1, qty);
        return {
          ...item,
          quantity,
          totalAmount: item.allowedAmount * quantity,
          prevAllowedAmount: undefined,
        };
      })
    );
  };

  const handleModifierChange = (lineItemId: string, mod: Modifier | "none") => {
    setLineItems((prev) =>
      prev.map((item) =>
        item.id === lineItemId
          ? { ...item, modifier: mod === "none" ? null : mod, prevAllowedAmount: undefined }
          : item
      )
    );
  };

  const totals = calculateOrderTotals(
    lineItems.filter((li) => li.productId),
    payer?.coinsurancePercent ?? 0
  );

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!firstName.trim()) newErrors.firstName = "First name is required";
    if (!lastName.trim()) newErrors.lastName = "Last name is required";
    if (!providerName.trim()) newErrors.providerName = "Provider name is required";
    if (!providerNpi.trim()) newErrors.providerNpi = "NPI is required";
    else if (!/^\d{10}$/.test(providerNpi)) newErrors.providerNpi = "NPI must be 10 digits";
    if (!payerId) newErrors.payerId = "Select a payer";
    if (lineItems.filter((li) => li.productId).length === 0)
      newErrors.lineItems = "Add at least one item";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (asDraft: boolean) => {
    if (!asDraft && !validate()) {
      toast.error("Please fix the errors before submitting");
      return;
    }

    const order: Order = {
      id: generateOrderId(),
      patientId: `PT-NEW-${Date.now()}`,
      patient: {
        id: `PT-NEW-${Date.now()}`,
        firstName: firstName || "New",
        lastName: lastName || "Patient",
        dob: dob || "2000-01-01",
        phone: phone || "",
        address: address || "",
        diagnosisCode: diagnosisCode || "",
        diagnosisDescription: diagnosisDesc || "",
      },
      referringProvider: {
        name: providerName || "Unknown",
        npi: providerNpi || "0000000000",
        clinic: clinicName || "",
      },
      payerId: payerId || "PAY006",
      payerName: payer?.name || "Self-Pay",
      status: asDraft ? "draft" : "submitted",
      lineItems: lineItems.filter((li) => li.productId),
      totalAllowedAmount: totals.totalAllowedAmount,
      insurancePays: totals.insurancePays,
      patientResponsibility: totals.patientResponsibility,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      notes,
    };

    addOrder(order);
    toast.success(`Order ${order.id} ${asDraft ? "saved as draft" : "created"}`, {
      action: {
        label: "View",
        onClick: () => router.push(`${ROUTES.orderDetail(order.id)}?created=true`),
      },
    });
    router.push(`${ROUTES.orderDetail(order.id)}?created=true`);
  };

  return (
    <div>
      <PageHeader
        title="New Order"
        breadcrumbs={[
          { label: "Orders", href: ROUTES.dashboard },
          { label: "New Order" },
        ]}
      />

      <SmartPasteBanner onParsed={handleSmartPaste} />

      <div className="flex gap-8">
        {/* Left Column — Form */}
        <div className="flex-1 space-y-6 min-w-0">
          {/* Patient Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Patient Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="patient-first-name" className="text-sm font-medium mb-1.5 block">
                    First Name <span className="text-destructive">*</span>
                  </label>
                  <Input
                    id="patient-first-name"
                    value={firstName}
                    onChange={(e) => { setFirstName(e.target.value); setFieldConfidence((p) => { const n = { ...p }; delete n.firstName; return n; }); }}
                    placeholder="Maria"
                    className={`${errors.firstName ? "border-destructive" : ""} ${confidenceBorder("firstName")}`}
                  />
                  {errors.firstName && (
                    <p className="text-xs text-destructive mt-1">{errors.firstName}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="patient-last-name" className="text-sm font-medium mb-1.5 block">
                    Last Name <span className="text-destructive">*</span>
                  </label>
                  <Input
                    id="patient-last-name"
                    value={lastName}
                    onChange={(e) => { setLastName(e.target.value); setFieldConfidence((p) => { const n = { ...p }; delete n.lastName; return n; }); }}
                    placeholder="Rodriguez"
                    className={`${errors.lastName ? "border-destructive" : ""} ${confidenceBorder("lastName")}`}
                  />
                  {errors.lastName && (
                    <p className="text-xs text-destructive mt-1">{errors.lastName}</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label htmlFor="patient-dob" className="text-sm font-medium mb-1.5 block">Date of Birth</label>
                  <Input id="patient-dob" type="date" value={dob} onChange={(e) => { setDob(e.target.value); setFieldConfidence((p) => { const n = { ...p }; delete n.dob; return n; }); }} className={confidenceBorder("dob")} />
                </div>
                <div>
                  <label htmlFor="patient-phone" className="text-sm font-medium mb-1.5 block">Phone</label>
                  <Input
                    id="patient-phone"
                    value={phone}
                    onChange={(e) => { setPhone(e.target.value); setFieldConfidence((p) => { const n = { ...p }; delete n.phone; return n; }); }}
                    placeholder="(555) 234-5678"
                    className={confidenceBorder("phone")}
                  />
                </div>
                <div>
                  <label htmlFor="patient-address" className="text-sm font-medium mb-1.5 block">Address</label>
                  <Input
                    id="patient-address"
                    value={address}
                    onChange={(e) => { setAddress(e.target.value); setFieldConfidence((p) => { const n = { ...p }; delete n.address; return n; }); }}
                    placeholder="1234 Oak Ave, Sacramento, CA"
                    className={confidenceBorder("address")}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="diagnosis-code" className="text-sm font-medium mb-1.5 block">Diagnosis Code (ICD-10)</label>
                  <Input
                    id="diagnosis-code"
                    value={diagnosisCode}
                    onChange={(e) => { setDiagnosisCode(e.target.value); setFieldConfidence((p) => { const n = { ...p }; delete n.diagnosisCode; return n; }); }}
                    placeholder="I97.2"
                    className={confidenceBorder("diagnosisCode")}
                  />
                </div>
                <div>
                  <label htmlFor="diagnosis-desc" className="text-sm font-medium mb-1.5 block">Diagnosis Description</label>
                  <Input
                    id="diagnosis-desc"
                    value={diagnosisDesc}
                    onChange={(e) => { setDiagnosisDesc(e.target.value); setFieldConfidence((p) => { const n = { ...p }; delete n.diagnosisDesc; return n; }); }}
                    placeholder="Postmastectomy lymphedema syndrome"
                    className={confidenceBorder("diagnosisDesc")}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Referring Provider */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Referring Provider</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label htmlFor="provider-name" className="text-sm font-medium mb-1.5 block">
                    Provider Name <span className="text-destructive">*</span>
                  </label>
                  <Input
                    id="provider-name"
                    value={providerName}
                    onChange={(e) => { setProviderName(e.target.value); setFieldConfidence((p) => { const n = { ...p }; delete n.providerName; return n; }); }}
                    placeholder="Dr. Sarah Chen"
                    className={`${errors.providerName ? "border-destructive" : ""} ${confidenceBorder("providerName")}`}
                  />
                  {errors.providerName && (
                    <p className="text-xs text-destructive mt-1">{errors.providerName}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="provider-npi" className="text-sm font-medium mb-1.5 block">
                    NPI <span className="text-destructive">*</span>
                  </label>
                  <Input
                    id="provider-npi"
                    value={providerNpi}
                    onChange={(e) => { setProviderNpi(e.target.value); setFieldConfidence((p) => { const n = { ...p }; delete n.providerNpi; return n; }); }}
                    placeholder="1234567890"
                    maxLength={10}
                    className={`${errors.providerNpi ? "border-destructive" : ""} ${confidenceBorder("providerNpi")}`}
                  />
                  {errors.providerNpi && (
                    <p className="text-xs text-destructive mt-1">{errors.providerNpi}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="clinic-name" className="text-sm font-medium mb-1.5 block">Clinic</label>
                  <Input
                    id="clinic-name"
                    value={clinicName}
                    onChange={(e) => { setClinicName(e.target.value); setFieldConfidence((p) => { const n = { ...p }; delete n.clinicName; return n; }); }}
                    placeholder="Pacific Lymphedema Clinic"
                    className={confidenceBorder("clinicName")}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payer Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Insurance / Payer</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-w-sm">
                <label className="text-sm font-medium mb-1.5 block">
                  Payer <span className="text-destructive">*</span>
                </label>
                <Select value={payerId} onValueChange={(val) => val && handlePayerChange(val)}>
                  <SelectTrigger className={errors.payerId ? "border-destructive" : ""}>
                    <SelectValue placeholder="Select payer..." />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYERS.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                        {p.type === "self_pay" && " (No Insurance)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.payerId && (
                  <p className="text-xs text-destructive mt-1">{errors.payerId}</p>
                )}
                {payer?.type === "self_pay" && (
                  <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Self-Pay: MSRP pricing applies
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Line Items */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Line Items</CardTitle>
              <Button size="sm" variant="outline" onClick={addLineItem}>
                <Plus className="h-4 w-4 mr-1" />
                Add Item
              </Button>
            </CardHeader>
            <CardContent>
              {errors.lineItems && (
                <p className="text-sm text-destructive mb-4 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.lineItems}
                </p>
              )}

              <AnimatePresence mode="popLayout">
                {lineItems.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    {index > 0 && <Separator className="my-4" />}
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="flex-1">
                          <label className="text-sm font-medium mb-1.5 block">
                            Product
                          </label>
                          <ProductCombobox
                            value={item.productId || null}
                            onSelect={(product) =>
                              handleProductSelect(item.id, product)
                            }
                          />
                        </div>
                        <div className="w-20">
                          <label className="text-sm font-medium mb-1.5 block">Qty</label>
                          <Input
                            type="number"
                            min={1}
                            value={item.quantity}
                            onChange={(e) =>
                              handleQuantityChange(
                                item.id,
                                parseInt(e.target.value) || 1
                              )
                            }
                          />
                        </div>
                        <div className="w-44">
                          <label className="text-sm font-medium mb-1.5 block">
                            Modifier
                          </label>
                          <Select
                            value={item.modifier || "none"}
                            onValueChange={(val) => { if (val) handleModifierChange(item.id, val as Modifier | "none"); }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="None" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">None</SelectItem>
                              {MODIFIERS.map((m) => (
                                <SelectItem key={m.value} value={m.value}>
                                  {m.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="mt-7 text-muted-foreground hover:text-destructive"
                          onClick={() => removeLineItem(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Auto-filled fields with cascade animation */}
                      {item.productId && (
                        <motion.div
                          className="grid grid-cols-4 gap-3 pl-0"
                          initial="hidden"
                          animate="show"
                          variants={{
                            hidden: {},
                            show: { transition: { staggerChildren: 0.08 } },
                          }}
                        >
                          <motion.div
                            variants={{
                              hidden: { opacity: 0, y: 8 },
                              show: { opacity: 1, y: 0 },
                            }}
                          >
                            <span className="text-xs text-muted-foreground">HCPCS</span>
                            <p className="font-mono text-sm font-medium text-primary">
                              {item.hcpcsCode}
                            </p>
                          </motion.div>
                          <motion.div
                            variants={{
                              hidden: { opacity: 0, y: 8 },
                              show: { opacity: 1, y: 0 },
                            }}
                          >
                            <span className="text-xs text-muted-foreground">Vendor</span>
                            <p className="text-sm">{item.vendor}</p>
                          </motion.div>
                          <motion.div
                            variants={{
                              hidden: { opacity: 0, y: 8 },
                              show: { opacity: 1, y: 0 },
                            }}
                          >
                            <span className="text-xs text-muted-foreground">
                              Allowed Amount
                            </span>
                            <div className="flex items-center gap-2">
                              <motion.p
                                key={item.allowedAmount}
                                initial={
                                  item.prevAllowedAmount
                                    ? { backgroundColor: "rgba(234, 179, 8, 0.3)" }
                                    : {}
                                }
                                animate={{ backgroundColor: "rgba(234, 179, 8, 0)" }}
                                transition={{ duration: 1 }}
                                className="text-sm font-medium tabular-nums rounded px-1 -mx-1"
                              >
                                {formatCurrency(item.allowedAmount)}
                              </motion.p>
                              {item.prevAllowedAmount !== undefined &&
                                item.prevAllowedAmount !== item.allowedAmount && (
                                  <motion.span
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className={`text-xs font-medium tabular-nums ${
                                      item.allowedAmount > item.prevAllowedAmount
                                        ? "text-green-600"
                                        : "text-red-600"
                                    }`}
                                  >
                                    {item.allowedAmount > item.prevAllowedAmount
                                      ? "+"
                                      : ""}
                                    {formatCurrency(
                                      item.allowedAmount - item.prevAllowedAmount
                                    )}
                                  </motion.span>
                                )}
                            </div>
                          </motion.div>
                          <motion.div
                            variants={{
                              hidden: { opacity: 0, y: 8 },
                              show: { opacity: 1, y: 0 },
                            }}
                            className="flex items-end justify-between"
                          >
                            <div>
                              <span className="text-xs text-muted-foreground">
                                Line Total
                              </span>
                              <p className="text-sm font-semibold tabular-nums">
                                {formatCurrency(item.totalAmount)}
                              </p>
                            </div>
                            <Badge
                              variant="outline"
                              className={
                                item.pricingConfidence === "exact"
                                  ? "bg-green-50 text-green-700 border-green-200"
                                  : "bg-yellow-50 text-yellow-700 border-yellow-200"
                              }
                            >
                              {item.pricingConfidence === "exact"
                                ? "Exact"
                                : payerId === "PAY006"
                                  ? "MSRP"
                                  : "Fallback"}
                            </Badge>
                            {claimRisks[item.id] && (
                              <ClaimRiskBadge risk={claimRisks[item.id]} />
                            )}
                          </motion.div>
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {lineItems.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-sm">No items added yet</p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-3"
                    onClick={addLineItem}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add First Item
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional notes about this order..."
                rows={3}
              />
            </CardContent>
          </Card>

          {/* Actions — sticky bottom */}
          <div className="sticky bottom-0 bg-background/95 backdrop-blur border-t border-border -mx-8 px-8 py-4 flex items-center justify-end gap-3 shadow-[0_-1px_3px_0_rgba(0,0,0,0.05)]">
            <Button variant="outline" onClick={() => handleSubmit(true)}>
              Save Draft
            </Button>
            <Button onClick={() => {
              if (!validate()) {
                toast.error("Please fix the errors before submitting");
                return;
              }
              setShowConfirm(true);
            }}>Create Order</Button>
          </div>

          {/* Confirmation Dialog */}
          <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Submit Order</DialogTitle>
                <DialogDescription>
                  This will create a new order for{" "}
                  <strong>{firstName} {lastName}</strong> with{" "}
                  {lineItems.filter((li) => li.productId).length} item(s) totaling{" "}
                  <strong>{formatCurrency(totals.totalAllowedAmount)}</strong>.
                  The order will be submitted to <strong>{payer?.name || "Self-Pay"}</strong>.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button onClick={() => {
                  setShowConfirm(false);
                  handleSubmit(false);
                }}>
                  Confirm & Submit
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Right Column — Sticky Order Summary */}
        <div className="w-80 shrink-0">
          <div className="sticky top-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {(firstName || lastName) && (
                  <div>
                    <span className="text-xs text-muted-foreground">Patient</span>
                    <p className="text-sm font-medium">
                      {firstName} {lastName}
                    </p>
                  </div>
                )}

                {payer && (
                  <div>
                    <span className="text-xs text-muted-foreground">Payer</span>
                    <p className="text-sm font-medium">{payer.name}</p>
                  </div>
                )}

                <div>
                  <span className="text-xs text-muted-foreground">Items</span>
                  <p className="text-sm font-medium">
                    {lineItems.filter((li) => li.productId).length}
                  </p>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Allowed Amount</span>
                    <motion.span
                      key={totals.totalAllowedAmount}
                      initial={{ scale: 1.05 }}
                      animate={{ scale: 1 }}
                      className="font-medium tabular-nums"
                    >
                      {formatCurrency(totals.totalAllowedAmount)}
                    </motion.span>
                  </div>

                  {payer && payer.type !== "self_pay" && (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          Insurance Pays ({100 - payer.coinsurancePercent}%)
                        </span>
                        <span className="tabular-nums">
                          {formatCurrency(totals.insurancePays)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          Patient ({payer.coinsurancePercent}%)
                        </span>
                        <span className="tabular-nums">
                          {formatCurrency(totals.patientResponsibility)}
                        </span>
                      </div>
                    </>
                  )}

                  <Separator />

                  <div className="flex justify-between text-base font-semibold">
                    <span>Total</span>
                    <motion.span
                      key={totals.totalAllowedAmount}
                      initial={{ scale: 1.08, color: "rgb(37, 99, 235)" }}
                      animate={{ scale: 1, color: "inherit" }}
                      transition={{ duration: 0.4 }}
                      className="tabular-nums"
                    >
                      {formatCurrency(totals.totalAllowedAmount)}
                    </motion.span>
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
