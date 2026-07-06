#!/usr/bin/env python3
"""
Process all discovered leads into signal_queue.jsonl
Scoring logic mirrors signal_watcher.py
"""
import json, os, re
from datetime import datetime, timezone

BASE_DIR = "/home/mike/nebula"
QUEUE_FILE = os.path.join(BASE_DIR, "signal_queue.jsonl")
SEEN_FILE = os.path.join(BASE_DIR, "signal_seen.json")

# Scoring patterns (from signal_watcher.py)
HIGH_PATTERNS = [
    r"traffic\s+but\s+no\s+conv",
    r"(spent|throwing|burned|wasted|blew)\s+\$[\d,]+\s+(on\s+)?ads",
    r"zero\s+sales",
    r"\b0\s+sales\b",
    r"\bno\s+sales\b",
    r"not\s+convert",
    r"no\s+conversions?",
    r"launched\s+(yesterday|today|last\s+week)\b.*\b0\s+sign",
    r"\b0\s+sign.ups?",
    r"zero\s+sign.?ups?",
    r"\$0\s+revenue",
    r"no\s+revenue",
    r"getting\s+traffic\b.*\bno\s+buy",
    r"visitors?\s+but\s+no\s+(convers|buy|sales|sign)",
    r"clicks\s+but\s+no\s+(convers|buy|sales|sign)",
    r"3\d+%\s+bounce",
    r"conversion\s+rate\s+(is\s+)?(0|0\.)",
]

MED_HIGH_PATTERNS = [
    r"roast\s+my\s+landing",
    r"roast\s+my\s+(site|page|startup|product)",
    r"feedback\s+(on|for|wanted|please)\s+my\s+landing",
    r"landing\s+page\s+feedback",
    r"review\s+my\s+landing\s+page",
    r"critique\s+my\s+landing",
    r"help\s+with\s+(my\s+)?landing\s+page",
    r"landing\s+page\s+help",
    r"improve\s+my\s+landing",
    r"no\s+traction",
    r"struggling\s+to\s+get\s+(users|customers|signups|sales)",
    r"can'?t\s+get\s+(users|customers|signups|sales)",
    r"\b0\s+customers\b",
    r"zero\s+customers",
    r"no\s+customers",
    r"conversion\s+rate\s+(is\s+)?(terrible|bad|awful|poor|low)",
    r"why\s+(is\s+)?nobody\s+(buying|signing|converting)",
    r"not\s+getting\s+(any\s+)?(users|customers|sales|signups|traction)",
    r"terrible\s+(conversion|ctr|click)",
    r"landing\s+page\s+not\s+working",
    r"why\s+are\s+(people\s+)?leaving",
]

SHOW_HN_PATTERNS = [
    r"\bshow\s+hn\b.*\blanding\b",
    r"\bshow\s+hn\b.*\blaunch",
    r"\bshow\s+hn\b.*\bstartup",
    r"\bshow\s+hn\b.*\bfeedback",
    r"\bask\s+hn\b.*landing\s+page",
    r"\bask\s+hn\b.*\bno\s+(sales|traction|signups)",
    r"free\s+tool.*audit.*landing\s+page",
    r"audit.*landing\s+page",
    r"landing\s+page.*audit",
]

def score_signal(headline, body=""):
    combined = (headline + " " + body).lower()
    for pat in HIGH_PATTERNS:
        if re.search(pat, combined, re.I):
            return 9
    for pat in MED_HIGH_PATTERNS:
        if re.search(pat, combined, re.I):
            return 7
    for pat in SHOW_HN_PATTERNS:
        if re.search(pat, combined, re.I):
            return 6
    return 5

def load_seen():
    if os.path.exists(SEEN_FILE):
        try:
            with open(SEEN_FILE) as f:
                data = json.load(f)
                return set(data) if isinstance(data, list) else set(data.keys())
        except:
            pass
    return set()

def save_seen(seen_set):
    with open(SEEN_FILE, "w") as f:
        json.dump(sorted(seen_set), f, indent=2)

def append_signal(signal):
    with open(QUEUE_FILE, "a") as f:
        f.write(json.dumps(signal) + "\n")

