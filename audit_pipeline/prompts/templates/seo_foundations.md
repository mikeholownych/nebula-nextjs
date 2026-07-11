## SEO Foundations — Title, Meta, H1

**Finding:** Basic SEO elements are missing or misconfigured.

**Current state:**
${seo_issues_text}

**Details:**
- Title tag: ${title_tag}
- Meta description: ${meta_description}
- H1 text: ${h1_text}
- H1 count: ${h1_count}
- Page URL: ${url}

**The fix criteria:**
- Title: 30-60 characters, includes primary keyword + brand
- Meta description: 120-160 characters, includes CTA value prop
- Exactly one H1 that shares keywords with the title

### Prompt

Copy and paste this into Claude, ChatGPT, or Gemini:

```
I need to fix my landing page's SEO metadata.

**Page URL:** ${url}
**Current title:** "${title_tag}"
**Current meta description:** "${meta_description}"
**Current H1:** "${h1_text}"
**Primary keyword/phrase:** ${primary_keyword}
**Target audience:** ${audience}

**Issues to fix:**
${seo_issues_text}

Write optimized replacements for:
1. **Title tag** (30-60 chars) — includes primary keyword + brand name
2. **Meta description** (120-160 chars) — includes primary keyword, value prop, and CTA
3. **H1 tag** (one, matches title intent, includes primary keyword)

For each: show the old version, the new version, and the exact
character count. Explain briefly why the new version is better.
```

**Expected output:** Three optimized metadata elements with character counts. Copy-paste into your CMS title/meta/H1 fields.
