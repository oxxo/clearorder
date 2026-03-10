# ClearOrder — Video Script (10 minutes)

## Setup
- OBS: 1920x1080, webcam bottom-right
- Browser: Chrome incognito, clearorder.vercel.app, zoom 100%
- Tabs ready: Dashboard, /orders/new, FigJam (lifecycle diagram), Asana board
- Network tab open (hidden) to show AI calls are real

---

## 0:00–0:20 — Hook (webcam full)

> "Alex manages a medical supply company where one wrong cell in a spreadsheet can break an entire order. Pricing lookups live in hidden Excel tabs, referrals arrive as faxes that someone types field by field, and nobody knows a claim will be denied until the insurance company says no. The result? Around $13,000 a month in revenue at risk from preventable errors.
>
> So instead of building 'Excel but on the web,' I asked: what would make these errors structurally impossible?"

---

## 0:20–1:30 — Discovery Questions (webcam full, maybe slide)

> "Before I wrote a line of code, I identified five questions I'd need Alex to answer. These aren't hypothetical — they directly shape what to build first."

Walk through the 5 questions briefly:

1. **Referral channel mix** — "If 80% are faxes, Smart Paste is the right AI investment. If it's phone calls, we build voice-to-order instead."
2. **Payer count and rules** — "Shapes the fee schedule architecture and claim risk rules."
3. **Denial rate and codes** — "This is the training data for Sprint 3's denial predictor."
4. **Review workflow** — "One person or a team? Determines Sprint 3's approval routing."
5. **Migration strategy** — "Import existing orders or clean cutover? Sprint 2 scope depends on this."

> "I couldn't ask Alex directly, so I made assumptions — but I documented each one with kill criteria. If an assumption is wrong, we kill the feature and redirect engineering time."

---

## 1:30–3:00 — Phasing + Roadmap

Flash FigJam lifecycle diagram (2-3 seconds) or show the README roadmap.

> "I phased the full vision into four sprints. Here's the logic."

**Show the AI Compound Interest roadmap:**

> "Sprint 1: ASSIST — AI helps enter data and flags risks.
> Sprint 2: LEARN — We track corrections to improve accuracy.
> Sprint 3: PREDICT — A denial predictor trained on actual outcomes.
> Sprint 4: AUTOMATE — Auto-route orders based on payer rules and risk scores.
>
> Each sprint's data feeds the next. Sprint 1 isn't just a prototype — it's the training data collection engine for Sprint 3."

**Sprint 1 scope — IN and OUT:**

> "What's IN Sprint 1: Cascade pricing, Smart Paste, Claim Risk Scanner, Revenue Intelligence dashboard, and a six-step order lifecycle.
>
> What's deliberately OUT: No backend — we iterate on the data model without migration debt. No document generation — needs a stable schema first. No auth — I need to understand the team structure before designing roles.
>
> These aren't compromises. They're sequencing decisions."

---

## 3:00–3:30 — The Key Insight

> "Here's the decision I'm most proud of: Cascade Pricing is NOT AI. It's a deterministic fee schedule lookup.
>
> Why? Because dollar amounts in healthcare billing should never be a prediction. AI hallucinating a price could cost Alex real money. The fee schedule is a database join — 100% accurate, zero API cost, zero latency.
>
> AI is powerful. But knowing where NOT to use it is the product decision."

---

## 3:30–6:30 — Prototype Walkthrough (screen share)

### Dashboard (30s)
- Point out the 4 stat cards: Orders This Month, Pending Review, Monthly Revenue, Revenue at Risk
- Show Pipeline bar — "This is the lifecycle at a glance"
- **Revenue Intelligence** — "This is AI-generated. Watch it stream in real-time." (let it load, point out the bullet points)
- "These insights surface patterns across orders — payer concentration risk, pending revenue, prior auth requirements."

### New Order → Smart Paste (90s)
- Click "New Order" in sidebar
- "First, notice the Smart Paste banner at the top — this is the AI star feature."
- Click Smart Paste → click "Load sample referral" → show the text
- Click "Parse with AI" → **wait for result** (show confidence colors loading)
- "Every field has a confidence indicator. Green means high confidence. Amber means review it. The user always has final say."
- Click "Apply to Form" → show fields populated with confidence borders
- "11 fields extracted in under 2 seconds. Without this, someone types each field from a fax."

### Cascade Pricing (60s)
- In the Items section, add a product (compression stocking)
- "Watch what happens when I select a payer — the price comes from the fee schedule. Green badge means exact match."
- Change payer to a different one
- "See the delta indicators? Every item repriced instantly. Toast notification confirms the cascade. This is the core value — pricing errors are now structurally impossible."
- Change to Self-Pay → "Self-pay defaults to MSRP with a yellow fallback badge. This is by design — no fee schedule entry for cash-pay patients."

### Claim Risk (30s)
- Point to the risk badge on a line item
- "The Claim Risk Scanner checks each item against payer rules and diagnosis codes. This one flagged because pneumatic devices often require prior authorization."
- "In Excel, nobody catches this until the claim is denied 60 days later."

