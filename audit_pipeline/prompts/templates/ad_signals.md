## Ad Tracking — Conversion Measurement

**Finding:** Your ad tracking setup is incomplete — you can't measure true ROAS.

**Current signals detected:**
${signals_found}

**Missing signals:**
${signals_missing}

**What's wrong:**
${ad_signals_issue}

**The fix criteria:**
- Facebook Pixel installed with PageView + Purchase/Lead events
- GA4 installed with conversion events
- UTM parameters on all paid traffic links
- Thank-you/success page with conversion event firing

### Prompt

Copy and paste this into Claude, ChatGPT, or Gemini:

```
I need to fix my ad tracking setup. Here's what I'm missing:

**Page URL:** ${url}
**Missing:** ${signals_missing}
**Detected platform:** ${platform}

Give me the exact code snippets I need to add. For each item:

1. **${missing_item_1}**
   - The code snippet (including the pixel/ID placement)
   - Exactly which page(s) to add it to
   - How to verify it's firing (browser console command)

2. **${missing_item_2}**
   - The code snippet
   - Which page(s)
   - Verification step

Platform-specific: if ${platform} is Shopify/WordPress/Wix, give me
the plugin or settings path instead of raw code where applicable.
```

**Expected output:** Exact code snippets for each missing tracking signal, with installation location and verification steps. You can verify firing immediately after installing.
