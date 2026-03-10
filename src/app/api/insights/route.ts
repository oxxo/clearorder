import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { NextResponse } from 'next/server';

export const runtime = 'edge';

interface OrderSummary {
  id: string;
  payerName: string;
  payerType: string;
  status: string;
  totalAllowedAmount: number;
  lineItemCount: number;
  hasHighValueItems: boolean;
  diagnosisCode: string;
}

function generateLocalInsights(orders: OrderSummary[]): string {
  if (orders.length === 0) return 'No orders to analyze. Create your first order to see AI-powered insights.';

  const insights: string[] = [];

  // Payer concentration
  const payerRevenue: Record<string, number> = {};
  let totalRevenue = 0;
  for (const o of orders) {
    payerRevenue[o.payerName] = (payerRevenue[o.payerName] || 0) + o.totalAllowedAmount;
    totalRevenue += o.totalAllowedAmount;
  }

  const topPayer = Object.entries(payerRevenue).sort((a, b) => b[1] - a[1])[0];
  if (topPayer && totalRevenue > 0) {
    const pct = Math.round((topPayer[1] / totalRevenue) * 100);
    if (pct > 50) {
      insights.push(`${pct}% of revenue is concentrated in ${topPayer[0]}. Consider diversifying payer mix to reduce dependency risk.`);
    }
  }

  // At-risk orders
  const atRiskOrders = orders.filter(
    (o) => o.status === 'draft' || o.status === 'submitted'
  );
  if (atRiskOrders.length > 0) {
    const atRiskAmount = atRiskOrders.reduce((sum, o) => sum + o.totalAllowedAmount, 0);
    insights.push(
      `${atRiskOrders.length} order${atRiskOrders.length > 1 ? 's' : ''} ($${(atRiskAmount / 100).toLocaleString()}) pending review — convert to approved to secure revenue.`
    );
  }

  // High-value items without PA
  const highValueAtRisk = orders.filter(
    (o) => o.hasHighValueItems && (o.status === 'draft' || o.status === 'submitted')
  );
  if (highValueAtRisk.length > 0) {
    insights.push(
      `${highValueAtRisk.length} order${highValueAtRisk.length > 1 ? 's' : ''} contain high-value items (pneumatic devices) that may require prior authorization. Verify PA status before submission.`
    );
  }

  // Completed revenue
  const completedOrders = orders.filter(
    (o) => o.status === 'complete' || o.status === 'shipped'
  );
  if (completedOrders.length > 0) {
    const completedRevenue = completedOrders.reduce((sum, o) => sum + o.totalAllowedAmount, 0);
    insights.push(
      `$${(completedRevenue / 100).toLocaleString()} in fulfilled orders this period. ${completedOrders.length} of ${orders.length} orders delivered.`
    );
  }

  // Order volume trend
  if (orders.length >= 5) {
    insights.push(
      `Strong order volume with ${orders.length} active orders across ${Object.keys(payerRevenue).length} payers. Pipeline looks healthy.`
    );
  }

  return insights.join(' ');
}

export async function POST(req: Request) {
  const { orders }: { orders: OrderSummary[] } = await req.json();

  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('No API key');
    }

    const result = streamText({
      model: openai('gpt-4o-mini'),
      system: `You are a revenue intelligence analyst for a DME (durable medical equipment) company.
Analyze the order portfolio and provide 3-4 concise, actionable insights.
Focus on: payer concentration risk, revenue at risk, prior auth needs, and pipeline health.
Be specific — reference order IDs and dollar amounts. Keep total response under 100 words.
Write in a direct, advisory tone.`,
      prompt: `Analyze this order portfolio:\n\n${JSON.stringify(orders, null, 2)}`,
    });

    return result.toTextStreamResponse();
  } catch {
    return NextResponse.json({ text: generateLocalInsights(orders) });
  }
}
