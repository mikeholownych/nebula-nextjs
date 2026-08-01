# Delivery Workflow

From Stripe payment to fix brief in the customer's inbox.

---

## Step 1: Payment Confirmation

Stripe webhook fires on `checkout.session.completed`.
Grab from payload: `customer_email`, `metadata.audit_id`, `metadata.url`.

If no audit_id in metadata → look up most recent completed audit for that email.

---

## Step 2: Select the Finding

```sql
SELECT key, label, impact, effort, issue, fix, evidence, quadrant
FROM findings
WHERE audit_id = '[audit_id]'
  AND impact >= 4.0
  AND quadrant = 'quick_win'
ORDER BY impact DESC
LIMIT 1;
```

If no `quick_win` findings at impact ≥4.0, fall back to highest impact finding overall.

---

## Step 3: Generate Fix Brief

Use template from `your-audit/fix-brief.md`.

Fill in:
- `FINDING:` from finding.label + finding.impact
- `WHAT IS BROKEN:` from finding.issue
- `WHY IT MATTERS:` connect to their ad spend context
- `EXACT FIX:` from finding.fix (expand with specific steps)
- `VERIFICATION TEST:` specific selector or tool check
- `ESTIMATED EFFORT:` based on finding.effort score (1-2 = minutes, 3-5 = hours)

---

## Step 4: Capture Before Screenshot

```bash
# Using Playwright (already installed in nebula venv)
python3 -c "
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={'width': 1280, 'height': 800})
    page.goto('[url]')
    page.screenshot(path='screenshots/[audit_id]/before.png', full_page=True)
    browser.close()
"
```

---

## Step 5: Send Email

Via AgentMail (nebulashop@agentmail.to):

**Subject:** Your One-Leak Repair Sprint — [Domain]

**Body structure:**
1. Confirm which finding you're fixing (one sentence)
2. Paste the complete fix brief
3. Include the before screenshot
4. State the 30-day re-audit date (today + 30)
5. Instructions: reply with "done" when implemented

---

## Step 6: Set Re-audit Reminder

```sql
INSERT INTO interventions (
  audit_id, finding_key, status, reaudit_date, notes
) VALUES (
  '[audit_id]', '[finding_key]', 'delivered',
  NOW() + INTERVAL '30 days', 'Sprint delivered. Awaiting implementation.'
);
```

---

## Step 7: 30-Day Re-audit

Re-run the same finding selectors.
Compare measured values.
Document the delta in `offer/proof.md`.

If score improved ≥5 points → case study eligible.
If no improvement → diagnose why (not implemented? wrong fix? different root cause?).
