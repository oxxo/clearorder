import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { OrderStatus, PricingConfidence, LineItem } from "./types";
import { FEE_SCHEDULE, PRODUCTS } from "./data";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Currency ---

export function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

// --- Pricing Logic ---

export function lookupPrice(
  payerId: string,
  hcpcsCode: string
): { amount: number; confidence: PricingConfidence } {
  // Self-Pay has no fee schedule — always MSRP
  if (payerId === "PAY006") {
    const product = PRODUCTS.find((p) => p.hcpcsCode === hcpcsCode);
    return { amount: product?.msrp ?? 0, confidence: "fallback" };
  }

  const entry = FEE_SCHEDULE.find(
    (e) => e.payerId === payerId && e.hcpcsCode === hcpcsCode
  );

  if (entry) {
    return { amount: entry.allowedAmount, confidence: "exact" };
  }

  // Fallback to MSRP
  const product = PRODUCTS.find((p) => p.hcpcsCode === hcpcsCode);
  if (product) {
    return { amount: product.msrp, confidence: "fallback" };
  }

  return { amount: 0, confidence: "manual" };
}

export function calculateOrderTotals(
  lineItems: LineItem[],
  coinsurancePercent: number
) {
  const totalAllowedAmount = lineItems.reduce(
    (sum, item) => sum + item.totalAmount,
    0
  );
  const patientResponsibility = Math.round(
    totalAllowedAmount * (coinsurancePercent / 100)
  );
  const insurancePays = totalAllowedAmount - patientResponsibility;

  return { totalAllowedAmount, insurancePays, patientResponsibility };
}

// --- Status ---

const STATUS_STYLES: Record<OrderStatus, { bg: string; text: string }> = {
  draft: { bg: "bg-gray-100 text-gray-700 border-gray-200", text: "Draft" },
  submitted: { bg: "bg-blue-100 text-blue-700 border-blue-200", text: "Submitted" },
  verified: { bg: "bg-yellow-100 text-yellow-700 border-yellow-200", text: "Verified" },
  approved: { bg: "bg-green-100 text-green-700 border-green-200", text: "Approved" },
  shipped: { bg: "bg-purple-100 text-purple-700 border-purple-200", text: "Shipped" },
  complete: { bg: "bg-emerald-100 text-emerald-700 border-emerald-200", text: "Complete" },
};

export function getStatusStyle(status: OrderStatus) {
  return STATUS_STYLES[status];
}

// --- Dates ---

export function formatDate(isoString: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(isoString));
}

export function formatRelativeDate(isoString: string): string {
  const now = new Date();
  const date = new Date(isoString);
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return formatDate(isoString);
}

// --- ID Generation ---

let orderCounter = 150; // default start; synced from localStorage on hydrate

export function syncOrderCounter(orders: { id: string }[]): void {
  let max = 149;
  for (const o of orders) {
    const match = o.id.match(/ORD-\d{4}-(\d+)/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > max) max = num;
    }
  }
  orderCounter = max;
}

export function generateOrderId(): string {
  orderCounter++;
  return `ORD-2026-${String(orderCounter).padStart(4, "0")}`;
}

// --- Routes ---

export const ROUTES = {
  dashboard: "/",
  newOrder: "/orders/new",
  orderDetail: (id: string) => `/orders/${id}`,
  products: "/products",
  feeSchedules: "/fee-schedules",
} as const;
