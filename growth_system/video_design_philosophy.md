# Nebula Components - Video Design Philosophy
# Version 1.0 - 2026-08-11
# Drop this file into any new video project. Every asset follows this spec.

---

## Visual Identity

**Color palette**
- Background: near-black (#0a0a0a or equivalent dark base)
- Primary accent: teal (#2dd4bf or the site `accent` token)
- Text: off-white (#f4f4f4)
- Signal fail: amber (#f59e0b)
- Signal pass: teal (same as accent)
- Never use: pure white backgrounds, saturated red, gradients with more than 2 stops

**Typography**
- Primary font: system-ui / -apple-system stack (matches site)
- Monospace for data/scores: `font-mono`
- Headline weight: extrabold (800)
- Body weight: regular (400)
- Never use: decorative fonts, script fonts, all-caps for more than 4 words

---

## Motion Philosophy

**Pacing**
- Default cut rhythm: 2–3 seconds per scene (per prompt pack #5 - use the best 2-3 seconds of any take)
- Animated numbers: count up to final value over 0.8–1.2 seconds, ease-out
- Text entrance: fade up from 8px below, 300ms, ease-out
- Never use: zoom-in punches, shake effects, spinning transitions

**Camera language**
- Hero clips: locked-off or very slow dolly push (0.5x normal speed)
- Explainers: static or slow pan, never handheld shake
- Screen recordings: cursor moves at 0.6x speed, no jitter
- Always specify: "shot on cinema camera, 35mm anamorphic, shallow depth of field"

**Audio**
- Music: none (default) unless specifically requested
- Ambient: quiet electronics hum, soft keyboard clicks at -20dB
- Voice: natural, conversational pace, no reverb, no compression artifacts
- Voice chunks: max 45–60 seconds per clip (per prompt pack #14)
- Never use: royalty-free pop music, dramatic stingers, echo effects

---

## Content Rules

**Opening**
- Start on word one - no countdown, no "hey guys", no logo sting
- First 3 seconds must answer: who this is for and what problem it solves
- OR: open on a number (the monthly cost, the score, the gap)

**Subtitles**
- Always: white text, black semi-transparent background pill, 16–18px
- Word-level sync preferred (per prompt pack #7)
- Never burn subtitles into the frame - always as overlay layer

**Proof elements**
- Real domain names when possible (knallhart.com, basecamp.com)
- Real scores from real audits - never mock data
- Dollar amounts always: "$847/month" not "hundreds of dollars"

**CTA**
- Always the last thing the viewer sees
- One action only: either "nebulacomponents.com/audit" or "Reply YES"
- Never: "link in bio", "swipe up", "click below" without the URL

---

## Format by Use Case

**Pre-checkout Loom (60–75 seconds)**
- Screen share on prospect's audit results only
- 3 chunks: recognition → villain named → offer
- No music, no transitions, no B-roll
- Chunk 3 (offer) recorded once, reused for all prospects

**Homepage hero loop (8–12 seconds)**
- Same first and last frame for seamless loop
- Locked-off camera
- Screen glow as only motion
- No audio on hero section

**How-it-works explainer (15–20 seconds)**
- One concept per screen
- Animated number reveal on the score
- Kurzgesagt energy: clean, minimal, educational
- Teal accent for the "pass" state, amber for the "fail"

**Social short (15–30 seconds)**
- Open on the pain number ("$1,200 in ads. 0 sales.")
- Audit result screen at 10 seconds
- End on the gap: "2% baseline vs. [their rate]"

---

## Foundation Image Spec
For any video that needs a consistent visual anchor:

```
Prompt template:
"[SUBJECT/SCENE]. Cinematic technical language: shot on cinema camera,
35mm anamorphic lens, shallow depth of field, visible [surface material]
imperfections, ultra-realistic, no retouching, no skin smoothing.
16:9 composition with deliberate empty space [left/right/top] third
for [headline/CTA/score] placement. [COLOR PALETTE]. [LIGHTING].
Generate 4 variations."
```

Current foundation: `/home/mike/.hermes/cache/video/nebula-hero-foundation.png`
(workspace monitor at night, teal screen glow, dark desk, left empty space)

---

## Reuse Protocol
1. Start every new video project by reading this file
2. If a clip style deviates from this spec, note the exception and why
3. After 3+ videos: update this file with any patterns that worked better
4. Never generate music unless Mike explicitly asks
5. Never use a white background on any Nebula video asset

---

## Visual DNA Anchor - Canonical Style Clause

> Paste this at the end of every still image or video prompt.
> Change scene language freely. Never change the anchor.

### Base (Default)
```
RED Komodo, 35mm anamorphic lens, soft monitor-glow practicals, near-black with teal accent, light film grain, slight vignette
```

### Warmer variant (warmer emotional tone - founder story content)
```
Arri Alexa, 50mm prime, warm desk lamp practicals, dark amber-teal palette, light film grain, halation on highlights
```

### Colder variant (data/product demos - analytical, clean)
```
RED Komodo, 24mm wide, cool blue monitor light, near-black with cool cyan accent, clean digital, subtle lens flare
```

---

## 5-Genre Anchor Table

| Genre | Visual DNA Anchor |
|---|---|
| Product demo | RED Komodo, 35mm anamorphic, overhead practical neon, near-black with teal, clean digital, slight vignette |
| Founder vlog | Arri Alexa, 50mm prime, soft window backlight, desaturated warm earth, light film grain, natural skin texture |
| Faceless short | iPhone 15 Pro, 24mm wide, harsh overhead key, high-contrast dark, heavy grain, vignette, no face in frame |
| Behind the scenes | Bolex 16mm, 25mm prime, available light only, muted desaturated teal, visible grain, raw ungraded feel |
| Cinematic ad | RED Komodo, 85mm portrait, golden hour side light, muted teal-orange, anamorphic lens flare, 2.39:1 crop |

---

## Anchor Audit Checklist
Before using any prompt, verify the anchor contains exactly these 5 layers:
- [ ] Camera body (specific model, not "cinema camera")
- [ ] Lens (mm + type, not "shallow depth of field" alone)
- [ ] Light source (specific, not "cinematic lighting")
- [ ] Palette (2 colour words max)
- [ ] Texture (grain/vignette/halation - one only)

If any layer is missing → do not send. Fix first.

---

## Avatar & Disclosure Policy

### When to use real footage (non-negotiable)
- Pre-checkout Loom (sent to specific founder who expects a real person)
- Homepage hero / about section
- Any video going to a named individual as a "reply"
- Any sales call follow-up

### When avatar is acceptable
- Broadcast short-form posts (generic audience)
- Product update announcements
- Volume content (15+ videos/week)
- Multilingual versions of existing real content

### Disclosure rule
If the avatar speaks AS Mike TO a specific person: disclose.
Add this line to description or video:
> "This is an AI version of me - written by me, voiced by my AI clone."

For broadcast content: add AI-content tag on Meta/TikTok/YouTube.
Required by platform policy as of 2026.

### Synthetic UGC: Never
Real customer reviews beat synthetic every time.
FTC fines for fake testimonials are real.
Offer a real customer incentive instead (free month for 30-second review).

### The one rule
If you feel pressure to hide that it's AI - that feeling is the rule. Disclose.
