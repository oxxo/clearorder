import type { Product, Payer, FeeScheduleEntry, Vendor, Order } from './types';

// --- Products (10 items, real HCPCS codes) ---

export const PRODUCTS: Product[] = [
  { id: 'P001', name: 'Compression Stocking BK 18-30mmHg', hcpcsCode: 'A6530', category: 'compression_stocking', vendor: 'Medi USA', msrp: 4500, status: 'active' },
  { id: 'P002', name: 'Compression Stocking BK 30-40mmHg', hcpcsCode: 'A6531', category: 'compression_stocking', vendor: 'Juzo', msrp: 5500, status: 'active' },
  { id: 'P003', name: 'Compression Stocking Thigh 30-40mmHg', hcpcsCode: 'A6534', category: 'compression_stocking', vendor: 'Medi USA', msrp: 7200, status: 'active' },
  { id: 'P004', name: 'Compression Garment NOS', hcpcsCode: 'A6549', category: 'compression_stocking', vendor: 'Solaris', msrp: 9500, status: 'active' },
  { id: 'P005', name: 'Light Compression Bandage Elastic', hcpcsCode: 'A6448', category: 'compression_bandage', vendor: 'BSN Medical', msrp: 550, status: 'active' },
  { id: 'P006', name: 'Light Compression Bandage Non-Elastic', hcpcsCode: 'A6449', category: 'compression_bandage', vendor: 'BSN Medical', msrp: 1200, status: 'active' },
  { id: 'P007', name: 'Pneumatic Compressor Segmental', hcpcsCode: 'E0652', category: 'pneumatic_device', vendor: 'Tactile Medical', msrp: 145000, status: 'active' },
  { id: 'P008', name: 'Segmental Appliance Full Leg', hcpcsCode: 'E0667', category: 'pneumatic_device', vendor: 'Tactile Medical', msrp: 29500, status: 'active' },
  { id: 'P009', name: 'Breast Prosthesis Silicone', hcpcsCode: 'L8030', category: 'breast_prosthesis', vendor: 'Medi USA', msrp: 31000, status: 'active' },
  { id: 'P010', name: 'Mastectomy Bra', hcpcsCode: 'L8000', category: 'mastectomy_bra', vendor: 'Juzo', msrp: 4800, status: 'active' },
];

// --- Payers (5 insurers + Self-Pay) ---

export const PAYERS: Payer[] = [
  { id: 'PAY001', name: 'Medicare', type: 'medicare', coinsurancePercent: 20 },
  { id: 'PAY002', name: 'Anthem Blue Cross', type: 'commercial', coinsurancePercent: 20 },
  { id: 'PAY003', name: 'Aetna', type: 'commercial', coinsurancePercent: 25 },
  { id: 'PAY004', name: 'UnitedHealthcare', type: 'commercial', coinsurancePercent: 20 },
  { id: 'PAY005', name: 'Cigna', type: 'commercial', coinsurancePercent: 30 },
  { id: 'PAY006', name: 'Self-Pay', type: 'self_pay', coinsurancePercent: 100 },
];

// --- Fee Schedule (10 products x 5 payers = 50 entries) ---
// Medicare baseline. Commercial multipliers: Anthem 1.15x, Aetna 1.10x, UHC 1.12x, Cigna 1.08x

const medicareRates: Record<string, number> = {
  A6530: 3800, A6531: 4800, A6534: 6200, A6549: 7800,
  A6448: 450, A6449: 1000, E0652: 120000, E0667: 24500,
  L8030: 28500, L8000: 4200,
};

const multipliers: Record<string, number> = {
  PAY001: 1.00, PAY002: 1.15, PAY003: 1.10, PAY004: 1.12, PAY005: 1.08,
};

function generateFeeSchedule(): FeeScheduleEntry[] {
  const entries: FeeScheduleEntry[] = [];
  const hcpcsCodes = Object.keys(medicareRates);
  const payerIds = Object.keys(multipliers);
  let counter = 1;

  for (const payerId of payerIds) {
    for (const hcpcs of hcpcsCodes) {
      entries.push({
        id: `FS${String(counter).padStart(3, '0')}`,
        payerId,
        hcpcsCode: hcpcs,
        allowedAmount: Math.round(medicareRates[hcpcs] * multipliers[payerId]),
        effectiveDate: '2026-01-01',
      });
      counter++;
    }
  }

  return entries;
}

export const FEE_SCHEDULE: FeeScheduleEntry[] = generateFeeSchedule();

// --- Vendors ---

export const VENDORS: Vendor[] = [
  { id: 'V001', name: 'Medi USA', website: 'mediusa.com' },
  { id: 'V002', name: 'Juzo', website: 'juzo.com' },
  { id: 'V003', name: 'BSN Medical/Essity', website: 'essity.com' },
  { id: 'V004', name: 'Solaris', website: 'sfrmedical.com' },
  { id: 'V005', name: 'Tactile Medical', website: 'tactilemedical.com' },
];

// --- Sample Orders (3 for dashboard) ---

