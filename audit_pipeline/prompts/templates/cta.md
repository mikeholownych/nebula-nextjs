## CTA — Action-Oriented Language

**Finding:** Your call-to-action text is weak or vague.

**Your current CTA(s):**
${cta_list}

**What's wrong:**
${cta_issue}

**The fix criteria:**
- Uses an action verb (Get, Start, Try, Run, Book, Build)
- Includes the outcome or time-to-value
- Creates urgency without being pushy

### Prompt

Copy and paste this into Claude, ChatGPT, or Gemini:

```
I need to rewrite my landing page call-to-action button text.

**Current CTA text:** "${cta_text}"
**Page purpose:** ${page_goal}
**Target audience:** ${audience}
**What happens after they click:** ${post_cta}

The problem: ${cta_issue}

Write 8 CTA variants that:
1. Start with an action verb (Get, Start, Try, Run, Build, Book)
2. Are 2-5 words max
3. Hint at the outcome or time-frame
4. Don't use "Submit" or "Click Here"

Group them: low-commitment (information/curiosity), medium (free value), high (purchase/commitment).
Short variants first, longer ones second.

Example format:
Low: "See Your Score" | "Run My Audit"
Medium: "Get My Free Audit" | "Start the Fix"
High: "Buy the Fix Pack" | "Deploy Now"
```

**Expected output:** 8 CTA variants across 3 commitment levels. Test the medium-commitment versions first.
