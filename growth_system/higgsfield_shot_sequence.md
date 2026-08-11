# Nebula - 5-Shot Higgsfield Sequence Brief
# Foundation image: https://v3b.fal.media/files/b/0aa5d741/djmKpy_NAH1qu8Qxw6smp_sj7rr7cX.png
# Use case: 15-second cinematic homepage hero loop
# Status: READY TO EXECUTE - paste into Higgsfield when motion generation available

---

## Foundation image spec (already generated)
Dark workspace at night. Monitor glowing with audit dashboard. Teal screen light
spilling onto dark desk. Left third empty for headline/CTA overlay. 16:9.

---

## The 5-Shot Sequence

### Shot 1 - Hook (cold open)
- **Higgsfield preset:** Crash Zoom
- **Motion strength:** 55%
- **Duration:** 2 seconds
- **Prompt:**
  > A landing page audit dashboard glows on a dark monitor, harsh teal light spilling across a wooden desk at night. Silent, tense, focused. Photoreal, shallow depth of field, cinematic.
- **Purpose:** Stops the scroll. One second of hard punch before the eye settles.

---

### Shot 2 - Reveal (slow build)
- **Higgsfield preset:** Slow Dolly In
- **Motion strength:** 35%
- **Duration:** 4 seconds
- **Prompt:**
  > A dark workstation at night, monitor showing a scored audit report with teal accent indicators. Soft monitor glow as the only light source. Still, late-night focus. Photoreal, shallow depth of field, cinematic.
- **Purpose:** Lets the viewer orient. The slow push creates the feeling of leaning in to see what's on the screen.

---

### Shot 3 - Hero (the money shot)
- **Higgsfield preset:** Orbit (360)
- **Motion strength:** 40%
- **Duration:** 5 seconds
- **Prompt:**
  > A sleek dark monitor displaying a landing page score - glowing teal numbers on a near-black interface. Steam rises faintly from a coffee cup to the right. Monitor light casts shadows across a minimal workspace. Quiet authority. Photoreal, shallow depth of field, cinematic.
- **Purpose:** The 360 orbit is the "product reveal" shot. This is what gets screenshotted and shared.

---

### Shot 4 - Context (environment)
- **Higgsfield preset:** Crane Down
- **Motion strength:** 30%
- **Duration:** 4 seconds
- **Prompt:**
  > A wide dark desk at night, a single monitor glowing with a diagnostic dashboard, keyboard and coffee to the sides, nothing else. The shot descends from above to reveal the full workspace. Late-night solitude. Photoreal, shallow depth of field, cinematic.
- **Purpose:** Shows the context - this is a founder working late, not a stock photo office. Adds emotional grounding before the exit.

---

### Shot 5 - Exit (transition out)
- **Higgsfield preset:** Whip Pan
- **Motion strength:** 65%
- **Duration:** 1 second
- **Prompt:**
  > Dark workspace, monitor with teal diagnostic glow, rapid lateral camera movement. Blurred transition. Cinematic.
- **Purpose:** Clean transition to the text card / CTA screen. Fast, decisive, professional.

---

## Assembly order
Shot 1 (2s) → Shot 2 (4s) → Shot 3 (5s) → Shot 4 (4s) → Shot 5 (1s) = **16 seconds total**

For a seamless homepage loop: use Shot 3 (orbit) as standalone 5-second loop - same first and last frame if you feed the foundation image as both keyframes.

---

## Visual DNA anchor (append to every prompt above)
```
RED Komodo, 35mm anamorphic lens, soft monitor-glow practicals, near-black with teal accent, light film grain, slight vignette
```

---

## Higgsfield settings checklist
- [ ] Attach foundation image to every shot
- [ ] Select preset from dropdown (do NOT write camera move in text prompt)
- [ ] Set motion strength per shot (30–65%, never above 80%)
- [ ] Re-roll each shot 2–3 times - third roll usually the keeper
- [ ] Upscale to 1080p before export
- [ ] Export without audio (homepage loop needs silent video)

---

## When motion generation is available
1. Open Higgsfield
2. Upload foundation image: download from URL above
3. Paste Shot 1 prompt, select Crash Zoom, set 55%, 2s → generate × 3
4. Pick keeper → repeat for shots 2–5
5. Export all 5 clips
6. `ffmpeg` concat sequence (see video stack notes)
7. Deploy as homepage hero background via `<video autoplay loop muted playsinline>`
