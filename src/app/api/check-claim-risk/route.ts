import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
import { NextResponse } from 'next/server';

export const runtime = 'edge';

const claimRiskSchema = z.object({
  risks: z.array(z.object({
    lineItemId: z.string(),
    level: z.enum(['low', 'medium', 'high']),
    reason: z.string(),
    suggestion: z.string(),
  })),
});

const SYSTEM_PROMPT = `You are a DME claim risk analyst. Evaluate denial risk for each line item.

Rules for risk assessment:
- E0652 (Pneumatic Compressor) with Medicare: HIGH risk — requires prior authorization + KX modifier
- E0652 without KX modifier: HIGH risk — medical necessity not documented
- E0667 (Segmental Appliance) with Medicare: MEDIUM risk — may require prior authorization
- Compression stockings (A6530-A6549) without lymphedema diagnosis (I89.x, I97.2): MEDIUM risk
- Compression stockings quantity > 4: MEDIUM risk — unusual quantity
- Any item quantity > 2 for pneumatic devices: HIGH risk — unusual quantity
- Breast prosthesis/mastectomy items without cancer diagnosis (C50.x): MEDIUM risk
- Self-Pay orders: LOW risk — no claim to deny
- Items with KX modifier: reduces risk by one level

For each line item, provide:
- level: "low", "medium", or "high"
- reason: 1-2 sentence explanation
- suggestion: actionable recommendation`;

interface LineItemInput {
  id: string;
  hcpcsCode: string;
  productName: string;
  quantity: number;
  modifier: string | null;
}

interface RiskInput {
  lineItems: LineItemInput[];
  payerName: string;
  payerType: string;
  diagnosisCode: string;
}

function evaluateRisksLocally(input: RiskInput) {
  const risks = input.lineItems.map((item) => {
    let level: 'low' | 'medium' | 'high' = 'low';
    let reason = 'No significant denial risk identified.';
    let suggestion = 'Proceed with standard submission.';

    // Self-Pay = always low
    if (input.payerType === 'self_pay') {
      return { lineItemId: item.id, level: 'low' as const, reason: 'Self-pay order — no insurance claim to deny.', suggestion: 'Collect payment at time of delivery.' };
    }

    // E0652 rules
    if (item.hcpcsCode === 'E0652') {
      if (input.payerType === 'medicare') {
        level = 'high';
        reason = 'E0652 (Pneumatic Compressor) typically requires prior authorization for Medicare. This is a high-value item ($1,200+) with strict medical necessity requirements.';
        suggestion = 'Obtain prior authorization before submitting. Add KX modifier to document medical necessity. Ensure Encounter Form includes diagnosis documentation.';
      } else {
        level = 'medium';
        reason = 'E0652 (Pneumatic Compressor) is a high-value item that many commercial payers review closely.';
        suggestion = 'Verify payer-specific PA requirements. Consider adding KX modifier for medical necessity documentation.';
      }
      if (item.modifier === 'KX') {
        level = level === 'high' ? 'medium' : 'low';
        suggestion = 'KX modifier present. Ensure supporting documentation is complete.';
      }
    }

    // E0667 rules
    if (item.hcpcsCode === 'E0667' && input.payerType === 'medicare') {
      if (level !== 'high') {
        level = 'medium';
        reason = 'E0667 (Segmental Appliance) may require prior authorization for Medicare depending on regional MAC policies.';
        suggestion = 'Check regional Medicare contractor for PA requirements.';
      }
    }

    // Compression without lymphedema dx
    if (['A6530', 'A6531', 'A6534', 'A6549'].includes(item.hcpcsCode)) {
      const isLymphedema = input.diagnosisCode.startsWith('I89') || input.diagnosisCode.startsWith('I97');
      if (!isLymphedema) {
        level = level === 'low' ? 'medium' : level;
        reason = `Compression garment (${item.hcpcsCode}) without lymphedema diagnosis (${input.diagnosisCode}). Payers may question medical necessity.`;
        suggestion = 'Verify diagnosis supports compression therapy. Consider adding lymphedema-specific ICD-10 code if applicable.';
      }
    }

    // Breast items without cancer dx
    if (['L8030', 'L8000'].includes(item.hcpcsCode)) {
      if (!input.diagnosisCode.startsWith('C50')) {
        level = level === 'low' ? 'medium' : level;
        reason = `${item.productName} without breast cancer diagnosis may be questioned.`;
        suggestion = 'Ensure diagnosis documentation supports medical necessity for breast prosthesis/bra.';
      }
    }

    // Unusual quantity
    if (item.quantity > 4 && ['A6530', 'A6531', 'A6534', 'A6549'].includes(item.hcpcsCode)) {
      level = 'medium';
      reason = `Quantity ${item.quantity} exceeds typical order amount for compression garments.`;
      suggestion = 'Verify quantity is appropriate. Consider splitting into multiple orders if for different limbs.';
    }

    if (item.quantity > 2 && ['E0652', 'E0667'].includes(item.hcpcsCode)) {
      level = 'high';
      reason = `Quantity ${item.quantity} for pneumatic device is unusual and will likely be denied.`;
      suggestion = 'Verify quantity. Most patients need only 1 device.';
    }

    return { lineItemId: item.id, level, reason, suggestion };
  });

  return { risks };
}

export async function POST(req: Request) {
  const input: RiskInput = await req.json();

  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('No API key');
    }

    const { object } = await generateObject({
      model: openai('gpt-4o-mini'),
      schema: claimRiskSchema,
      system: SYSTEM_PROMPT,
      prompt: `Evaluate claim denial risk for this order:

Payer: ${input.payerName} (${input.payerType})
Diagnosis: ${input.diagnosisCode}

Line Items:
${input.lineItems.map((li) => `- ID: ${li.id}, HCPCS: ${li.hcpcsCode}, Product: ${li.productName}, Qty: ${li.quantity}, Modifier: ${li.modifier || 'none'}`).join('\n')}`,
    });

    return NextResponse.json(object);
  } catch {
    return NextResponse.json(evaluateRisksLocally(input));
  }
}
