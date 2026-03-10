"use client";

import { Shield } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { ClaimRisk } from "@/lib/types";

const RISK_STYLES = {
  low: {
    icon: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    label: "Low Risk",
    labelColor: "text-emerald-700",
  },
  medium: {
    icon: "text-amber-500",
    bg: "bg-amber-50",
    border: "border-amber-200",
    label: "Medium Risk",
    labelColor: "text-amber-700",
  },
  high: {
    icon: "text-red-600",
    bg: "bg-red-50",
    border: "border-red-200",
    label: "High Risk",
    labelColor: "text-red-700",
  },
};

interface ClaimRiskBadgeProps {
  risk: ClaimRisk;
}

export function ClaimRiskBadge({ risk }: ClaimRiskBadgeProps) {
  const style = RISK_STYLES[risk.level];

  return (
    <Popover>
      <PopoverTrigger
        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium ${style.bg} ${style.border} border hover:opacity-80 transition-opacity cursor-pointer`}
      >
        <Shield className={`h-3 w-3 ${style.icon}`} />
        <span className={style.labelColor}>{style.label}</span>
      </PopoverTrigger>
      <PopoverContent className="w-80" side="left">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Shield className={`h-4 w-4 ${style.icon}`} />
            <h4 className={`font-semibold text-sm ${style.labelColor}`}>
              {style.label}
            </h4>
          </div>
          <p className="text-sm text-muted-foreground">{risk.reason}</p>
          <div className="pt-2 border-t">
            <p className="text-xs font-medium text-foreground">Suggestion</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {risk.suggestion}
            </p>
          </div>
          <div className="pt-2 border-t">
            <p className="text-[10px] text-muted-foreground/60 italic">
              Assumption: AI risk scoring reduces denial rates. Validate: compare AI-flagged vs actual denials over 90 days.
            </p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
