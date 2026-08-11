---
name: scene-cast
description: "Cast a real face into a cinematic AI scene using Seedance 2.0 identity-lock. No face-swap, no training. One photo → 15-second clip."
version: 1.0.0
---

# Scene Cast

## When to use
Use when you want to drop a real person's face into a scene they could never actually film - cinematic, specific, identity-locked. One clear reference photo → one 15-second continuous shot.

**For Nebula specifically:** use for brand storytelling content (Mike in a cinematic workspace). NOT for pre-checkout Looms or direct-to-person videos - those require real footage per the avatar policy.

## The Method
One photo → Seedance 2.0 / Higgsfield reference-to-video → single continuous 15-second shot. No keyframe step. No face-swap. No model training.

**What keeps the face:** the reference photo goes in directly as the identity anchor, and the prompt says "strict 1:1 identity, no beautifying." That single instruction prevents drift. Your expression comes from the words, not the photo.

## Interview (run before generating)

Ask these questions one at a time:

1. **Reference photo:** "Drop your reference photo (front-facing, no hat, no sunglasses, no harsh shadow). This is the entire foundation - sharp and honest wins."

2. **Scene:** "Describe the scene in one sentence: where are you, what's happening around you?"

3. **Mood + expression:** "What emotion does the camera see on your face? (e.g., fierce and focused / quietly confident / the moment before something changes)"

4. **Wardrobe:** "What are you wearing? Plain dark t-shirt and jeans reads founder. Suit reads executive. Match the brand."

5. **Signature color:** "One color that appears in the environment - should match your Visual DNA palette. For Nebula: teal."

## Prompt Template

Once interview is complete, build this prompt (paste into Higgsfield or Seedance 2.0 with the reference photo uploaded as identity reference):

```
Main Character STRICT IDENTITY LOCK: the protagonist's face, build and features ARE this reference photo. Strict 1:1 identity, no beautification, no modifications. Lock identity before and throughout.

Ultra-realistic cinematic [THEME], single continuous shot, no cuts. Main character: [DESCRIPTION FROM PHOTO], wearing [WARDROBE], expression [MOOD/EXPRESSION]. Setting: [SCENE]. Lighting: [DIRECTION + QUALITY - e.g. "soft teal monitor glow from the left, deep shadow behind"]. 85mm, shallow depth of field, [SIGNATURE COLOR] accents.

0–4s: establish - slow push-in from medium, face large and clear, identity fully legible.
4–8s: [ENERGY BUILDS - describe what shifts in the environment or on the face].
8–12s: [PEAK - the moment, held, the world reacting].
12–15s: aftermath - the camera eases back, final frame held live.

Visible skin pores, subsurface scattering, individual hair strands, slight film grain, neutral skin tones, raw and unretouched - no smoothing, no plastic look.

[VISUAL DNA ANCHOR]
```

## Visual DNA anchor for Nebula
Append to every prompt:
```
RED Komodo, 35mm anamorphic lens, soft monitor-glow practicals, near-black with teal accent, light film grain, slight vignette
```

## Higgsfield settings
- Upload reference photo as identity reference image
- Resolution: 1080p
- Duration: 15 seconds
- Aspect: 9:16 (vertical) or 16:9 (landscape)
- Audio: ON (ambient only - the identity-lock prompt has no VO, add separately)
- Motion strength: 35–45% (never above 60% - identity drift accelerates above 60%)

## What NOT to put in the prompt
- "8K ultra masterpiece cinematic" - triggers plastic look
- Camera move in the subject clause - put it in its own timeline beat
- More than one hard cut - the model re-invents the face on every cut

## Nebula scene library

### Scene A - The Founder at Work (brand content)
```
Main Character STRICT IDENTITY LOCK: strict 1:1, no modifications.

Ultra-realistic cinematic founder moment, single continuous shot. [MIKE], plain dark t-shirt, expression quietly certain - the face of someone who found the answer and is about to show you. Dark workspace at night, one monitor glowing with teal audit interface, the rest of the room in shadow.

0–4s: establish - slow push-in from medium, face half-lit by monitor glow, the screen faintly visible behind him.
4–8s: his eyes move from the screen to the camera - direct, unhurried.
8–12s: held. The monitor glow shifts slightly brighter. He doesn't look away.
12–15s: the camera eases back, the desk and screen come into frame around him.

Visible skin pores, subsurface scattering, individual hair strands, slight film grain, neutral skin tones, raw and unretouched.

RED Komodo, 35mm anamorphic lens, soft monitor-glow practicals, near-black with teal accent, light film grain, slight vignette.
```

### Scene B - The Revelation (story content)
```
Main Character STRICT IDENTITY LOCK: strict 1:1, no modifications.

Ultra-realistic cinematic moment of discovery, single continuous shot. [MIKE], plain dark t-shirt, expression shifting from focused to resolved - the exact moment something clicks. Dark minimal workspace, two screens, late night, nothing else.

0–4s: establish - medium shot, looking at screen, not camera.
4–8s: his expression shifts - a small recognition, nothing dramatic.
8–12s: he turns to camera directly. Holds.
12–15s: slow push-in to close-up. Final frame on his face.

Visible skin pores, subsurface scattering, individual hair strands, slight film grain, raw and unretouched.

RED Komodo, 35mm anamorphic lens, soft monitor-glow practicals, near-black with teal accent, light film grain, slight vignette.
```

## Avatar policy reminder
- This content → broadcast only (generic audience posts)
- Add AI-content disclosure label on TikTok/Reels/YouTube/Meta
- Caption: "AI-generated visuals. Written and directed by me."
- For direct-to-person content: film real footage instead