### Order Detail + Status Stepper (30s)
- Submit the order (or navigate to an existing one)
- "Six-step lifecycle: Draft → Submitted → Verified → Approved → Shipped → Complete."
- Advance the status once — "Each transition is a real business event. No skipping steps."

### Products + Fee Schedules (15s quick flash)
- "/products — 10 real HCPCS codes, searchable"
- "/fee-schedules — 50 entries filterable by payer"

---

## 6:30–7:15 — AI Compound Interest

> "Let me zoom out. Sprint 1 collects data — every Smart Paste extraction, every claim risk flag, every correction the user makes.
>
> In Sprint 2, we track those corrections to improve extraction accuracy. In Sprint 3, we build a denial predictor trained on Alex's actual denial history — not generic rules. In Sprint 4, orders auto-route based on learned patterns.
>
> This is AI compound interest. The prototype isn't just a tool — it's a data collection engine."

---

## 7:15–8:00 — Async Standup to Alex (webcam full, direct to camera)

> "Alex, quick update. Sprint 1 is deployed. You can open clearorder.vercel.app right now and create an order.
>
> The cascade pricing engine is working — change a payer, every price updates automatically from the fee schedule. No more hidden Excel tabs.
>
> Smart Paste is live with AI extraction. Paste a referral, get 11 fields in under 2 seconds with confidence scoring.
>
> Before Sprint 2 kickoff, I need two things from you: your top 3 payer-specific denial rules, and whether you want to import existing orders from Excel or start fresh.
>
> Talk soon."

---

## 8:00–9:00 — How I Used AI to Build This (60s — webcam + screen)

> "I used AI at every phase — but I made every product decision."

**Part 1 — AI as co-architect (20s):**

> "Claude for product thinking — decomposing the spec, designing the data model, deciding where AI belongs and where it doesn't. Cursor for implementation — writing components, iterating on UI. Vercel AI SDK for the in-app features — `generateObject` for structured extraction, `streamText` for real-time insights."

**Part 2 — Multi-agent expert panel (40s):**

> "Here's something I'm particularly proud of. Before shipping, I ran a panel of AI expert agents against the entire codebase — a QA engineer, a UX designer, a senior developer, and a TPM. Each one independently reviewed the code from their perspective.
>
> The QA agent found that payer matching was too strict — 'Medicare Part B' wasn't matching 'Medicare.' The Dev agent caught a debounce bug where the claim risk API fired on every keystroke. The UX agent flagged accessibility issues with font sizes below WCAG standards. All fixed before ship.
>
> AI didn't just help me build — it helped me QA my own work from four different perspectives simultaneously. That's the compound effect."

---

## 9:00–9:15 — Sprint 2 Proposal (15s)

> "Sprint 2, two weeks, one engineer. Three priorities: Supabase backend, Encounter Form PDF for Medicare claims, and patient search for returning patients. That's 6.5 of 10 days — buffer for what Alex asks for once he starts using it."

---

## 9:15–9:30 — Close (webcam full)

> "ClearOrder Sprint 1 replaces a fragile spreadsheet with automated pricing, AI-assisted data entry, and claim risk visibility. The success metric is simple: if pricing errors drop and order creation time goes from 12 minutes to under 3, Sprint 1 delivered.
>
> All patient data in this prototype is synthetic — no real PHI was used at any point. In production, AI features would require a signed BAA with the LLM provider.
>
> Thank you for the opportunity. I'm excited about where this goes."

---

## Demo Click Sequence (cheat sheet)

1. Dashboard → point at stats → wait for Revenue Intelligence to stream
2. Sidebar → "New Order"
3. Smart Paste banner → click → Load sample → Parse with AI → wait → Apply to Form
4. Scroll to Items → add product → show green badge pricing
5. Change payer → watch cascade + delta indicators + toast
6. Change to Self-Pay → yellow badge
7. Point to Claim Risk badge → hover/click for suggestion
8. Submit Order → redirects to Order Detail → advance status once
9. Quick flash: /products → search "compression" → /fee-schedules
10. Back to webcam for close

## Timing Checkpoints

| Time | Section | If behind... |
|------|---------|-------------|
| 0:20 | End of hook | On track |
| 1:30 | End of discovery | Skip question 4-5 details |
| 3:00 | End of roadmap | Shorten IN/OUT to one sentence each |
| 3:30 | End of key insight | On track |
| 6:30 | End of walkthrough | Skip Products/Fee Schedules flash |
| 7:15 | End of compound interest | Merge with close if tight |
| 8:00 | End of async standup | On track |
| 9:00 | End of AI tools | Cut panel story to 1 sentence if tight |
| 9:15 | End of Sprint 2 | On track |
| 9:30 | Done | |

## Key Phrases to Hit

- "Structurally impossible" (pricing errors)
- "Confidence scoring builds trust in healthcare"
- "AI compound interest — each sprint feeds the next"
- "Dollar amounts should never be a prediction"
- "I made every product decision — AI accelerated the execution"
- "All data is synthetic — no real PHI"
