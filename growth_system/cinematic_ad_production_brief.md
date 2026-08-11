# Nebula - Cinematic Ad Production Brief
# Concept: "A founder discovers exactly how much their page is costing them."
# Duration: 30 seconds | 6 shots × 5 seconds
# Style anchor: RED Komodo, 35mm anamorphic lens, soft monitor-glow practicals, near-black with teal accent, light film grain, slight vignette

---

## 6-Shot Storyboard

| # | Duration | Scene | Higgsfield Preset | VO Line |
|---|---|---|---|---|
| 1 | 2s | Dark monitor. Stripe dashboard. $0. Night. Tension. | Crash Zoom | "You checked Stripe again." |
| 2 | 4s | Same desk. Browser opens to nebulacomponents.com. URL typed slowly. | Slow Dolly In | "Paste your URL. Two minutes." |
| 3 | 5s | Audit score appears - teal indicators lighting up one by one across the screen. | Crane Down | "Here's what every visitor felt when they landed." |
| 4 | 5s | Close-up: a single finding glowing on screen. Visitor-voice text visible. Teal accent. | Orbit (tight) | "Not your ads. This. Right here." |
| 5 | 5s | Dollar amount appears - monthly bleed calculated. Screen glow intensifies slightly. | Bullet Time | "Eight hundred dollars a month. Gone." |
| 6 | 9s | Wide desk shot. Calm. Monitor still glowing. Coffee. Quiet authority. | Static lock-off | "Fix it for ninety-seven dollars. Done in forty-eight hours." |

**Total:** 30 seconds

---

## Full VO Script (plain)

You checked Stripe again.

Paste your URL. Two minutes.

Here's what every visitor felt when they landed.

Not your ads. This. Right here.

Eight hundred dollars a month. Gone.

Fix it for ninety-seven dollars. Done in forty-eight hours.

nebulacomponents.com

---

## VO Script - Marked Up for Recording

Pause markers: · = short breath (0.3s) · · = held pause (0.6s) · · · = full stop (1s)
Stress: CAPS

```
You checked Stripe · again. · · ·

Paste your URL. · Two minutes. · ·

Here's what EVERY visitor felt · when they landed. · ·

Not your ads. · · THIS. · Right here. · · ·

EIGHT HUNDRED DOLLARS a month. · · Gone. · · ·

Fix it for NINETY-SEVEN DOLLARS. · Done in forty-eight hours. · · ·

nebula · components · dot com.
```

**Tone in 3 words:** quiet / factual / inevitable

**Total word count:** 51 words | **Est. duration at natural pace:** 28–32 seconds ✓

---

## Still Generation Prompts (one per shot)

**Shot 1:**
> A dark laptop screen showing a Stripe dashboard with $0 revenue, night, harsh screen glow only, empty desk. Dread, stillness. RED Komodo, 35mm anamorphic lens, soft monitor-glow practicals, near-black with teal accent, light film grain, slight vignette. Photoreal, shallow depth of field. 16:9.

**Shot 2:**
> Dark workspace at night, browser open to a minimal landing page audit tool interface, URL being entered in an address bar, teal UI elements, focus on the monitor. RED Komodo, 35mm anamorphic lens, soft monitor-glow practicals, near-black with teal accent, light film grain, slight vignette. Photoreal, shallow depth of field. 16:9.

**Shot 3:**
> Close-up of a monitor showing an audit score with teal indicators lighting up in sequence - 9 rows of pass/fail signals. The room is otherwise dark. Quiet satisfaction building. RED Komodo, 35mm anamorphic lens, soft monitor-glow practicals, near-black with teal accent, light film grain, slight vignette. Photoreal, shallow depth of field. 16:9.

**Shot 4:**
> Close-up of a single paragraph of text on a dark screen - a conversion finding written in plain emotional language, teal accent glow, nothing else in frame. Stark. RED Komodo, 35mm anamorphic lens, soft monitor-glow practicals, near-black with teal accent, light film grain, slight vignette. Photoreal, shallow depth of field. 16:9.

**Shot 5:**
> Dark monitor. A dollar amount displayed large: "$847/month" in near-white on near-black, teal underline. The only light is the screen. No other context. Heavy. RED Komodo, 35mm anamorphic lens, soft monitor-glow practicals, near-black with teal accent, light film grain, slight vignette. Photoreal, shallow depth of field. 16:9.

**Shot 6:**
> Wide dark workspace, single monitor glowing with a resolved teal interface, keyboard, coffee, nothing else. Shot is still. Quiet authority. The problem is solved. RED Komodo, 35mm anamorphic lens, soft monitor-glow practicals, near-black with teal accent, light film grain, slight vignette. Photoreal, shallow depth of field. 16:9.

---

## Production Checklist

- [ ] Record VO with marked-up script before generating any stills
- [ ] Generate Shot 1 still (Stripe dashboard)
- [ ] Generate Shot 2 still (URL being typed)
- [ ] Generate Shot 3 still (score appearing)
- [ ] Generate Shot 4 still (single finding)
- [ ] Generate Shot 5 still (dollar amount)
- [ ] Generate Shot 6 still (wide desk, resolved)
- [ ] Higgsfield: generate each shot × 3 re-rolls, keep third
- [ ] Upscale all clips to 1080p before export
- [ ] ffmpeg assembly: concat shots → layer VO → add captions
- [ ] Export 16:9 (homepage/YouTube) + 9:16 (crop for Shorts/Reels)

---

## ffmpeg Assembly Commands

```bash
# Concat all shots
ffmpeg -f concat -safe 0 -i shots_list.txt -c copy raw_sequence.mp4

# Layer voiceover
ffmpeg -i raw_sequence.mp4 -i voiceover.wav \
  -map 0:v -map 1:a -shortest -c:v copy -c:a aac final_16x9.mp4

# Crop to 9:16 (vertical)
ffmpeg -i final_16x9.mp4 \
  -vf "crop=ih*9/16:ih:(iw-ih*9/16)/2:0" final_9x16.mp4
```

shots_list.txt format:
```
file 'shot1.mp4'
file 'shot2.mp4'
file 'shot3.mp4'
file 'shot4.mp4'
file 'shot5.mp4'
file 'shot6.mp4'
```
