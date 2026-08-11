# Nebula - Founder Character Reference Pack
# For: Flux Context conditioning (5-angle hero pack)
# Character: A founder in his mid-40s. Dark hair, slight stubble, unremarkable.
# Wearing a plain dark t-shirt. Not performing. Not a stock photo.
# The person you'd see at a founder dinner who you'd underestimate until he talked.
# Style anchor: RED Komodo, 35mm anamorphic, soft monitor-glow practicals, near-black with teal accent, light film grain, slight vignette

---

## The 5-Angle Reference Prompts

### Prompt 1 - 3/4 Left, Smiling (warmth, recognition)
> A man in his mid-40s, dark hair, light stubble, plain dark t-shirt, turned 3/4 to camera left, a small genuine smile - the kind that happens when something works, not for a photo. Soft monitor glow from the left casting teal-tinted light on his face. Near-black background. RED Komodo, 35mm anamorphic lens, soft monitor-glow practicals, near-black with teal accent, light film grain, slight vignette. Photoreal, shallow depth of field, no retouching.

### Prompt 2 - 3/4 Right, Neutral (thinking, focused)
> A man in his mid-40s, dark hair, light stubble, plain dark t-shirt, turned 3/4 to camera right, neutral expression, looking slightly off frame as if reading a screen. Soft monitor glow from the right casting teal-tinted light on his face. Near-black background. RED Komodo, 35mm anamorphic lens, soft monitor-glow practicals, near-black with teal accent, light film grain, slight vignette. Photoreal, shallow depth of field, no retouching.

### Prompt 3 - Full Profile (silhouette, resolve)
> A man in his mid-40s, dark hair, light stubble, plain dark t-shirt, shot in full profile facing camera right, jaw set, expression unreadable. Hard monitor glow lighting the edge of his face and neck, the opposite side in deep shadow. Near-black background. RED Komodo, 35mm anamorphic lens, soft monitor-glow practicals, near-black with teal accent, light film grain, slight vignette. Photoreal, shallow depth of field, no retouching.

### Prompt 4 - Head-On, Smiling (direct, trustworthy)
> A man in his mid-40s, dark hair, light stubble, plain dark t-shirt, facing directly into the camera, a relaxed genuine smile - not a performance. Soft even monitor light on his face from slightly above. Near-black background. RED Komodo, 35mm anamorphic lens, soft monitor-glow practicals, near-black with teal accent, light film grain, slight vignette. Photoreal, shallow depth of field, no retouching.

### Prompt 5 - Head-On, Serious (weight, authority)
> A man in his mid-40s, dark hair, light stubble, plain dark t-shirt, facing directly into the camera, expression serious and still - the face of someone who has figured something out and is about to say it. Hard teal monitor glow from slightly below. Near-black background. RED Komodo, 35mm anamorphic lens, soft monitor-glow practicals, near-black with teal accent, light film grain, slight vignette. Photoreal, shallow depth of field, no retouching.

---

## How to Use

### Flux Context conditioning
1. Generate all 5 prompts above → pick the sharpest render of each
2. Upload all 5 as reference images in Flux Context
3. Every subsequent prompt: "the same man, now [scene]" + style anchor
4. The identity is locked from the multi-angle reference pack

### Midjourney --cref (stylised only)
1. Generate Prompt 4 (head-on smiling) once
2. Copy the image URL
3. Append `--cref [URL] --cw 80` to every subsequent prompt
4. Only use for stylised/illustrated - photoreal will drift at 3/4 angles

### LoRA training (series use)
1. Use all 5 prompts as the training set (30 renders across the 5 angles)
2. Feed to Flux fine-tune with the style anchor as the base
3. After training, trigger word calls the character directly
4. Use when the character will appear in 50+ shots across the channel

---

## Failure modes to avoid

**Drift starts in the still, not the motion.** If Shot 3 uses a different reference angle than Shot 1, the face will drift. Fix: always pass all 5 reference images, not just the hero shot.

**Method-hopping mid-project.** If you start with Flux Context conditioning, finish with it. Don't switch to --cref for one shot because it seemed faster.

**Single-angle reference.** One head-on still = the model extrapolates the profile and 3/4 angles, often wrong. Five angles = the identity is geometrically locked.

---

## Notes on the character description
- "Unremarkable until he talked" - avoids the generic confident-founder stock photo look
- Plain dark t-shirt - matches the workspace aesthetic, doesn't date the content
- Monitor-glow as the key light - ties the character to the product context
- No retouching - the lesson says photoreal humans with visible pores look less AI-generated
