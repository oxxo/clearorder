# ClearOrder — Decision Brief

**The real problem**: Alex loses ~$13,000/month from preventable pricing errors in a fragile Excel spreadsheet. One wrong cell breaks an entire order. The solution isn't "Excel on the web" — it's making pricing errors structurally impossible.

---

## 3 Decisions That Define Sprint 1

### 1. Cascade Pricing is NOT AI

Dollar amounts in healthcare billing should never be a prediction. AI hallucinating a price could cost Alex real money. Cascade pricing is a deterministic fee schedule lookup — payer x HCPCS code = exact allowed amount. 100% accurate, zero API cost, zero latency.

**Trade-off**: No "intelligent pricing suggestions." But accuracy > intelligence when you're billing insurance.

### 2. Every AI Feature Has Kill Criteria

Smart Paste, Claim Risk Scanner, and Revenue Intelligence are hypotheses — not permanent features. Each has a measurable threshold:

| Feature | Kill if... |
|---------|-----------|
| Smart Paste | < 30% of orders use it after 30 days |
| Claim Risk | < 50% correlation with actual denials after 90 days |
| Revenue Intelligence | < 10% engagement (scroll/click) |

If the data says kill it, we kill it and redirect engineering time. Features should earn their place.

### 3. No Backend in Sprint 1

Intentional, not a shortcut. The data model (products, payers, fee schedules, orders) needs validation before we commit to a schema. Sprint 1 runs on hardcoded seed data + localStorage. Sprint 2 migrates to Supabase once the model is proven.

**What this enables**: Fast iteration on the order creation flow without migration debt. What it costs: no multi-user, no persistence across devices.

---

## What I'd Do Differently With More Time

- **User testing with Alex's team** before building — I made assumptions about the referral channel mix (faxes vs. phone vs. portal) that directly shape whether Smart Paste is the right AI investment.
- **Encounter Form PDF in Sprint 1** — it's required for 100% of Medicare claims and would have made the prototype immediately useful in production alongside Excel.
- **Tighter claim risk rules** — the current scanner uses generic denial patterns. Alex's actual top-3 denial codes would make it 10x more relevant.

---

## One Metric That Matters

**Order creation time: 12 minutes (Excel) to under 3 minutes (ClearOrder).**

If that number holds with real users, Sprint 1 delivered.

---

*ClearOrder Sprint 1 | [Live prototype](https://clearorder.vercel.app) | [Full spec](SPEC.md) | [Sprint 1 outcomes](SPRINT1_OUTCOMES.md)*
