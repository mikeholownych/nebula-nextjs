#!/usr/bin/env python3
"""Fetch HN Algolia leads for buying triggers."""
import json, urllib.request, urllib.parse, time

QUERIES = [
    ("landing page conversion", 7),
    ("Show HN landing page feedback", 14),
    ("no conversions", 90),
    ("zero sales", 90),
    ("ad spend no sales", 90),
    ("0 signups", 90),
    ("traffic but no conversions", 90),
]

NOW = int(time.time())
seen_urls = set()
results = []

for q, days in QUERIES:
    cutoff = NOW - (days * 86400)
    params = urllib.parse.urlencode({
        "query": q,
        "tags": "story",
        "numericFilters": f"created_at_i>{cutoff}",
        "hitsPerPage": 20,
    })
    url = f"https://hn.algolia.com/api/v1/search_by_date?{params}"
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read())
        for hit in data.get("hits", []):
            oid = hit.get("objectID", "")
            if oid in seen_urls:
                continue
            seen_urls.add(oid)
            title = hit.get("title", "") or ""
            if not title:
                continue
            results.append({
                "objectID": oid,
                "title": title,
                "author": hit.get("author", ""),
                "url": f"https://news.ycombinator.com/item?id={oid}",
                "product_url": hit.get("url", ""),
                "story_text": (hit.get("story_text") or "")[:300],
            })
        print(f"  '{q}' ({days}d): {len(data.get('hits',[]))} hits -> {len([h for h in data.get('hits',[]) if h.get('objectID','') not in seen_urls or True])} new")
    except Exception as e:
        print(f"  Error '{q}': {e}")
    time.sleep(0.3)

# Output as JSON
print(f"\nTOTAL: {len(results)} unique HN posts")
# Print simple format
for r in results:
    print(f"LEAD|{r['objectID']}|{r['author']}|{r['title'][:120]}|{r['url']}|{(r['story_text'] or '')[:200]}")
