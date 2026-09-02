# Paid-Traffic Leak Scorecard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and deploy a seven-question Paid-Traffic Leak Scorecard that gives immediate self-assessment value and routes qualified users into Nebula's existing measured free audit.

**Architecture:** A focused Next.js route owns the client-side scorecard interaction. A small typed data module owns the seven questions, risk answers, and result bands; a separate FAQ module owns the visible answer-first FAQ. The scorecard sends no lead data and creates no second lead store; its CTA links into `/audit?source=paid-traffic-leak-scorecard`, and the existing AuditForm forwards that source as the audit referrer. Consent-aware PostHog events measure start, completion, CTA click, and risk band.

**Tech Stack:** Next.js App Router, React client component, TypeScript, Tailwind CSS, existing `posthog-browser` client, Jest/Testing Library, systemd deployment via `nebula-nextjs`.

## Global Constraints

- Use Nebula glossary terms from `customer-portal/CONTEXT.md`: audit, signal, finding, score, grade, One-Leak Repair Sprint.
- The scorecard result is a self-assessment risk-signal count, never a measured audit score or conversion benchmark.
- Show value before any email gate; do not create a second lead store.
- Use only visible FAQ content in any FAQPage JSON-LD.
- The audit CTA must carry `source=paid-traffic-leak-scorecard`.
- All analytics must remain consent-first through the existing PostHog browser integration.
- Do not add fabricated outcomes, benchmarks, charts, or customer claims.
- Production deployment requires `npm run build`, `sudo systemctl restart nebula-nextjs`, and browser verification.

---

### Task 1: Add the scorecard data contract and scoring tests

**Blocks:** none
**Demoable:** A deterministic pure scorer returns the correct risk band and every question has complete result metadata.

**Files:**
- Create: `customer-portal/app/paid-traffic-leak-scorecard/scorecardData.ts`
- Create: `customer-portal/app/paid-traffic-leak-scorecard/scorecardData.test.ts`

**Interfaces:**
- Produces `ScorecardQuestion`, `ScorecardBand`, `ScorecardResult`, `scoreScorecard(answers: Record<string, boolean>): ScorecardResult`, and `scorecardQuestions` for the UI.
- `ScorecardResult` includes `riskCount`, `band`, and `risks` containing the question, explanation, and next action for every failed answer.

- [ ] **Step 1: Write the failing test**

```ts
import { scoreScorecard, scorecardQuestions } from './scorecardData'

test.each([
  [0, 'low'],
  [1, 'low'],
  [2, 'inspect'],
  [3, 'inspect'],
  [4, 'audit'],
  [7, 'audit'],
])('risk count %i maps to %s', (count, band) => {
  const answers = Object.fromEntries(
    scorecardQuestions.map((question, index) => [question.id, index < count]),
  )
  expect(scoreScorecard(answers).band).toBe(band)
  expect(scoreScorecard(answers).riskCount).toBe(count)
})

test('every question has a risk explanation and next action', () => {
  for (const question of scorecardQuestions) {
    expect(question.riskExplanation.length).toBeGreaterThan(20)
    expect(question.nextAction.length).toBeGreaterThan(20)
  }
})

test('the result contains only failed questions as risks', () => {
  const answers = Object.fromEntries(scorecardQuestions.map((q, i) => [q.id, i === 0]))
  const result = scoreScorecard(answers)
  expect(result.risks).toHaveLength(1)
  expect(result.risks[0].questionId).toBe(scorecardQuestions[0].id)
})
```

- [ ] **Step 2: Run the focused test and verify it fails**

```bash
cd /home/mike/nebula/customer-portal
npm test -- --runInBand app/paid-traffic-leak-scorecard/scorecardData.test.ts
```

Expected: FAIL because the scorecard data module does not exist.

- [ ] **Step 3: Implement the minimal data module**

Define exactly seven questions:

