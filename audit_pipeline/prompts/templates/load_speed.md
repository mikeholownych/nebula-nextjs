## Load Speed — Page Performance

**Finding:** Your page loads slowly, costing conversions.

**Current performance:**
${load_speed_issue}

**Page details:**
- HTML size: ${html_size}
- Detected platform: ${platform}
- Page URL: ${url}

**The fix criteria:**
- Lighthouse performance score >= 70 on mobile
- First Contentful Paint < 2.5s

### Prompt

Copy and paste this into Claude, ChatGPT, or Gemini:

```
I need to improve my landing page loading speed.

**Page URL:** ${url}
**Platform/CMS:** ${platform}
**HTML size:** ${html_size} KB
**Current performance:** ${load_speed_issue}

Give me a prioritized fix list (most impactful first):
1. Quick wins (can do in 5 minutes, no developer needed)
2. Platform-specific fixes for ${platform}
3. Image optimization recommendations (specific formats and tools)
4. Code-level improvements (defer, lazy-load, inline critical CSS)

For each item: effort estimate, expected improvement, and exact steps.
End with: "Check your score at https://pagespeed.web.dev/ after applying."
```

**Expected output:** A prioritized checklist with effort estimates. Start with the quick wins and re-test.
