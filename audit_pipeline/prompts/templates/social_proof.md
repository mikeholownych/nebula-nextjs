## Social Proof — Trust Signals

**Finding:** Your page talks about trust but shows no evidence.

**Trust words found on your page:**
${trust_words_found}

**What's wrong:**
${social_proof_issue}

**The fix criteria:**
- Place concrete proof within 100px of your primary CTA
- Named source (customer name + face) > anonymous quote
- Specific number (reviews, users, rating) > vague "trusted by"

### Prompt

Copy and paste this into Claude, ChatGPT, or Gemini:

```
I need to add social proof to my landing page near the CTA button.

**Page URL:** ${url}
**Primary CTA:** "${cta_text}"
**Current trust claims without evidence:** ${trust_words_found}

**My business:** ${offer}
**I have these real proof assets (fill in what applies):**
- Customer count: ${customer_count}
- Testimonials or reviews: ${has_testimonials}
- Case studies: ${has_case_studies}
- Star rating (Google/G2/Capterra): ${rating}
- Media mentions/press: ${has_press}

Recommend the single most impactful proof element I should add near
my CTA. Write the exact HTML or text I should use. Prioritize:
1. Specific named customer result with a number
2. Star rating with count ("4.8/5 from 142 reviews")
3. Process shot or sample output image

Format: one recommendation, with copy-paste-ready HTML or text,
and exactly where on the page to place it.
```

**Expected output:** One concrete proof element with placement instructions and the exact text/HTML to use. Install in 10 minutes.
