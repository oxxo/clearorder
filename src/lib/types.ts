// --- Enums ---

export type OrderStatus = 'draft' | 'submitted' | 'verified' | 'approved' | 'shipped' | 'complete';

export type PricingConfidence = 'exact' | 'fallback' | 'manual';

export type Modifier = 'RT' | 'LT' | 'KX' | 'NU' | 'RR';

export type ProductCategory =
  | 'compression_stocking'
  | 'compression_bandage'
  | 'pneumatic_device'
  | 'breast_prosthesis'
  | 'mastectomy_bra';

// --- Core Entities ---

export interface Product {
  id: string;
  name: string;
  hcpcsCode: string;
  category: ProductCategory;
  vendor: string;
  msrp: number; // cents
  status: 'active' | 'discontinued';
}

export interface Payer {
  id: string;
  name: string;
  type: 'medicare' | 'commercial' | 'self_pay';
  coinsurancePercent: number; // e.g., 20 for 20%
}

export interface FeeScheduleEntry {
  id: string;
  payerId: string;
  hcpcsCode: string;
  allowedAmount: number; // cents
  effectiveDate: string; // ISO date
}

export interface ReferringProvider {
  name: string;
  npi: string; // 10-digit NPI
  clinic: string;
}

export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  dob: string;
  phone: string;
  address: string;
  diagnosisCode: string; // ICD-10
  diagnosisDescription: string;
}

export interface LineItem {
  id: string;
  productId: string;
  hcpcsCode: string;
  productName: string;
  vendor: string;
  quantity: number;
  modifier: Modifier | null;
  allowedAmount: number; // cents — from fee schedule lookup
  totalAmount: number; // cents — allowedAmount * quantity
  pricingConfidence: PricingConfidence;
}

export interface Order {
  id: string; // format: "ORD-2026-XXXX"
  patientId: string;
  patient: Patient;
  referringProvider: ReferringProvider;
  payerId: string;
  payerName: string;
  status: OrderStatus;
  lineItems: LineItem[];
  totalAllowedAmount: number; // cents
  insurancePays: number; // cents
  patientResponsibility: number; // cents
  createdAt: string; // ISO date
  updatedAt: string; // ISO date
  notes: string;
}

export interface Vendor {
  id: string;
  name: string;
  website: string;
}

// --- AI Features ---

export interface ConfidenceField<T = string> {
  value: T;
  confidence: number; // 0-1
}

export interface ParsedReferral {
  patientFirstName: ConfidenceField;
  patientLastName: ConfidenceField;
  patientDob: ConfidenceField;
  patientPhone: ConfidenceField;
  patientAddress: ConfidenceField;
  diagnosisCode: ConfidenceField;
  diagnosisDescription: ConfidenceField;
  providerName: ConfidenceField;
  providerNpi: ConfidenceField;
  clinicName: ConfidenceField;
  payerName: ConfidenceField;
  products: ConfidenceField<string[]>;
}

export type RiskLevel = 'low' | 'medium' | 'high';

export interface ClaimRisk {
  level: RiskLevel;
  reason: string;
  suggestion: string;
}
