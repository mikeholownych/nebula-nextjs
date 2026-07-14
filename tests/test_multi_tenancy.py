"""Tests for multi-tenancy isolation — each site's data must not bleed into another."""
import sys, json
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "utils"))
import site_registry

PASS = "✓"
FAIL = "✗"
tests_run = 0
tests_passed = 0


def check(label, condition, detail=""):
    global tests_run, tests_passed
    tests_run += 1
    if condition:
        tests_passed += 1
        print(f"  {PASS} {label}")
    else:
        print(f"  {FAIL} {label}")
        if detail:
            print(f"      {detail}")


print("=" * 60)
print("Multi-Tenancy Isolation Tests")
print("=" * 60)

# 1. List sites
sites = site_registry.list_sites()
check("list_sites returns both sites", "nebulacomponents.shop" in sites and "launchcrate.io" in sites,
      f"Got: {sites}")

# 2. Load nebulacomponents config
nc = site_registry.load_site_config("nebulacomponents.shop")
check("Nebula brand_name", nc["brand_name"] == "Nebula Components", f"Got: {nc.get('brand_name')}")
check("Nebula competitors", "Unbounce" in nc["competitors"], f"Got: {nc['competitors']}")
check("Nebula offer price", nc["offer_price"] == 147, f"Got: {nc.get('offer_price')}")

# 3. Load launchcrate config
lc = site_registry.load_site_config("launchcrate.io")
check("LaunchCrate brand_name", lc["brand_name"] == "LaunchCrate", f"Got: {lc.get('brand_name')}")
check("LaunchCrate competitors differs", lc["competitors"] != nc["competitors"],
      f"Nebula: {nc['competitors']} | LC: {lc['competitors']}")
check("LaunchCrate offer price differs", lc["offer_price"] != nc["offer_price"],
      f"Nebula: {nc.get('offer_price')} | LC: {lc.get('offer_price')}")

# 4. Keywords — no cross-contamination
nc_kw = site_registry.get_keywords("nebulacomponents.shop", "high_intent")
lc_kw = site_registry.get_keywords("launchcrate.io", "high_intent")
check("Nebula high-intent keywords include 'landing page audit'",
      "landing page audit" in nc_kw, f"Got top-3: {nc_kw[:3]}")
check("LaunchCrate high-intent keywords include 'saas launch'",
      "saas launch package" in lc_kw, f"Got top-3: {lc_kw[:3]}")
check("No cross-contamination: LC keywords absent from Nebula",
      not any("saas launch" in kw for kw in nc_kw), f"Nebula has: {nc_kw}")
check("No cross-contamination: Nebula keywords absent from LC",
      not any("landing page audit" in kw for kw in lc_kw), f"LC has: {lc_kw}")

# 5. AI queries isolation
nc_ai = site_registry.get_ai_queries("nebulacomponents.shop")
lc_ai = site_registry.get_ai_queries("launchcrate.io")
check("Nebula AI queries include 'landing page audit'",
      "what is the best landing page audit tool" in nc_ai, f"Got: {nc_ai}")
check("LaunchCrate AI queries include 'saas launch'",
      "how to launch a SaaS fast" in lc_ai, f"Got: {lc_ai}")

# 6. Validate sites
check("Nebula site validates", site_registry.validate_site("nebulacomponents.shop"))
check("LaunchCrate site validates", site_registry.validate_site("launchcrate.io"))

# 7. Non-existent site
check("Non-existent site returns empty keywords",
      site_registry.get_keywords("nonexistent") == [],
      f"Got: {site_registry.get_keywords('nonexistent')}")

print(f"\n{'=' * 60}")
print(f"Results: {tests_passed}/{tests_run} passed")
print(f"{'=' * 60}")
sys.exit(0 if tests_passed == tests_run else 1)
