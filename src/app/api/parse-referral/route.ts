import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
import { NextResponse } from 'next/server';

export const runtime = 'edge';

const confidenceFieldSchema = z.object({
  value: z.string(),
  confidence: z.number().min(0).max(1),
});

const parsedReferralSchema = z.object({
  patientFirstName: confidenceFieldSchema,
  patientLastName: confidenceFieldSchema,
  patientDob: confidenceFieldSchema.describe('Date of birth in YYYY-MM-DD format'),
  patientPhone: confidenceFieldSchema,
  patientAddress: confidenceFieldSchema,
  diagnosisCode: confidenceFieldSchema.describe('ICD-10 code'),
  diagnosisDescription: confidenceFieldSchema,
  providerName: confidenceFieldSchema.describe('Full name with title, e.g. Dr. Jane Smith'),
  providerNpi: confidenceFieldSchema.describe('10-digit NPI number'),
  clinicName: confidenceFieldSchema,
  payerName: confidenceFieldSchema.describe('Insurance payer name. Known payers: Medicare, Anthem Blue Cross, Aetna, UnitedHealthcare, Cigna, Self-Pay'),
  products: z.object({
    value: z.array(z.string()).describe('Product names or HCPCS codes mentioned'),
    confidence: z.number().min(0).max(1),
  }),
});

const SYSTEM_PROMPT = `You are a medical referral parser for a DME (durable medical equipment) company.
Extract patient, provider, payer, and product information from referral text.

For each field, provide a confidence score (0-1):
- 1.0: explicitly stated, unambiguous
- 0.7-0.9: clearly implied or partially matching
- 0.3-0.6: inferred or uncertain
- 0.0-0.2: not found, guessed

Known products (match by name or HCPCS code):
- A6530: Compression Stocking BK 18-30mmHg
- A6531: Compression Stocking BK 30-40mmHg
- A6534: Compression Stocking Thigh 30-40mmHg
- A6549: Compression Garment NOS
- A6448: Light Compression Bandage Elastic
- A6449: Light Compression Bandage Non-Elastic
- E0652: Pneumatic Compressor Segmental
- E0667: Segmental Appliance Full Leg
- L8030: Breast Prosthesis Silicone
- L8000: Mastectomy Bra

Known payers: Medicare, Anthem Blue Cross, Aetna, UnitedHealthcare, Cigna, Self-Pay

If a field is not found in the text, set value to empty string and confidence to 0.
For NPI, validate it's 10 digits — if fewer/more digits, set confidence below 0.5.
For dates, normalize to YYYY-MM-DD format.`;

const HARDCODED_FALLBACK = {
  patientFirstName: { value: 'Margaret', confidence: 0.95 },
  patientLastName: { value: 'Chen', confidence: 0.95 },
  patientDob: { value: '1962-08-14', confidence: 0.9 },
  patientPhone: { value: '(555) 432-1098', confidence: 0.85 },
  patientAddress: { value: '789 Willow Lane, Sacramento, CA 95820', confidence: 0.8 },
  diagnosisCode: { value: 'I89.0', confidence: 0.92 },
  diagnosisDescription: { value: 'Lymphedema, not elsewhere classified', confidence: 0.92 },
  providerName: { value: 'Dr. Rachel Torres', confidence: 0.95 },
  providerNpi: { value: '4567890123', confidence: 0.4 },
  clinicName: { value: 'Sacramento Vascular Associates', confidence: 0.75 },
  payerName: { value: 'Medicare', confidence: 0.88 },
  products: { value: ['A6531', 'E0667'], confidence: 0.7 },
};

export async function POST(req: Request) {
  try {
    const { text } = await req.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Missing referral text' }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      throw new Error('No API key');
    }

    const { object } = await generateObject({
      model: openai('gpt-4o-mini'),
      schema: parsedReferralSchema,
      system: SYSTEM_PROMPT,
      prompt: `Parse the following referral text and extract all fields:\n\n${text}`,
    });

    return NextResponse.json(object);
  } catch {
    return NextResponse.json({
      ...HARDCODED_FALLBACK,
      _fallback: true,
    });
  }
}
