# GP Socials — Hormozi Giveaway Landing Page Review

**Source:** https://files.gpsocials.com/hormozi-giveaway  
**Captured:** 2026-07-11 21:24 UTC  
**Stack:** beehiiv newsletter signup page

---

## Page Structure

### Hero Section
- **Headline:** "Access The Word-For-Word Intro System We Found After Watching 100 Alex Hormozi Videos"
- **Subhead:** "Most creators lose 40% of their viewers before the first minute ends. Hormozi doesn't. We watched 100 of his videos back to back to find out exactly why and built you a breakdown you can use in your next video."
- **CTA Button:** "Unlock Access"
- **Form fields:** Email + Business Size dropdown (0-$10k/m, $10k-$30k/m, $30k-$100k/m, $100k/m+)

### Visual Design
- **Background:** Black gradient tech aesthetic (960x540 YouTube banner style)
- **Container:** White card with rounded corners, max-width 800px, centered
- **Typography:** Inter/Barlow system fonts
- **Layout:** Single-column, form stacked below headline

### Footer Section
- **Brand:** GP Socials
- **Tagline:** "Helping B2B Coaches, Consultants, Agencies, and Software Companies Book 10-20 Calls per Month With a YouTube Funnel"
- **Secondary form:** Email subscribe with "Subscribe" button
- **Copyright:** © 2026 YouTube Funnel Files

---

## Psychological Triggers

| Trigger | Implementation |
|---------|---------------|
| **Authority borrowing** | Alex Hormozi name in headline (100 videos watched = deep research signal) |
| **Specific number** | "40% of viewers before the first minute" — creates precision credibility |
| **Effort investment** | "We watched 100 of his videos back to back" — does the work for you |
| **Immediate utility** | "breakdown you can use in your next video" — not theoretical, actionable now |
| **Exclusivity framing** | "Unlock access NOW»" — gate behind email capture |
| **Business size segmentation** | Dropdown qualifies leads AND triggers size-specific automation sequences |

---

## Form Segmentation Strategy

The Business Size dropdown serves dual purpose:

1. **Lead qualification** — filter out non-B2B cohort (they likely don't convert to high-ticket YouTube funnel clients)
2. **Automation branching** — beehiiv automation_ids can trigger different email sequences based on revenue tier:
   - `0-$10k/m` → "Get your first 10 calls" nurture track
   - `$10k-$30k/m` → "Scale to 20 calls consistently" bridge
   - `$30k-$100k/m` → "Systematize your YouTube funnel" (service pitch)
   - `$100k/m+` → Direct sales outreach (high-ticket consulting/agency)

The form includes hidden fields:
- `automation_ids: "3a5a8274-e3fc-40ce-9f9a-a8f284a06d7d"` — triggers beehiiv automation
- `double_opt: "false"` — single opt-in (reduces friction)
- `auto_login_enabled: "false"` — no immediate account creation

---

## Extractable Patterns for Nebula

### 1. **"We Watched 100 X So You Don't Have To" Framework**

Applicable to Nebula:
> "We audited 200 landing pages with $0 conversions to find the exact 5 patterns killing orders — so you can fix yours in 60 seconds."

The pattern:
- [NUMBER] of [TARGET] analyzed
- [SPECIFIC OUTCOME] found
- [VALUE PROP] = use this immediately

### 2. **Business Size Dropdown as Lead Qualifier**

Nebula could add a "Monthly Ad Spend" dropdown on the audit flow:
- `0-$500/mo` → Free Fix Kit focus (DIY)
- `$500-$2k/mo` → $147 Fix Pack upsell
- `$2k-$10k/mo` → AI Ops Retainer pitch
- `$10k+/mo` → Agency partner / white-label discussion

This segments warm traffic BEFORE conversion, enabling targeted email sequences.

### 3. **Footer as Secondary Lead Capture**

The footer form captures newsletter subscribers who scrolled past the hero. For Nebula:
- Add "Get weekly landing page teardowns" form on long pages
- Different automation_id than hero → nurtures non-converters into future $147 buyers

### 4. **Specific Statistic in Subhead**

"40% of viewers before the first minute" — precise, compelling, fear-inducing.

Nebula variant:
> "Most founders lose $8,500 in ad spend before fixing their landing page. You don't have to."

---

## Architecture Notes

- **Platorm:** beehiiv (newsletter CMS)
- **Form action:** `/create` (beehiiv's signup endpoint)
- **Automation trigger:** Hidden field `automation_ids`
- **Single opt-in:** `double_opt: false`
- **No auto-login:** Reduces friction, email-first
- **Mobile responsive:** CSSGrid with mobile padding adjustments

---

## Conversion Hypothesis

**Why this works:**
1. Headline borrows Hormozi authority (instant trust transfer)
2. Subhead creates pain (40% viewer loss) + promises solution
3. Form is minimal (email + 1 dropdown) — 8-second completion
4. Business size = immediate segmentation = relevant nurture
5. "Unlock access" — curiosity + exclusivity trigger

**Potential friction points:**
- No social proof on page (no logos, testimonials, subscriber count)
- No preview of what's inside the PDF/resource
- Background image is generic tech gradient, not video-specific

---

## Recommended Steals for Nebula

| Element | Adaptation |
|---------|-----------|
| "We watched 100 X" framework | "We audited 200 landing pages that burned $10k+ in ads with zero conversions — and found the exact 5 patterns killing orders." |
| Business size dropdown | "Monthly ad spend" dropdown to qualify Fix Pack vs Retainer intent |
| Footer secondary form | "Landing Page Teardowns" weekly email capture on long-form content |
| Specific stat in subhead | "Most founders who burn $10k on ads have the same 3 fixable leaks." |
| beehiiv automation branching | Segment by `ad_spend_tier` → different email tracks per segment |

---

## File References

- **Screenshot:** `MEDIA:/home/mike/.hermes/cache/screenshots/browser_screenshot_a23e70258fe34d69be2588144a5ed00a.png`
- **Background image:** `https://media.beehiiv.com/cdn-cgi/image/format=auto,fit=scale-down,onerror=redirect/uploads/asset/file/5e7056e1-fcc3-41b7-8059-4df9c12bb2e4/Black_Gradient_Minimalistic_Future_Technology_YouTube_Banner__10_.png`

---

## Steals Implemented from GP Socials

| Recommendation | Status | File | Implementation |
|----------------|--------|------|----------------|
| Ad spend dropdown for lead segmentation | ✅ Done | `/home/mike/nebula/audit-lander.html` | Added 4-tier dropdown ($0-500, $500-2k, $2k-10k, $10k+) |
| "We audited 200+ landing pages..." authority signal | ✅ Done | `/home/mike/nebula/index.html` | Amber-highlighted box below "97% don't convert" stat |
| Footer secondary email capture | ✅ Done | `/home/mike/nebula/index.html`, `/home/mike/nebula/primer.html` | "Weekly teardowns" newsletter signup above sticky bar |
| Specific stat in subhead | ✅ Done | `/home/mike/nebula/index.html` | Integrated into "We audited 200" block |

---

## Files Modified

```
/home/mike/nebula/index.html          (+22 lines)
/home/mike/nebula/audit-lander.html   (+9 lines)
/home/mike/nebula/primer.html         (+12 lines)
```
