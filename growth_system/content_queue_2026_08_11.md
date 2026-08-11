# Content Queue — Built Today, Post Tomorrow
# Generated: 2026-08-11
# Format: LinkedIn/X short-form, information gap loop applied
# Each post: real, happened today, specific numbers, How gated

---

## POST 1 — The 25 leads who never got the email
**Trigger:** Retainer upsell cron was querying a stale database instead of HOT_LEAD.json
**Angle:** "My pipeline looked healthy. It wasn't."

```
I had 25 founders in my pipeline.
All pitched 37 days ago.
None of them got the follow-up.

The script was running. The cron was firing. The logs looked clean.

But it was querying the wrong data source.
The canonical lead records were in one file.
The script was reading from a different one.

37 days of eligible leads. Zero upsell attempts.
The pipeline didn't fail loudly.
It failed silently — which is worse.

The fix took 20 minutes.
The gap it exposed took 37 days to find.

If your outreach pipeline looks healthy, check what it's actually reading.
```

**CTA:** "We use Nebula to find the silent failures on landing pages.
Same logic. What's running that looks fine but isn't?"

---

## POST 2 — 5 checkouts, 0 purchases
**Trigger:** MOA analysis of checkout abandonment
**Angle:** "The expert diagnosis I ran on my own funnel"

```
I had 5 Stripe checkout sessions initiated.
0 completed.

I asked three independent expert lenses what was wrong:
Direct response copywriter.
CRO engineer.
Founder psychology specialist.

They all agreed on the same root cause — and it wasn't the price.

The Stripe link was arriving before the founder had finished deciding.

Not before they saw the offer.
Before they believed the offer.

There's a specific moment in every purchase decision where the buyer shifts from
"this might work" to "this will work for me."
I was sending the payment link before that moment.

The fix: don't send the link with the audit.
Send it after they reply.
The reply IS the proof they felt it.
```

**CTA:** "nebulacomponents.com — we find the moment your page loses the sale"

---

## POST 3 — The audit that didn't convert
**Trigger:** Mike's 20-year story + Nebula's own landing page
**Angle:** "I built a landing page audit tool. My landing page didn't convert."

```
I've spent 20 years building things that work.

Real things. Things that do exactly what I promised.

And for 20 years, I watched them die.

Not because they were bad.
Because the people who said they were good walked away.

"I'd totally buy that." Five words. Over and over. For two decades.

I know why now.
I was doing the work. They were telling the story.
And story is what makes people open their wallet.

So I built Nebula — a tool that reads landing pages and shows founders exactly
where their ad spend is disappearing.

146 people used it. Zero paid.

My landing page — the one selling a tool that diagnoses landing pages — wasn't converting.

I had the exact problem I was solving.

That took me longer to say out loud than it should have.

If your page looks good but isn't converting, I know what that Tuesday morning
feels like when you open Stripe and the number is still zero.

It's not your ads.
It was never your ads.
```

**CTA:** nebulacomponents.com

---

## POST 4 — The ROI calculator that names the bleed
**Trigger:** Built and shipped ROI calculator today
**Angle:** "I added one section to my homepage. It turns a score into a dollar amount."

```
"Your page has conversion issues."

That sentence converts nobody.

"Your page is costing you $847/month at your current ad spend."

That one does.

I added a calculator to my landing page today.
3 inputs: monthly ad spend, average CPC, current conversion rate.
Output: the monthly amount being wasted on a page that can't close.

It's not a gimmick.
It's the movie popcorn test.

37 grams of saturated fat means nothing.
A bag of popcorn with more fat than a bacon-and-eggs breakfast,
a Big Mac and fries, and a steak dinner combined — 
that's the same fact. Different frame.

Most founders know their landing page isn't converting.
They don't know what that's costing them specifically.
Once they do, $97 to fix it isn't a decision.
It's math.
```

**CTA:** nebulacomponents.com/audit — the calculator is above the fold

---

## POST 5 — The 4 lines that changed the resolution
**Trigger:** Narrative audit — homepage ending on artifact not feeling
**Angle:** "I audited my own copy against a story framework. Found 2 failures."

```
I ran my homepage copy through a 3-question audit.

Hero check: is the customer the focus?
Emotional anchor: is there a clear feeling?
Clear stakes: is it obvious what happens if they do nothing?

Two assets failed.

The audit email subject: no stakes.
The homepage resolution: ends on the artifact, not the feeling.

"From URL to fix list in under 2 minutes" tells people what they get.
It doesn't tell them how they'll feel when they have it.

The feeling is: you stop guessing.

That's what founders with a leaking landing page actually want.
Not a report. Not a ranked list. Not a score.

The end of the anxiety that comes from not knowing what's wrong.

4 lines changed. No new features. No redesign.
Same product. Different feeling.

If your copy ends on a deliverable instead of a transformation, you're one sentence away from a higher conversion rate.
```

**CTA:** "Run the audit: nebulacomponents.com/audit"

---

## POST 6 — Visual DNA anchor (for the AI video audience)
**Trigger:** Visual DNA anchor clause built today
**Angle:** "The 30-word paragraph that fixes visual whiplash in AI video"

```
The biggest tell someone is new to AI video:
six clips, six different movies.

Different colour. Different grain. Different lens feel.

The fix is one paragraph you paste at the end of every prompt. Forever.

Mine:
"RED Komodo, 35mm anamorphic lens, soft monitor-glow practicals, near-black with teal accent, light film grain, slight vignette"

That's it. 26 words.

Camera body. Lens. Light source. Palette. Texture.

Five layers. One sentence. Used on every generation.

The scene changes. The anchor never does.

Most people skip this and wonder why their videos look inconsistent.
The model isn't forgetting your style.
You're not telling it what your style is.
```

**CTA:** "What's your anchor? Build one before your next generation."

---

## CONTENT CALENDAR SUGGESTION
| Day | Post | Platform | Format |
|---|---|---|---|
| Today | Post 3 (20-year story) | LinkedIn | Long-form |
| +1 day | Post 2 (5 checkouts, 0 purchases) | LinkedIn | Mid-form |
| +2 days | Post 5 (4 lines) | X/LinkedIn | Short |
| +3 days | Post 1 (25 leads silent failure) | LinkedIn | Mid-form |
| +4 days | Post 4 (ROI calculator) | LinkedIn | Mid-form + screenshot |
| +5 days | Post 6 (Visual DNA) | X | Short + image |

---

## SYSTEM NOTE: Auto-queue from commits
Every `git commit -m` message with "story|copy|email|landing|pipeline|audit|fix|upsell"
is a candidate brief. Run this to see today's queue:
```
git log --oneline --since="1 day ago" | grep -iE "story|copy|email|landing|pipeline|audit|fix|upsell"
```
