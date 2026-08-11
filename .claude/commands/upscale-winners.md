# /upscale-winners
# Trigger: paste a list of winning clip filenames (one per line)
# Action: writes a Topaz Video AI master-upscale brief for each clip
# Output: briefs dropped in ~/Videos/nebula-shoots/upscale-queue/

## Usage
```
/upscale-winners
shot3.mp4
shot5.mp4
```

## What this does
For each filename you paste:
1. Reads the clip from ~/Videos/nebula-shoots/
2. Writes a paste-ready Topaz Video AI upscale brief
3. Saves the brief to ~/Videos/nebula-shoots/upscale-queue/<filename>.brief.txt

## The master upscale brief template (applied to each clip)

```
Upscale {FILENAME} to 3840x2160. Preserve film grain and motion artifacts as cinematic texture — do not denoise, do not apply noise reduction. Style anchor: RED Komodo, 35mm anamorphic lens, soft monitor-glow practicals, near-black with teal accent, light film grain, slight vignette. Output as ProRes 422 HQ for editorial.
```

## Decision table (run before queuing)

| Destination | Upscale to 4K? | Reason |
|---|---|---|
| TikTok / Reels / Shorts (phone feed) | NO — keep 1080p | Phone screens can't render above 1080p |
| YouTube landscape (desktop) | YES if hero/recurring | 4K matters for search thumbnail sharpness |
| LinkedIn | NO | Feed compresses to 720p anyway |
| Brand archive / future recut | YES | Master quality for long-term use |
| One-off post, no reuse | NO | Throwaway doesn't need archival quality |

## The 2-stage rule (apply before any motion generation run)
- Stage 1: generate ALL candidates at 720p
- Stage 2: pick winners, upscale ONLY those to 4K
- Cost saving: 60-80% on iteration, full quality on the 6 that ship

## "Preserve grain" is the key line
Without it: upscaler denoises → waxy plastic skin → looks like stock footage
With it: film grain preserved → cinematic texture → matches Visual DNA anchor
