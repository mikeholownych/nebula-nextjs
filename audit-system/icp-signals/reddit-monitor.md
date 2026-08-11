# Reddit Signal Monitor

## What It Does

Scans Reddit every 15 minutes for founders actively bleeding money on ads.
Alerts you within the hour - while the thread is still hot and the founder is still watching.

## Monitored Queries

```
landing page ads not converting    (sort: new, time: day)
zero conversions spending ads page  (sort: new, time: day)
r/entrepreneur new posts            (limit: 25)
r/PPC new posts                     (limit: 25)
r/SaaS new posts                    (limit: 25)
```

## Alert Format (Telegram)

```
🎯 Fresh Reddit signal

[Post title]
r/[subreddit] · [age]m ago · score [N]

https://reddit.com/r/...

Suggested reply:
What is your landing page URL? I can run a quick audit
and tell you exactly what's killing your conversion rate.

Triggers: [matched pain keywords]
```

## Response Protocol

**Within 1 hour of alert:**
1. Read the full thread context
2. If URL is mentioned → run audit immediately
3. Reply with specific question: "What's your landing page URL?"
4. Do NOT paste audit results unsolicited - ask first
5. If they share URL → audit → reply with ONE finding (the most impactful)
6. Link to full audit at nebulacomponents.shop only if they ask

**Why manual response:**
Automated replies to Reddit posts are flagged as spam.
The value is being first, specific, and human-sounding.
A manual reply within 1 hour of posting converts.
An automated reply converts at zero.

## Freshness Gate

Posts older than 6 hours are skipped.
The founder has moved on. The thread is cold.
Your comment will be buried.

## n8n Workflow ID: G6azfOHMHxlBva3N