export const SAMPLE_ORDERS: Order[] = [
  {
    id: 'ORD-2026-0147',
    patientId: 'PT001',
    patient: {
      id: 'PT001',
      firstName: 'Maria',
      lastName: 'Rodriguez',
      dob: '1968-03-15',
      phone: '(555) 234-5678',
      address: '1234 Oak Ave, Sacramento, CA 95814',
      diagnosisCode: 'I97.2',
      diagnosisDescription: 'Postmastectomy lymphedema syndrome',
    },
    referringProvider: { name: 'Dr. Sarah Chen', npi: '1234567890', clinic: 'Pacific Lymphedema Clinic' },
    payerId: 'PAY002',
    payerName: 'Anthem Blue Cross',
    status: 'submitted',
    lineItems: [
      {
        id: 'LI001',
        productId: 'P002',
        hcpcsCode: 'A6531',
        productName: 'Compression Stocking BK 30-40mmHg',
        vendor: 'Juzo',
        quantity: 2,
        modifier: 'KX',
        allowedAmount: 5520,
        totalAmount: 11040,
        pricingConfidence: 'exact',
      },
      {
        id: 'LI002',
        productId: 'P008',
        hcpcsCode: 'E0667',
        productName: 'Segmental Appliance Full Leg',
        vendor: 'Tactile Medical',
        quantity: 1,
        modifier: 'NU',
        allowedAmount: 28175,
        totalAmount: 28175,
        pricingConfidence: 'exact',
      },
    ],
    totalAllowedAmount: 39215,
    insurancePays: 31372,
    patientResponsibility: 7843,
    createdAt: '2026-03-05T10:30:00Z',
    updatedAt: '2026-03-05T14:15:00Z',
    notes: 'Patient prefers delivery to clinic for fitting appointment.',
  },
  {
    id: 'ORD-2026-0148',
    patientId: 'PT002',
    patient: {
      id: 'PT002',
      firstName: 'James',
      lastName: 'Wilson',
      dob: '1955-11-22',
      phone: '(555) 876-5432',
      address: '567 Pine St, Fresno, CA 93710',
      diagnosisCode: 'I89.0',
      diagnosisDescription: 'Lymphedema, not elsewhere classified',
    },
    referringProvider: { name: 'Dr. Michael Park', npi: '9876543210', clinic: 'Valley Physical Therapy' },
    payerId: 'PAY001',
    payerName: 'Medicare',
    status: 'approved',
    lineItems: [
      {
        id: 'LI003',
        productId: 'P007',
        hcpcsCode: 'E0652',
        productName: 'Pneumatic Compressor Segmental',
        vendor: 'Tactile Medical',
        quantity: 1,
        modifier: 'NU',
        allowedAmount: 120000,
        totalAmount: 120000,
        pricingConfidence: 'exact',
      },
      {
        id: 'LI004',
        productId: 'P001',
        hcpcsCode: 'A6530',
        productName: 'Compression Stocking BK 18-30mmHg',
        vendor: 'Medi USA',
        quantity: 2,
        modifier: 'RT',
        allowedAmount: 3800,
        totalAmount: 7600,
        pricingConfidence: 'exact',
      },
    ],
    totalAllowedAmount: 127600,
    insurancePays: 102080,
    patientResponsibility: 25520,
    createdAt: '2026-03-06T09:00:00Z',
    updatedAt: '2026-03-07T11:30:00Z',
    notes: '',
  },
  {
    id: 'ORD-2026-0149',
    patientId: 'PT003',
    patient: {
      id: 'PT003',
      firstName: 'Susan',
      lastName: 'Thompson',
      dob: '1972-07-08',
      phone: '(555) 345-6789',
      address: '890 Elm Dr, San Jose, CA 95112',
      diagnosisCode: 'C50.9',
      diagnosisDescription: 'Malignant neoplasm of breast, unspecified',
    },
    referringProvider: { name: 'Dr. Lisa Adams', npi: '5551234567', clinic: "Women's Health Center" },
    payerId: 'PAY006',
    payerName: 'Self-Pay',
    status: 'draft',
    lineItems: [
      {
        id: 'LI005',
        productId: 'P009',
        hcpcsCode: 'L8030',
        productName: 'Breast Prosthesis Silicone',
        vendor: 'Medi USA',
        quantity: 1,
        modifier: null,
        allowedAmount: 31000,
        totalAmount: 31000,
        pricingConfidence: 'fallback',
      },
      {
        id: 'LI006',
        productId: 'P010',
        hcpcsCode: 'L8000',
        productName: 'Mastectomy Bra',
        vendor: 'Juzo',
        quantity: 1,
        modifier: null,
        allowedAmount: 4800,
        totalAmount: 4800,
        pricingConfidence: 'fallback',
      },
    ],
    totalAllowedAmount: 35800,
    insurancePays: 0,
    patientResponsibility: 35800,
    createdAt: '2026-03-08T16:45:00Z',
    updatedAt: '2026-03-08T16:45:00Z',
    notes: 'Patient requested sizing consultation before order.',
  },
];
