## Goal Contradiction — Page vs. Stated Purpose

**Finding:** What your page needs to do vs. what it actually supports.

**Your stated goal:** ${stated_goal}
**Contradictions found:**
${contradictions_text}

**The fix criteria:**
- If goal is sales: price signal + checkout path must be visible
- If goal is leads: capture form must be above fold
- If goal is bookings: scheduling link or phone must be prominent

### Prompt

Copy and paste this into Claude, ChatGPT, or Gemini:

```
My landing page has a goal contradiction I need to fix.

**Page URL:** ${url}
**What the page SHOULD do:** ${stated_goal}
**The contradiction(s):** ${contradictions_text}

I need specific recommendations to align the page with my stated goal.

If the fix is copy/text changes: write the exact new copy.
If the fix requires adding an element (button, form, link):
describe what to add, where, and the exact HTML if applicable.
If the fix is structural (moving things around): describe the
layout change and provide a before/after diagram in text.

Give me the single highest-impact fix first. I'll do it today.
```

**Expected output:** The one structural or copy change that resolves the goal contradiction with the highest revenue impact. Implementation steps included.