# ---- DEFINE LEADS ----
# Format: (source, url, author, headline, trigger_text, product_url, score_override)
# score_override=None means auto-score
leads = [
    # === HN LEADS ===
    ("hn_algolia",
     "https://news.ycombinator.com/item?id=42930023",
     "alex_arc_nine",
     "Show HN We launched our first digital product – hard lessons as Indie Developers",
     "We crossed 300 unique visitors, unfortunately still no conversion. ended up with 0 conversions.",
     "https://alt-generator.ai/",
     None),

    # === INDIEA HACKERS LEADS ===
    ("ih_group",
     "https://www.indiehackers.com/post/what-is-wrong-with-my-landing-4bb896faa6",
     "Valera Gurachek",
     "What is wrong with my landing?",
     "I've got 0 sign-ups both from Meta & Reddit ads. running some ads... this landing is the worst",
     "https://prepto.tech",
     None),

    ("ih_group",
     "https://www.indiehackers.com/post/one-week-into-my-launch-zero-sales-but-a-couple-of-interesting-numbers-0916dc425d",
     "northcoast_dev",
     "One week into my launch. Zero sales, but a couple of interesting numbers.",
     "Launched on Product Hunt, ran a small Google Ads test (€5-7/day). One week later: zero paying customers. 935 impressions and 38 clicks, nobody's converted yet.",
     "https://knallhart.dev",
     None),

    ("ih_group",
     "https://www.indiehackers.com/post/help-my-conversion-rate-is-0-00005-14844e6f55",
     "gary_miklos",
     "Help, my conversion rate is 0.00005%",
     "10 million views, 150k free users, and only 500 paid users. the landing page had more than 10 million views, the conversion rate looks quite bad.",
     "https://text2sql.ai/",
     None),

    ("ih_group",
     "https://www.indiehackers.com/post/landing-page-not-converting-what-is-the-issue-e6eda5fb35",
     "David Nemes",
     "Landing page not converting! what is the issue?",
     "running ads & the CPC is around 0.12$... from around 230 clicks only 3 people signed up for the waitlist. There is an issue with my landing page",
     "https://pagetoweb.com/",
     None),

    ("ih_group",
     "https://www.indiehackers.com/post/why-is-my-landing-page-not-converting-b139613e66",
     "Syed Faraaz Ahmad",
     "Why is my landing page not converting?",
     "I don't seem to be getting any conversions (ConvertKit signups). I would love to know the issues you see with this.",
     "https://invoicemod.com/",
     None),

    # === REDDIT LEADS ===
    ("reddit",
     "https://www.reddit.com/r/startups/comments/1e9a9rs/spent_1500_on_ads_got_almost_0_leads/",
     "unknown",
     "Spent $1500 on ads - Got almost 0 leads",
     "Spent $1500 on ads - Got almost 0 leads. So answer is your landing page not converting.",
     "",
     None),

    ("reddit",
     "https://www.reddit.com/r/startups/comments/1tum2d5/spent_174_on_reddit_ads_for_a_b2b_saas_111927/",
     "unknown",
     "Spent €174 on Reddit ads for a B2B SaaS. 111,927 impressions...",
     "Zero conversions from ~44 cold visitors to a paid B2B SaaS offer.",
     "",
     None),

    ("reddit",
     "https://www.reddit.com/r/GrowthHacking/comments/1qh3e75/we_spent_8k_on_linkedin_ads_and_got_clicks_but/",
     "unknown",
     "We spent $8K on LinkedIn ads and got clicks, but zero conversions",
     "We spent $8K on LinkedIn ads and got clicks, but zero conversions.",
     "",
     None),

    ("reddit",
     "https://www.reddit.com/r/smallbusiness/comments/1ndk79c/is_anyone_else_burning_cash_on_ads_but_barely/",
     "unknown",
     "Is anyone else burning cash on ads but barely getting any sales?",
     "burning cash on ads but barely getting any sales. Are you getting a good click rate and not converting?",
     "",
     None),

    ("reddit",
     "https://www.reddit.com/r/EntrepreneurRideAlong/comments/1q3ydv2/0_sales_so_far_full_time_job_posting_this_on/",
     "unknown",
     "0 sales so far. Full time job. Posting this on vacay.",
     "0 sales so far. Now I have a system, but no traction yet.",
     "",
     None),

    ("reddit",
     "https://www.reddit.com/r/EntrepreneurRideAlong/comments/1khs8a7/launched_my_api_saas_no_traction_pivoted_to/",
     "unknown",
     "Launched my API SaaS, no traction, pivoted to adding web app layer looking for feedback",
     "Launched my API SaaS, no traction, pivoted to adding web app layer looking for feedback",
     "",
     None),

    ("reddit",
     "https://www.reddit.com/r/EntrepreneurRideAlong/comments/1rl5500/launched_my_saas_yestersay/",
     "unknown",
     "Launched my SaaS yestersay",
     "Launched my first SaaS yesterday. No customers yet. No revenue. Just a live product and a racing heartbeat.",
     "",
     None),

    ("reddit",
     "https://www.reddit.com/r/SideProject/comments/1rw112m/3_weeks_zero_signups_how_a_random_reddit_comment/",
     "unknown",
     "3 weeks, zero signups. How a random Reddit comment saved my...",
     "3 weeks, zero signups. I spent 6 months building something no one wanted.",
     "",
     None),

    ("reddit",
     "https://www.reddit.com/r/SideProject/comments/1q4u32b/5_days_sharing_my_side_project_0_signups_what_am/",
     "unknown",
     "5 days sharing my side project, 0 signups - what am I missing?",
     "Week 1 of my dropship side project — 0 signups. What am I missing?",
     "",
     None),

    ("reddit",
     "https://www.reddit.com/r/SideProject/comments/1ffrzeg/i_spent_6_months_on_a_web_app_as_a_side_project/",
     "unknown",
     "I spent 6 months on a web app as a side project, and got 0 users",
     "I spent 6 months on a web app as a side project, and got 0 users. Zero ranking, zero new users.",
     "",
     None),

    ("reddit",
     "https://www.reddit.com/r/SideProject/comments/1l44pq8/more_than_70_free_users_yet_no_one_purchased/",
     "unknown",
     "More than 70 free users yet no one purchased",
     "More than 70 free users yet no one purchased.",
     "",
     None),

    ("reddit",
     "https://www.reddit.com/r/FacebookAds/comments/1ljro2i/600_facebook_visitors_and_no_sales_bye/",
     "unknown",
     "+600 Facebook visitors and no sales? bye!",
     "600 Facebook visitors and no sales. Tips for optimizing ad spend.",
     "",
     None),

    ("reddit",
     "https://www.reddit.com/r/FacebookAds/comments/1cyel5h/hired_ppc_agency_500_spent_no_sales/",
     "unknown",
     "Hired PPC agency, $500 spent, no sales.",
     "Hired PPC agency, $500 spent, no sales. no sales isn't necessarily an ads problem. Why...",
     "",
     None),

    ("reddit",
     "https://www.reddit.com/r/PPC/comments/1gertt8/i_spent_1000_from_my_1person_startup_budget_on/",
     "unknown",
     "I spent $1000 from my 1-person startup budget on Google Ads and...",
     "$1000 from my 1-person startup budget on Google Ads and no sales. Why are my ads getting clicks but no sales?",
     "",
     None),

    ("reddit",
     "https://www.reddit.com/r/FacebookAds/comments/1j469k7/struggling_with_clicks_but_no_sales_need_help/",
     "unknown",
     "Struggling with Clicks but No Sales? Need Help!",
     "Struggling with Clicks but No Sales? Need Help!",
     "",
     None),

    ("reddit",
     "https://www.reddit.com/r/SaaS/comments/1nczlcx/are_people_not_interested_or_is_my_landing_page/",
     "unknown",
     "Are people not interested or is my landing page bad?",
     "Told our SaaS product is good but it's not converting. Is my landing page bad?",
     "",
     None),
]

# Process
seen = load_seen()
print(f"Loaded {len(seen)} seen URLs")

new_signals = []
for source, url, author, headline, trigger_text, product_url, score_override in leads:
    if url in seen:
        print(f"  SKIP (seen): {url}")
        continue

    if score_override:
        score = score_override
    else:
        score = score_signal(headline, trigger_text)

    if score < 6:
        print(f"  SKIP (score={score}): {headline[:60]}")
        continue

    seen.add(url)
    signal = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "source": source,
        "url": url,
        "author": author,
        "product_url": product_url,
        "headline": headline,
        "trigger_text": trigger_text[:500],
        "signal_score": score,
        "contacted": False,
    }
    new_signals.append(signal)
    append_signal(signal)
    print(f"  QUEUED [score={score}] {source:<12} {headline[:65]}")

save_seen(seen)
print(f"\n=== SUMMARY ===")
print(f"New signals queued: {len(new_signals)}")
print(f"Total in seen: {len(seen)}")
print(f"Score distribution:")
from collections import Counter
for s, c in Counter(s["signal_score"] for s in new_signals).most_common():
    print(f"  Score {s}: {c} leads")
