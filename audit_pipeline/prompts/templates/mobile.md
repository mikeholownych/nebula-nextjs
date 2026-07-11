## Mobile — Viewport & Responsiveness

**Finding:** Your page may not render correctly on mobile devices.

**What's wrong:**
${mobile_issue}

**The fix criteria:**
- Viewport meta tag present in `<head>`
- Content scales properly on 375px width
- CTA tappable (min 44x44px touch target)

### Prompt

Copy and paste this into Claude, ChatGPT, or Gemini:

```
I need to make my landing page mobile-responsive.

**Page URL:** ${url}
**Platform/CMS:** ${platform}
**Issue:** ${mobile_issue}

Give me:
1. The exact meta viewport tag to add (if missing) and where in the HTML
2. A mobile-responsive CSS snippet that fixes common scaling issues
3. Three things to check on mobile (with specific pass/fail criteria)

If your platform is WordPress/Shopify/Squarespace/Webflow: give me
the exact settings or plugin name to enable responsive mode instead.

Format as a checklist I can work through in order.
```

**Expected output:** A checklist starting with the viewport tag, then CSS fixes, then manual verification steps. Test on your phone after applying each item.
