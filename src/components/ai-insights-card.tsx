"use client";

import { useState, useEffect, useCallback } from "react";
import { Sparkles, RefreshCw, AlertTriangle, TrendingUp, CheckCircle2, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Order } from "@/lib/types";

interface AIInsightsCardProps {
  orders: Order[];
}

interface Insight {
  icon: "alert" | "trend" | "check" | "warning";
  text: string;
}

function generateLocalInsights(orders: Order[]): Insight[] {
  if (orders.length === 0)
    return [{ icon: "trend", text: "No orders to analyze. Create your first order to see AI-powered insights." }];

  const insights: Insight[] = [];

  const payerRevenue: Record<string, number> = {};
  let totalRevenue = 0;
  for (const o of orders) {
    payerRevenue[o.payerName] =
      (payerRevenue[o.payerName] || 0) + o.totalAllowedAmount;
    totalRevenue += o.totalAllowedAmount;
  }

  const topPayer = Object.entries(payerRevenue).sort(
    (a, b) => b[1] - a[1]
  )[0];
  if (topPayer && totalRevenue > 0) {
    const pct = Math.round((topPayer[1] / totalRevenue) * 100);
    if (pct > 40) {
      insights.push({
        icon: "warning",
        text: `${pct}% of revenue concentrated in ${topPayer[0]} — diversify payer mix to reduce dependency risk.`,
      });
    }
  }

  const atRiskOrders = orders.filter(
    (o) => o.status === "draft" || o.status === "submitted"
  );
  if (atRiskOrders.length > 0) {
    const atRiskAmount = atRiskOrders.reduce(
      (sum, o) => sum + o.totalAllowedAmount,
      0
    );
    insights.push({
      icon: "alert",
      text: `${atRiskOrders.length} order${atRiskOrders.length > 1 ? "s" : ""} ($${(atRiskAmount / 100).toLocaleString()}) pending review — convert to approved to secure revenue.`,
    });
  }

  const highValueItems = orders.filter((o) =>
    o.lineItems.some((li) => ["E0652", "E0667"].includes(li.hcpcsCode))
  );
  const highValueAtRisk = highValueItems.filter(
    (o) => o.status === "draft" || o.status === "submitted"
  );
  if (highValueAtRisk.length > 0) {
    insights.push({
      icon: "warning",
      text: `${highValueAtRisk.length} order${highValueAtRisk.length > 1 ? "s" : ""} contain pneumatic devices that may require prior authorization.`,
    });
  }

  const completedOrders = orders.filter(
    (o) => o.status === "complete" || o.status === "shipped"
  );
  if (completedOrders.length > 0) {
    const completedRevenue = completedOrders.reduce(
      (sum, o) => sum + o.totalAllowedAmount,
      0
    );
    insights.push({
      icon: "check",
      text: `$${(completedRevenue / 100).toLocaleString()} in fulfilled orders — ${completedOrders.length} of ${orders.length} delivered.`,
    });
  }

  return insights;
}

const INSIGHT_ICONS = {
  alert: AlertCircle,
  trend: TrendingUp,
  check: CheckCircle2,
  warning: AlertTriangle,
};

export function AIInsightsCard({ orders }: AIInsightsCardProps) {
  const [text, setText] = useState("");
  const [bullets, setBullets] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);

  const fetchInsights = useCallback(async () => {
    setLoading(true);
    setText("");
    setBullets([]);

    const summaries = orders.map((o) => ({
      id: o.id,
      payerName: o.payerName,
      payerType: o.payerId === "PAY006" ? "self_pay" : o.payerId === "PAY001" ? "medicare" : "commercial",
      status: o.status,
      totalAllowedAmount: o.totalAllowedAmount,
      lineItemCount: o.lineItems.length,
      hasHighValueItems: o.lineItems.some((li) =>
        ["E0652", "E0667"].includes(li.hcpcsCode)
      ),
      diagnosisCode: o.patient.diagnosisCode,
    }));

    try {
      const res = await fetch("/api/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orders: summaries }),
      });

      const contentType = res.headers.get("content-type") || "";

      if (contentType.includes("application/json")) {
        // JSON fallback response
        const data = await res.json();
        if (data.text) {
          setText(data.text);
        } else {
          setBullets(generateLocalInsights(orders));
        }
      } else {
        // Streaming plain text response
        setIsStreaming(true);
        const reader = res.body?.getReader();
        const decoder = new TextDecoder();
        let accumulated = "";

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            accumulated += decoder.decode(value, { stream: true });
            setText(accumulated);
          }
        }
        setIsStreaming(false);
      }
    } catch {
      setBullets(generateLocalInsights(orders));
    } finally {
      setLoading(false);
      setIsStreaming(false);
    }
  }, [orders]);

  useEffect(() => {
    if (orders.length > 0) {
      fetchInsights();
    }
  }, [orders.length]); // Only re-fetch when order count changes

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <Card className="border-blue-200 bg-gradient-to-br from-blue-50/50 to-white">
        <CardContent className="pt-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-blue-600" />
              <h3 className="text-sm font-semibold text-blue-900">
                Revenue Intelligence
              </h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchInsights}
              disabled={loading}
              className="h-7 px-2 text-blue-600 hover:text-blue-700"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
              />
            </Button>
          </div>
          <div className="min-h-[80px]">
            {loading && !text && bullets.length === 0 ? (
              <div className="space-y-2">
                <div className="h-3 bg-blue-100 rounded animate-pulse w-full" />
                <div className="h-3 bg-blue-100 rounded animate-pulse w-4/5" />
                <div className="h-3 bg-blue-100 rounded animate-pulse w-3/5" />
              </div>
            ) : bullets.length > 0 ? (
              <ul className="space-y-2">
                {bullets.map((insight, i) => {
                  const Icon = INSIGHT_ICONS[insight.icon];
                  return (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Icon className="h-4 w-4 mt-0.5 shrink-0 text-blue-500" />
                      <span>{insight.text}</span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground leading-relaxed">
                {text}
                {isStreaming && (
                  <span className="inline-block w-1.5 h-4 bg-blue-500 ml-0.5 animate-pulse" />
                )}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