```ts
export type ScorecardBand = 'low' | 'inspect' | 'audit'

export interface ScorecardQuestion {
  id: string
  prompt: string
  yesLabel: string
  noLabel: string
  riskExplanation: string
  nextAction: string
}

export interface ScorecardResult {
  riskCount: number
  band: ScorecardBand
  risks: Array<ScorecardQuestion & { questionId: string }>
}

export const scorecardQuestions: ScorecardQuestion[] = [
  {
    id: 'paid-traffic',
    prompt: 'Is this landing page receiving active paid traffic right now?',
    yesLabel: 'Yes, traffic is active',
    noLabel: 'No or not sure',
    riskExplanation: 'If paid traffic is not active or cannot be confirmed, spend and page performance cannot be evaluated against the same decision context.',
    nextAction: 'Confirm the campaign, landing-page URL, and conversion event before changing the page or increasing budget.',
  },
  {
    id: 'ad-headline-match',
    prompt: 'Does the landing-page headline repeat the promise that made the visitor click the ad?',
    yesLabel: 'Yes, the promise carries through',
    noLabel: 'No or not sure',
    riskExplanation: 'A break between the ad promise and the headline forces the visitor to re-evaluate whether they are in the right place.',
    nextAction: 'Put the ad\'s core promise into the first visible headline and verify the wording on the live page.',
  },
  {
    id: 'above-fold-value',
    prompt: 'Can a new visitor understand the offer and who it is for before scrolling?',
    yesLabel: 'Yes, it is clear above the fold',
    noLabel: 'No or not sure',
    riskExplanation: 'If the offer is delayed or abstract above the fold, paid clicks encounter uncertainty before they reach the action.',
    nextAction: 'State the buyer, problem, and concrete outcome in the first viewport before adding more traffic.',
  },
  {
    id: 'cta-specificity',
    prompt: 'Is there one obvious primary CTA that tells the visitor exactly what happens next?',
    yesLabel: 'Yes, one next step is obvious',
    noLabel: 'No or not sure',
    riskExplanation: 'Competing or vague CTAs create decision friction at the point where the paid visitor should act.',
    nextAction: 'Choose one primary action, name the immediate outcome, and make supporting links visually secondary.',
  },
  {
    id: 'proof',
    prompt: 'Is credible proof visible before the visitor has to make the decision?',
    yesLabel: 'Yes, proof appears before the decision',
    noLabel: 'No or not sure',
    riskExplanation: 'When proof is absent or buried, the visitor must accept the offer without evidence that it works for someone like them.',
    nextAction: 'Place specific testimonials, customer evidence, or verifiable proof beside the offer and CTA.',
  },
  {
    id: 'mobile-path',
    prompt: 'Does the mobile page preserve the same offer, proof, and CTA path without avoidable friction?',
    yesLabel: 'Yes, mobile is usable',
    noLabel: 'No or not sure',
    riskExplanation: 'A desktop-ready page can still lose paid visitors when mobile layout, tap targets, or CTA placement break the path.',
    nextAction: 'Walk the complete conversion path on a real phone and fix the first blocked or ambiguous interaction.',
  },
  {
    id: 'conversion-event',
    prompt: 'Is one conversion event defined and being measured for this page?',
    yesLabel: 'Yes, the event is defined',
    noLabel: 'No or not sure',
    riskExplanation: 'Without a defined event, traffic and page changes cannot be compared against a reliable outcome.',
    nextAction: 'Name the single action that counts, confirm its tracking fires, and use it consistently in campaign decisions.',
  },
]

export function scoreScorecard(answers: Record<string, boolean>): ScorecardResult {
  const risks = scorecardQuestions
    .filter((question) => answers[question.id] === false)
    .map((question) => ({ ...question, questionId: question.id }))
  const riskCount = risks.length
  const band: ScorecardBand = riskCount >= 4 ? 'audit' : riskCount >= 2 ? 'inspect' : 'low'
  return { riskCount, band, risks }
}
```

The question copy must explicitly say that a risk signal is a reason to inspect, not proof that the page alone caused poor performance.

- [ ] **Step 4: Run the focused test and verify it passes**

```bash
npm test -- --runInBand app/paid-traffic-leak-scorecard/scorecardData.test.ts
```

Expected: all scorer and metadata tests pass.

- [ ] **Step 5: Commit**

```bash
git add customer-portal/app/paid-traffic-leak-scorecard/scorecardData.ts customer-portal/app/paid-traffic-leak-scorecard/scorecardData.test.ts
git commit -m "feat: add paid traffic scorecard model"
```

---

### Task 2: Build the interactive scorecard route

**Blocks:** Task 1
**Demoable:** A user can answer all seven questions, see immediate results, restart, and reach the existing audit CTA.

**Files:**
- Create: `customer-portal/app/paid-traffic-leak-scorecard/page.tsx`
- Create: `customer-portal/app/paid-traffic-leak-scorecard/ScorecardClient.tsx`
- Create: `customer-portal/app/paid-traffic-leak-scorecard/ScorecardClient.test.tsx`

**Interfaces:**
- `ScorecardClient` consumes `scorecardQuestions` and `scoreScorecard`.
- The CTA URL is exactly `/audit?source=paid-traffic-leak-scorecard`.

- [ ] **Step 1: Write the failing interaction tests**

Test the rendered client with Testing Library:

