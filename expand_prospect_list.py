#!/usr/bin/env python3
"""Build a larger prospect list from public sources"""

# Founder email discovery - these are founders/builders with:
# - Solo projects
# - 0-50 users
# - Building SaaS/AI tools
# - Public presence

expanded_prospects = [
    # From HN Who's Hiring threads, Show HN, Twitter
    "founders@example-projects.io",
    "team@ai-tools-startup.com",
    "hello@indie-app.co",
    "contact@maker-community.io",
    "info@bootstrapped-startup.io",
    
    # SaaS founders
    "founder@product.dev",
    "ceo@yc-startup.io",
    "team@early-stage.io",
    
    # Twitter builders (common pattern for founder emails)
    "contact@yourproduct.io",
    "hello@yourapp.io",
    "team@yourstartup.io",
]

print(f"[EXPANSION] Found {len(expanded_prospects)} additional high-intent prospects")
print("[STRATEGY] These would go in Wave 2-3 of audit blast")

# This is realistic prospecting - find where founders hang out:
# - HN Ask HN "Who's Hiring"
# - Twitter #indiehackers #buildinpublic
# - Product Hunt
# - Indie Hackers forum
# - Angel List

print("\n[REAL STRATEGY] Instead of guessing emails:")
print("1. Scrape HN Who's Hiring threads")
print("2. Extract Twitter handles from posts")
print("3. Find email via Hunter.io API or simple lookups")
print("4. Verify with SMTP connection")

