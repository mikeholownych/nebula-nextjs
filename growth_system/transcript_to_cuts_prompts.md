# Nebula — Transcript-to-Cuts Prompt Templates
# Usage: after transcribing a rough shoot, paste one of these prompts + the transcript
# into a fresh Claude session. Run cuts 1, 2, 3 in sequence from the same transcript.

---

## MASTER EDITOR PROMPT (paste first, before any transcript)

```
You are my video editor. The recording below is a rough, unscripted session where
I talked through 3 topics back-to-back for Nebula Components — a landing page audit
tool for founders wasting ad spend.

My voice: direct, plain, no corporate language. Short sentences. Specific numbers.
The ICP: founders running paid ads to landing pages that don't convert.
The villain: the page, not the ads.
The product: free audit → $97 fix, 48 hours.

From this one source transcript, produce three independent cuts. I will ask for each
separately. When I say "Cut 1," produce the 60-second short-form version. When I say
"Cut 2," produce the 3-minute long-form. When I say "Cut 3," produce the text thread.

Rules that apply to all cuts:
- Hook in the first 5 seconds — start at the strongest line, not the setup
- Cut all filler (um, so, basically, you know, like), repeats, and tangents
- Mark KEEP / CUT for each chunk with timestamp range
- For every KEEP, add a [b-roll] suggestion in brackets (screen recording preferred)
- Mark 2–3 lines for CAPTION EMPHASIS
- Never start a cut with "Hey guys" or "So today"
- End every cut with a CTA: nebulacomponents.com or "Reply YES"
```

---

## CUT 1 PROMPT — 60-second short-form (TikTok / Reels / Shorts)

```
Cut 1: Give me a 60-second version for short-form (vertical, TikTok/Reels/Shorts).

Format:
- Hook (0–5s): the single most surprising or specific line. Start here. No setup.
- Core (5–50s): the 2–3 points that matter. Each one a max of 10 seconds.
- CTA (50–60s): one line + nebulacomponents.com

Return:
1. The cut list (KEEP/CUT with timestamps)
2. The cleaned VO as one paragraph (for re-recording or ElevenLabs)
3. 3 alternative hook options (so I can A/B test)
4. SRT caption file (max 7 words per line, max 2 lines per caption)
```

---

## CUT 2 PROMPT — 3-minute deep version (YouTube / LinkedIn)

```
Cut 2: Give me a 3-minute version for YouTube or LinkedIn long-form.

Structure:
- Hook (0–15s): strongest line from the transcript, no setup
- Context (15–30s): who this is for, what problem
- Investigation (30–90s): walk through the specific build or fix. Show the failure first.
- The turn (90–150s): the moment something worked, or the surprise
- CTA (150–180s): what to do next

Return:
1. The cut list (KEEP/CUT with timestamps, b-roll suggestions every 15s)
2. 3 key lines for caption emphasis
3. The final VO as one clean paragraph
4. A 3-line description for the video description field
5. 5 title options (pattern: [number/surprising fact] + [outcome for viewer])
```

---

## CUT 3 PROMPT — Text thread (X / Threads / LinkedIn text post)

```
Cut 3: Give me a text thread version — no video needed.

Format (X/Threads style):
- Post 1: the hook (1–2 sentences max, stops the scroll)
- Posts 2–5: one insight per post, no more than 3 sentences each
- Post 6: the CTA + link

Rules:
- Each post must stand alone if someone screenshots it
- No bullet points in posts 1–3 (prose reads better on mobile)
- Specific numbers over adjectives
- End every post with one line that makes you want to read the next one
- The villain is always external (the page, not the founder)

Return:
1. The full thread, numbered
2. A standalone "quote tweet" version (one post that contains the entire insight, under 280 chars)
3. A LinkedIn version of the same thread (can be longer, 3–5 paragraphs instead of posts)
```

---

## POLISH PASS PROMPT (after receiving any cut)

```
Make this cut tighter. Specifically:
1. The opening 5 seconds need to land harder — give me 3 new hook options
2. Cut another 20% of the runtime, your choice where (mark what you cut and why)
3. The middle is dragging — find the dip and tell me which 15-second chunk to delete
4. Add a b-roll suggestion every 10 seconds where there are currently gaps
5. The CTA is flat — rewrite it with more stakes (what happens if they don't act)
```

---

## EXPORT-READY HANDOFF (after polish)

```
Give me two final outputs:

1. Clean SRT caption file for the finished cut:
   - Max 2 lines per caption
   - Max 7 words per line
   - Timestamps in 00:00:00,000 format

2. Descript scene list:
   Scene N | start–end | clip description (10 words) | b-roll note
   One line per scene, pipe-separated.
```

---

## WEEKLY RHYTHM REMINDER

| Day | Action | Time | Tool |
|-----|--------|------|------|
| Monday | Rough shoot (3 topics) | 45 min | `bash ~/.hermes/scripts/nebula_shoot.sh` |
| Tuesday | Transcribe | 5 min | `whisper recording.mp4 --output_format srt` |
| Wednesday | 3 cuts from transcript | 30 min | Claude + prompts above |
| Thursday | Polish + assembly | 60 min | Descript / ffmpeg |
| Friday | Schedule | 15 min | Buffer / native |

**Fixed shoot day: Monday. Non-negotiable. Talk for 45 minutes. Don't script it.**