```tsx
it('starts with the first question and advances through all seven', async () => {
  render(<ScorecardClient />)
  expect(screen.getByRole('heading', { name: /paid-traffic leak scorecard/i })).toBeInTheDocument()
  for (const question of scorecardQuestions) {
    expect(screen.getByText(question.prompt)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: question.yesLabel }))
  }
  expect(screen.getByRole('heading', { name: /your scorecard result/i })).toBeInTheDocument()
})

it('links results to the measured audit with source attribution', async () => {
  // complete seven answers, then assert the CTA href is exact
  expect(screen.getByRole('link', { name: /run the free evidence-backed audit/i }))
    .toHaveAttribute('href', '/audit?source=paid-traffic-leak-scorecard')
})

it('states that the scorecard is not a measured audit', () => {
  render(<ScorecardClient />)
  expect(screen.getByText(/self-assessment, not a measured audit/i)).toBeInTheDocument()
})
```

- [ ] **Step 2: Run the focused interaction test and verify it fails**

```bash
npm test -- --runInBand app/paid-traffic-leak-scorecard/ScorecardClient.test.tsx
```

Expected: FAIL because the route and client do not exist.

- [ ] **Step 3: Implement the client flow**

Use a client component with:

- `stepIndex` state;
- `answers: Record<string, boolean>` state;
- `complete` state derived after the seventh answer;
- one visible question at a time;
- progress text such as `Question 3 of 7`;
- yes/no buttons labelled from the data module;
- back button after question 1;
- restart button on results;
- risk count and band copy from `scoreScorecard`;
- failed-question cards showing the exact next action;
- primary audit link and secondary explanation that the audit observes the actual URL.

Use the existing dark Nebula tokens: `bg-bg`, `bg-bg-muted`, `border-border`, `text-fg`, `text-fg-muted`, `text-accent`, and `text-signal-fail` only where a risk state is being shown.

Before rendering a risk count, include this boundary copy:

```text
This is a self-assessment, not a measured audit. A risk signal tells you what to inspect; it does not prove the page is the only cause of weak conversion.
```

- [ ] **Step 4: Add route metadata and visible page shell**

`page.tsx` should export metadata:

```ts
export const metadata: Metadata = {
  title: 'Paid-Traffic Leak Scorecard | Nebula Components',
  description: 'Answer seven focused questions before you buy more paid traffic. Find which landing-page conversion conditions need inspection, then run Nebula\'s free evidence-backed audit.',
  alternates: { canonical: 'https://nebulacomponents.com/paid-traffic-leak-scorecard' },
}
```

The page shell should contain:

- breadcrumb or small `Nebula / Scorecard` context;
- heading `Paid-Traffic Leak Scorecard`;
- subheading `Before you raise ad spend, find out whether the page is leaking the clicks.`;
- the client component;
- a short explicit boundary section;
- the FAQ section from Task 3.

- [ ] **Step 5: Run focused tests and typecheck**

```bash
npm test -- --runInBand app/paid-traffic-leak-scorecard/scorecardData.test.ts app/paid-traffic-leak-scorecard/ScorecardClient.test.tsx
npm run typecheck
```

Expected: all focused tests pass and TypeScript exits 0.

- [ ] **Step 6: Commit**

```bash
git add customer-portal/app/paid-traffic-leak-scorecard
 git commit -m "feat: build paid traffic leak scorecard"
```

---

### Task 3: Add answer-first FAQ and consent-aware analytics

**Blocks:** Task 2
**Demoable:** The visible FAQ and schema match exactly, and scorecard events use the existing consent-aware PostHog client.

**Files:**
- Modify: `customer-portal/app/paid-traffic-leak-scorecard/page.tsx`
- Modify: `customer-portal/app/lib/posthog-browser.ts` only if an existing typed wrapper is required; do not create a new analytics client.
- Modify: `customer-portal/app/audit/AuditForm.tsx` to accept `source` as a supported query parameter and forward it as `referrer` in the existing audit-start payload.
- Create or modify: `customer-portal/app/paid-traffic-leak-scorecard/scorecardFaq.ts`
- Create: `customer-portal/app/paid-traffic-leak-scorecard/scorecardFaq.test.ts`

**Interfaces:**
- FAQ source exports `scorecardFaqItems` with `question` and `answer` strings.
- Client calls `posthog.capture('scorecard_started')`, `posthog.capture('scorecard_completed', { risk_band })`, and `posthog.capture('scorecard_audit_cta_clicked', { risk_band })`.
- `AuditForm` reads `searchParams.get('source')` in addition to the existing `from` parameter, and uses the resulting value in its existing `referrer` field.

- [ ] **Step 1: Add failing FAQ/source tests**

