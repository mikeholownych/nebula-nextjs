## AI Citation Readiness — Structured Data

**Finding:** AI search engines (ChatGPT, Gemini, Perplexity) can't reliably identify or cite your brand.

**Current AI signals:**
${ai_findings_text}

**Missing or incomplete:**
- JSON-LD Organization schema: ${has_jsonld}
- OpenGraph tags: ${og_status}/5
- Twitter card: ${has_twitter}
- Canonical URL: ${has_canonical}

**The fix criteria:**
- JSON-LD with Organization + WebSite schema
- All 5 OpenGraph tags present
- Twitter card meta tag
- Canonical URL set

### Prompt

Copy and paste this into Claude, ChatGPT, or Gemini:

```
I need to add structured data to my landing page so AI search
engines can properly identify and cite my brand.

**Business name:** ${brand_name}
**Page URL:** ${url}
**Platform/CMS:** ${platform}
**Logo URL (if you have one):** ${logo_url}
**Social links:** ${social_links}

**Currently missing:**
- JSON-LD: ${has_jsonld_note}
- OpenGraph: ${og_note}
- Twitter card: ${has_twitter_note}
- Canonical URL: ${has_canonical_note}

Generate the complete HTML I need to add to my page's <head>:
1. **JSON-LD structured data** — Organization type with name, URL, logo, sameAs
2. **OpenGraph meta tags** — all 5 (title, description, image, type, url)
3. **Twitter card** — summary_large_image with the same OG content
4. **Canonical link tag**

Wrap in ```html blocks. Put inline comments explaining each section.
At the end: tell me exactly where in the <head> to paste this and
how to verify it's working (Google Rich Results Test URL).
```

**Expected output:** Complete `<head>` snippet with JSON-LD, OG tags, Twitter card, and canonical URL — copy-paste ready. Verify with Google Rich Results Test.
