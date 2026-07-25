"""Regression coverage for parse_old_reddit_results (root-level
trigger_lead_engine.py — the one actually scheduled in cron, distinct
from the unrelated scripts/trigger_lead_engine.py that test_trigger_lead_engine.py
covers).

Confirmed live (2026-07-25): the cron job had logged "SAVED: 0 leads" on
every one of its last 15 runs. Traced it to two real, independent bugs:

1. The block-boundary regex matched any div whose class started with the
   literal prefix "search-result" — which also matches wrapper divs old
   Reddit's search page actually uses: search-result-group,
   search-result-header, search-result-meta, search-result-footer. Those
   wrapper matches produced near-empty "blocks" whose loose title regex
   then picked up unrelated content elsewhere on the page (test results
   included things like an Amazon ads case study and a Lenovo subreddit
   description for a "landing page not converting" query), and snippet
   extraction always came back empty. Fixed by anchoring specifically on
   the two real per-item classes: search-result-link / search-result-subreddit.

2. REDDIT_SEARCH_QUERIES were unquoted multi-word strings (e.g.
   'landing page not converting'), which old Reddit's search treats as a
   loose OR-ish match rather than an exact phrase — compounding the noise.
   Fixed by quoting each phrase.

This fixture is a minimal hand-built HTML slice mirroring old Reddit's
real DOM shape closely enough to exercise both the wrapper-div trap and
correct extraction, without a live network dependency in tests.
"""
from trigger_lead_engine import parse_old_reddit_results

FIXTURE = """
<div class="search-result-group"><div class="contents">
  <div class="search-result-header"><h5>communities</h5></div>
  <div class="search-result-meta">2 results</div>
  <div class=" search-result search-result-subreddit " data-fullname="t5_abc">
    <a class="search-title may-blank" href="/r/photography/">Photographs</a>
    <div class="search-result-body">A place for r/photography users to share original works.</div>
  </div>
  <div class=" search-result search-result-link has-thumbnail no-linkflair " data-fullname="t3_111">
    <a class="search-title may-blank" href="/r/alexhormozi/comments/1uq3nu3/help_needed/">Help needed: why is my landing page not converting?</a>
    <div class="search-result-body">Spending real money on ads and getting nothing. Page looks fine to me but conversions are at zero.</div>
  </div>
  <div class=" search-result search-result-link has-thumbnail no-linkflair " data-fullname="t3_222">
    <a class="search-title may-blank" href="/r/PPC/comments/1pzojnz/why_is_my_landing_page/">Why is my landing page not converting?</a>
    <div class="search-result-body">$4k/mo on Google Ads, zero conversions this month. Landing page feedback wanted.</div>
  </div>
</div></div>
"""


def test_extracts_real_post_items_not_wrapper_divs():
    results = parse_old_reddit_results(FIXTURE, "landing page not converting")

    urls = [r["source_url"] for r in results]
    assert any("1uq3nu3" in u for u in urls)
    assert any("1pzojnz" in u for u in urls)


def test_excludes_subreddit_matches_without_comments_path():
    results = parse_old_reddit_results(FIXTURE, "landing page not converting")

    assert not any("photography" in r["source_url"] for r in results)


def test_titles_are_the_real_post_titles_not_unrelated_content():
    results = parse_old_reddit_results(FIXTURE, "landing page not converting")

    titles = {r["title"] for r in results}
    assert "Help needed: why is my landing page not converting?" in titles
    assert "Why is my landing page not converting?" in titles


def test_snippets_are_populated_not_empty():
    """The bug this regresses against: every real result had snippet=''
    because the wrapper-div block boundary meant search-result-body never
    fell inside the (wrong) matched block."""
    results = parse_old_reddit_results(FIXTURE, "landing page not converting")

    assert all(r["snippet"] for r in results)
    assert any("zero" in r["snippet"].lower() for r in results)


def test_reddit_search_queries_are_exact_phrase_quoted():
    """Unquoted multi-word queries produce loose OR-ish matches on old
    Reddit's search, not exact-phrase matches — verified live this session
    (unquoted 'landing page not converting' surfaced an Amazon ads case
    study and a Lenovo subreddit; quoted '"landing page not converting"'
    surfaced only genuinely on-topic posts)."""
    from trigger_lead_engine import REDDIT_SEARCH_QUERIES

    assert all(q.strip().startswith('"') for q in REDDIT_SEARCH_QUERIES)