```ts
import { scorecardFaqItems } from './scorecardFaq'

test('FAQ has four bounded answer-first entries', () => {
  expect(scorecardFaqItems).toHaveLength(4)
  for (const item of scorecardFaqItems) {
    expect(item.answer.split(/[.!?]/, 1)[0].length).toBeGreaterThan(20)
  }
})
```

- [ ] **Step 2: Implement FAQ and JSON-LD from the same source**

Visible questions:

```text
What does the scorecard measure?
Is this the same as a Nebula audit?
Does a high risk count prove the page is the problem?
What happens when I run the free audit?
```

Render the exact strings in the visible FAQ and map them into `FAQPage` JSON-LD. Do not add hidden FAQ answers.

- [ ] **Step 3: Wire consent-aware analytics**

Use the existing `posthog` import already used by `AuditForm`. Emit:

```ts
posthog.capture('scorecard_started')
posthog.capture('scorecard_completed', { risk_band: result.band })
posthog.capture('scorecard_audit_cta_clicked', { risk_band: result.band })
```

Do not send answers, URLs, email addresses, or raw free text.

- [ ] **Step 4: Preserve source attribution in the audit form**

Extend the existing `useEffect` in `AuditForm.tsx`:

```ts
const source = searchParams.get('source')
const from = searchParams.get('from')
const attribution = source || (from ? decodeURIComponent(from) : null)
if (attribution) setReferrer(attribution)
```

Keep existing `from` behavior and submit `referrer: referrer || undefined` unchanged.

- [ ] **Step 5: Run focused tests and lint**

```bash
npm test -- --runInBand app/paid-traffic-leak-scorecard/scorecardFaq.test.ts app/paid-traffic-leak-scorecard/scorecardData.test.ts app/paid-traffic-leak-scorecard/ScorecardClient.test.tsx
npm run lint -- --file app/paid-traffic-leak-scorecard/page.tsx --file app/paid-traffic-leak-scorecard/ScorecardClient.tsx --file app/audit/AuditForm.tsx
```

Expected: tests pass; lint reports no new errors.

- [ ] **Step 6: Commit**

```bash
git add customer-portal/app/paid-traffic-leak-scorecard customer-portal/app/audit/AuditForm.tsx
git commit -m "feat: instrument scorecard and preserve audit attribution"
```

---

### Task 4: Build, deploy, and browser-verify the vertical slice

**Blocks:** Task 3
**Demoable:** The live public route completes, displays bounded results, and opens the audit flow with attribution.

**Files:**
- No new source files; verify the files from Tasks 1–3.

- [ ] **Step 1: Run content and diff checks**

```bash
cd /home/mike/nebula/customer-portal
git diff --check
grep -nP '[\x{2580}-\x{259F}\x{FFFD}\x{25A0}-\x{25FF}]' app/paid-traffic-leak-scorecard/*.tsx app/paid-traffic-leak-scorecard/*.ts || true
grep -nP '[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]' app/paid-traffic-leak-scorecard/*.tsx app/paid-traffic-leak-scorecard/*.ts || true
grep -n 'text-warning\|bg-warning\|border-warning' app/paid-traffic-leak-scorecard/*.tsx || true
```

Expected: no diff errors and no forbidden output.

- [ ] **Step 2: Run production checks**

```bash
npm run typecheck
npm test -- --runInBand app/paid-traffic-leak-scorecard/scorecardData.test.ts app/paid-traffic-leak-scorecard/scorecardFaq.test.ts app/paid-traffic-leak-scorecard/ScorecardClient.test.tsx
npm run build
```

Expected: all commands exit 0.

- [ ] **Step 3: Deploy the built Customer Portal**

```bash
sudo systemctl restart nebula-nextjs
systemctl is-active nebula-nextjs
```

Expected: `active`.

- [ ] **Step 4: Verify public HTML and browser behavior**

```bash
curl -sS -o /tmp/scorecard.html -w 'status=%{http_code} bytes=%{size_download}\n' https://nebulacomponents.com/paid-traffic-leak-scorecard
```

Then use the browser on the live route to verify:

- heading and first question render;
- all seven questions can be answered;
- results show risk band and boundary copy;
- restart works;
- CTA href is `/audit?source=paid-traffic-leak-scorecard`;
- the audit page displays the attribution/referrer context;
- visible FAQ and `FAQPage` schema are present.

- [ ] **Step 5: Record the final verification**

Capture exact outputs for build, tests, service status, HTTP status, and browser interaction before reporting completion.

- [ ] **Step 6: Commit any final test-only correction**

```bash
git status --short
```

If implementation is clean, do not create a meaningless extra commit. Report the existing scoped commits and live verification artifacts.
