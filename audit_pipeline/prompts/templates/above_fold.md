## Above-Fold Structure

**Finding:** The first screen visitors see isn't optimized for conversion.

**What's wrong:**
${above_fold_issue}

**Current above-fold content:**
- Headline: ${headline_text}
- CTA present: ${has_cta}
- Price/offer signal: ${has_offer}
- Page goal: ${page_goal}

**The fix criteria:**
- Headline naming the problem/outcome
- Primary CTA button (visible, above fold)
- Value signal (price, free, result, timeframe)
- All three visible without scrolling on mobile

### Prompt

Copy and paste this into Claude, ChatGPT, or Gemini:

```
I need to restructure the first screen (above the fold) of my landing page.

**Page URL:** ${url}
**Current headline:** "${headline_text}"
**Target audience:** ${audience}
**What I want them to do:** ${page_goal}
**What's missing:** ${above_fold_issue}

Write the above-fold section as HTML/CSS. Requirements:
1. Headline that names the visitor's problem or desired outcome
2. Sub-headline (1 sentence, max 20 words) that bridges to the CTA
3. Primary CTA button with action-outcome text
4. One trust signal or value indicator near the CTA
5. No scrolling required to see all of the above on a 375px mobile screen

Use clean HTML with inline styles. Keep total above-fold height under 600px.
Label each section with a comment so I can adapt it to my CMS.
```

**Expected output:** Complete HTML for the above-fold section with headline, sub-headline, CTA, and trust signal — all fitting in one mobile viewport.
