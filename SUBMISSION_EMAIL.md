# Submission Email

## Cover Note to Camila

**To:** camila@turbotime.io
**Subject:** PM Challenge Submission — Iñaki Cormenzana

---

Hi Camila,

Here's my submission for the PM challenge. Three things I'd highlight:

1. **Cascade Pricing is deliberately NOT AI.** Dollar amounts in healthcare billing should never be a prediction. This was the most important product decision in Sprint 1.

2. **Every AI feature has kill criteria.** Smart Paste, Claim Risk, and Revenue Intelligence are treated as hypotheses with adoption thresholds — not permanent features.

3. **The prototype works offline.** Every AI feature has hardcoded fallbacks, so you can test without an API key.

Below the deliverables, I've included a kickoff-style recap addressed to Alex — written the way I'd actually communicate Sprint 1 results to a client.

- **Video walkthrough (10 min):** [YOUTUBE_LINK]
- **Live prototype:** https://clearorder.vercel.app
- **Source code + docs:** [GITHUB_REPO_LINK]

Best,
Iñaki Cormenzana

---

## Kickoff Recap — For Alex

**To:** Alex
**Subject:** ClearOrder Sprint 1 — Here's what we built and what I need from you

---

Alex,

You described a system where one wrong cell in a spreadsheet can break an entire order. That's not a technology problem — it's a structural one. So instead of building "Excel but in a browser," I started with the question: *what would make pricing errors structurally impossible?*

### What Sprint 1 Solves

**Cascade Pricing** — When you select a payer, every line item reprices automatically from the fee schedule. No manual lookups, no copy-paste between hidden tabs, no stale rates. Change the payer, and the entire order recalculates with delta indicators showing exactly what changed and why. This is deterministic, not AI — because dollar amounts in healthcare billing should never be a prediction.

**Smart Paste** — Your team receives referrals as faxes, emails, and portal messages. Instead of reading a referral and typing 11 fields one by one, they paste the text and AI extracts everything with confidence scoring. Green = extracted clearly. Amber = review this. Red = couldn't find it. The user always has the final say.

**Claim Risk Scanner** — Before submission, each line item is flagged if it's likely to be denied: missing prior auth, unsupported diagnosis codes, quantity issues. Catching a $4,200 pneumatic device denial before it happens is cheaper than appealing it after.

### What It Doesn't Solve (Yet)

- No backend — everything runs in the browser. Production needs a real database (Sprint 2).
- No document generation — the Encounter Form and Patient Invoice need a stable data model first.
- No auth or roles — I need to understand your team structure before designing the approval flow.

### 5 Questions I Need Answered Before Sprint 2

1. What percentage of orders come from faxed referrals vs. phone calls vs. physician portals?
2. How many payers do you actively bill? Any payer-specific rules beyond fee schedule rates?
3. What's your current denial rate, and which denial codes are most common?
4. Who reviews orders before submission — you alone, or does a team route approvals?
5. Do you want to migrate existing orders from Excel, or start fresh?

These answers shape Sprint 2's priorities. If most orders are faxed referrals, Smart Paste is the right investment. If phone calls dominate, we should build voice-to-order instead.

The prototype is live at **clearorder.vercel.app** — I'd love to walk you through it.

Iñaki
