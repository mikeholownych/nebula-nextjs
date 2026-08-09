#!/usr/bin/env python3
"""Load seed prospects from Hunter.io into lead_state.db for Sep 2 launch.

Usage:
  cd /home/mike/nebula
  python3 lead_gen/load_seed_prospects.py

Requires:
  - ~/.env with HUNTER_KEY set
  - Hunter.io credits (1k credits/year budget)

Output:
  - lead_state.db populated with ~50–100 prospects (founders + decision-makers)
  - Prospects ready for Week 1 intent scoring

Seed domains (ICP: actively bleeding money on ads):
  - SaaS founders with paid ads campaigns
  - E-commerce: Shopify stores, Printful, Etsy sellers
  - Agencies: digital agencies, freelancers
"""
import os
import sys
import json
from pathlib import Path

# Seed domain list (ICP: founders actively spending on ads)
SEED_DOMAINS = [
    # SaaS / B2B
    "stripe.com",
    "github.com",
    "figma.com",
    "notion.so",
    "airtable.com",
    "mailchimp.com",
    
    # E-commerce / Shopify ecosystem
    "shopify.com",
    "etsy.com",
    "wix.com",
    "squarespace.com",
    "printful.com",
    
    # Agencies / Services
    "wistia.com",
    "webflow.com",
    "zapier.com",
    "unbounce.com",
    
    # Founders / Accelerators (public contact lists)
    "ycombinator.com",
    "techstars.com",
]


def main():
    """Load seed prospects from Hunter.io."""
    sys.path.insert(0, str(Path(__file__).parent.parent))
    
    # Load env
    env_path = Path.home() / "nebula" / ".env"
    if env_path.exists():
        import dotenv
        dotenv.load_dotenv(env_path)
    
    hunter_key = os.environ.get("HUNTER_KEY")
    if not hunter_key:
        print("❌ HUNTER_KEY not set in ~/.env")
        print("   Get key from hunter.io dashboard, then:")
        print("   echo 'HUNTER_KEY=sk_...' >> ~/.env")
        sys.exit(1)
    
    # Initialize DB
    from lead_gen.discover import init_db, discover_from_domains
    init_db()
    print("✓ lead_state.db initialized")
    
    # Load prospects
    print(f"\n🔍 Discovering {len(SEED_DOMAINS)} seed domains...")
    print(f"   Rate limit: 300 req/day (each domain = 1 req)")
    
    result = discover_from_domains(SEED_DOMAINS, limit=3)
    
    print(f"\n✓ Discovery complete")
    print(f"   Discovered: {len(result['discovered'])} prospects")
    print(f"   Rate limited: {result['rate_limited']}")
    print(f"   Requests remaining today: {result['requests_remaining']}")
    
    # Show sample prospects
    if result["discovered"]:
        print(f"\n📋 Sample prospects (first 5):")
        for p in result["discovered"][:5]:
            print(f"   - {p['email']} ({p['job_title']}, {p['company_size']} employees)")
    
    # Summary
    from lead_gen.discover import list_prospects
    prospects = list_prospects()
    print(f"\n📊 Lead_state.db now contains: {len(prospects)} prospects")
    print(f"   Ready for Week 1 intent scoring (Sep 2–9)")
    
    return 0


if __name__ == "__main__":
    sys.exit(main())
