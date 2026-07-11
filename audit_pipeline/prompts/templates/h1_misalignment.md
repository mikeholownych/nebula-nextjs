## H1-Title Alignment — Naming Consistency

**Finding:** Your H1 and title tag don't share enough keywords — visitors and search engines get mixed signals.

**Current state:**
- Title tag: "${title_tag}"
- H1 tag: "${h1_text}"
- Shared significant words: ${shared_words}
- Page URL: ${url}

**The fix criteria:**
- H1 and title should share 2+ significant keywords
- Both should signal the same topic to search engines and visitors
- H1 can be slightly more descriptive; title should be shorter

### Prompt

Copy and paste this into Claude, ChatGPT, or Gemini:

```
I need to align my page title and H1 tag for SEO consistency.

**Page URL:** ${url}
**Current title:** "${title_tag}"
**Current H1:** "${h1_text}"
**Primary keyword:** ${primary_keyword}
**Secondary keywords:** ${secondary_keywords}

**The problem:** These two don't share enough meaningful keywords,
which confuses both search engines and visitors about what this
page is actually about.

Give me 3 options for aligning the title and H1:

Option A — Keep title similar, rework H1
Option B — Keep H1 similar, rework title  
Option C — Rework both for optimal keyword alignment

Each option: title (30-60 chars), H1 (20-70 chars), shared keywords,
and a one-sentence rationale.
```

**Expected output:** 3 alignment options. Pick the one that best matches your brand voice and implement in 5 minutes.
