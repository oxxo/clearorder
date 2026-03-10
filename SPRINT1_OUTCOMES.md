# Sprint 1 Outcomes & Sprint 2 Proposal

*This document would be shared with Alex after Sprint 1 delivery.*

---

## Why These Features First

Alex's brief includes 8+ feature requests. Here's how I prioritized Sprint 1:

| Feature from Brief | Revenue Impact | Sprint 1 Feasible? | Decision |
|-------------------|---------------|-------------------|----------|
| Cascade pricing (auto-populate from fee schedules) | Critical — eliminates $13K/mo in errors | Yes — deterministic, no backend needed | **Sprint 1** |
| AI referral parsing (Smart Paste) | High — saves ~9 min/order | Yes — API call, no persistence needed | **Sprint 1** |
| Claim risk scanning | High — prevents denials before submission | Yes — API call with local fallback | **Sprint 1** |
| Document generation (Encounter Form, Invoice, POD) | High — required for Medicare | No — needs stable data model + templates | Sprint 2 |
| Approval flow for HCPCS codes | Medium — currently SharePoint | No — needs auth + role definitions | Sprint 3 |
| Vendor email routing | Medium — operational efficiency | No — needs email integration | Sprint 3 |
| Measurement form upload | Low — per-line-item attachment | No — needs file storage backend | Sprint 3 |
| Prior authorization tracking | Medium — compliance | No — needs payer API integration | Sprint 4 |

**Principle:** Sprint 1 prioritizes features that (a) protect revenue and (b) don't require a backend. This lets us validate the data model and workflows before investing in infrastructure.

---

## Sprint 1: What We Built and Why

### Delivered

| Feature | What It Does | Why Sprint 1 |
|---------|-------------|--------------|
| **Cascade Pricing** | Payer change recalculates all line items instantly | #1 source of billing errors in Excel — eliminates manual lookups |
| **Smart Paste (AI)** | Paste a referral → AI extracts 11 fields with confidence scoring | Reduces order creation from ~12 min to <3 min |
| **Claim Risk Scanner (AI)** | Flags line items likely to be denied before submission | Revenue protection — catch problems before they cost money |
| **Revenue Intelligence (AI)** | Dashboard insights on order patterns and risk exposure | Replaces "gut feel" with data-driven visibility |
| **Order Lifecycle Stepper** | Draft → Submitted → Verified → Approved → Shipped → Complete | Structured workflow replaces informal status tracking |

### Not Delivered (Intentionally)

| Feature | Why Deferred | When |
|---------|-------------|------|
| Backend / database | Iterate on data model without migration debt | Sprint 2 |
| Authentication / roles | Needs role definition from Alex | Sprint 3 |
| Document generation | Needs stable data model + templates | Sprint 2 |
| Edit existing orders | Sprint 1 validates creation flow first | Sprint 2 |
| Mobile responsive | Internal desktop tool — not consumer-facing | Backlog |

---

## Success Metrics (Sprint 1 Targets)

| Metric | Target | Excel Baseline | Improvement |
|--------|--------|----------------|-------------|
| Time to create order | < 3 minutes | ~12 minutes | 75% reduction |
| Pricing accuracy | 100% (fee schedule lookup) | ~60% (manual lookups) | +40 percentage points |
| Risk visibility | 100% of items scanned | 0% (no risk checking) | From zero to full coverage |

---

## Assumptions We're Testing

Sprint 1 features are treated as experiments, not requirements:

| # | Assumption | How We'd Validate | Kill Criteria |
|---|-----------|-------------------|---------------|
| 1 | Cascade pricing is the core value prop | Track pricing error rate pre/post | If errors don't decrease, the fee schedule data is wrong |
| 2 | Pasting referrals is faster than typing | Measure Smart Paste adoption rate | < 30% of orders use Smart Paste after 30 days |
| 3 | Confidence scoring builds user trust | User sessions — do they review amber/red fields? | If users ignore confidence indicators, simplify UI |
| 4 | Risk flags prevent denials, not slow workflows | Track flag dismissal rate + actual denial rate | If flags are noisy (>50% false positive), retune AI model |

---

## Open Questions for Alex

1. **What percentage of orders come from faxed referrals vs. phone calls vs. physician portals?**
   → Determines whether Smart Paste is the right AI investment or if we should prioritize voice-to-order.

2. **How many payers do you actively bill? Are there payer-specific rules beyond fee schedule rates?**
   → Example: "Anthem requires modifier KX on all pneumatic devices." These rules feed the Claim Risk Scanner.

3. **What's the current denial rate, and which denial codes are most common?**
   → This data would let us build a denial predictor grounded in your actual experience, not generic rules.

4. **Who reviews orders before submission — you alone, or a team?**
   → Shapes Sprint 3's approval workflow: role-based routing vs. simple review queue.

5. **Do you want to migrate existing orders from Excel, or start fresh?**
   → Determines Sprint 2 scope: CSV import feature vs. clean cutover.

---

## Sprint 2 Recommendation

| Priority | Feature | Rationale | Effort |
|----------|---------|-----------|--------|
| P0 | Supabase backend + auth | Can't run on localStorage in production | 3 days |
| P0 | Encounter Form PDF | Required for 100% of Medicare claims — highest business impact | 2 days |
| P1 | Patient search (returning patients) | 60%+ of orders are for existing patients | 1.5 days |
| P1 | Edit Order flow | Sprint 1 is intentionally read-only after creation | 1 day |
| P2 | Usage analytics (PostHog) | Measure Sprint 1 assumptions — Smart Paste adoption, risk flag accuracy | 0.5 days |
| P2 | CSV/Excel import | Critical for migrating order history from spreadsheets | 1 day |

**Sprint 2 timeline**: 2 weeks, 1 engineer. The P0s and P1s fit within the sprint. P2s are stretch goals.

---

## Risks and Trade-offs

| Risk | Mitigation |
|------|-----------|
| No backend = no production use | Sprint 2 P0. Data model is validated and ready for migration. |
| AI features depend on API key | Every AI feature has hardcoded fallbacks. Works offline. |
| Fee schedule is static | Sprint 2 should include fee schedule upload/edit so the team maintains rates independently. |
| Single-user prototype | Sprint 3 adds auth + roles. Sprint 1 validates the workflow before adding complexity. |

---

*ClearOrder Sprint 1 · Deployed on Vercel · Next steps: Alex review + Sprint 2 kickoff*
