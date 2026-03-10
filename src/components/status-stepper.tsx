"use client";

import { Check } from "lucide-react";
import type { OrderStatus } from "@/lib/types";

const STEPS: { status: OrderStatus; label: string }[] = [
  { status: "draft", label: "Draft" },
  { status: "submitted", label: "Submitted" },
  { status: "verified", label: "Verified" },
  { status: "approved", label: "Approved" },
  { status: "shipped", label: "Shipped" },
  { status: "complete", label: "Complete" },
];

const STATUS_ORDER: Record<OrderStatus, number> = {
  draft: 0,
  submitted: 1,
  verified: 2,
  approved: 3,
  shipped: 4,
  complete: 5,
};

interface StatusStepperProps {
  currentStatus: OrderStatus;
}

export function StatusStepper({ currentStatus }: StatusStepperProps) {
  const currentIndex = STATUS_ORDER[currentStatus];

  return (
    <div className="flex items-center w-full">
      {STEPS.map((step, i) => {
        const isCompleted = i < currentIndex;
        const isCurrent = i === currentIndex;

        return (
          <div key={step.status} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                  isCompleted
                    ? "bg-emerald-500 text-white"
                    : isCurrent
                      ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4" />
                ) : (
                  i + 1
                )}
              </div>
              <span
                className={`text-[10px] mt-1.5 font-medium ${
                  isCurrent
                    ? "text-primary"
                    : isCompleted
                      ? "text-emerald-600"
                      : "text-muted-foreground"
                }`}
              >
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-2 ${
                  i < currentIndex ? "bg-emerald-500" : "bg-muted"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export function getNextStatus(current: OrderStatus): OrderStatus | null {
  const order: OrderStatus[] = ["draft", "submitted", "verified", "approved", "shipped", "complete"];
  const idx = order.indexOf(current);
  if (idx < order.length - 1) return order[idx + 1];
  return null;
}

export function getNextStatusLabel(current: OrderStatus): string | null {
  const next = getNextStatus(current);
  if (!next) return null;
  const labels: Record<OrderStatus, string> = {
    draft: "Save Draft",
    submitted: "Submit",
    verified: "Verify",
    approved: "Approve",
    shipped: "Mark Shipped",
    complete: "Mark Complete",
  };
  return labels[next];
}
