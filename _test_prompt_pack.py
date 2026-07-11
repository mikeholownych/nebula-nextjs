#!/usr/bin/env python3
"""End-to-end test: audit → prompt pack generation → JSON saved"""
import sys, json, os
sys.path.insert(0, '/home/mike/nebula')

from deliver_audit import scrape_page, score_audit
from audit_pipeline.prompts.generator import build_prompt_pack

# Scrape a real page
page = scrape_page('https://nebulacomponents.shop')
audit = score_audit(page)

# Build prompt pack exactly like delivery pipeline does
pack = build_prompt_pack(
    audit, page,
    email='payments-test@nebulacomponents.shop',
    stated_visitor='founders bleeding money on ads',
    stated_goal='increase landing page conversion',
)

print('=== PROMPT PACK VERIFICATION ===')
print(f'Total prompts generated: {pack["count"]}')
print(f'Teaser dimension:        {pack["teaser"]["key"]}')
print(f'Teaser score:            {pack["teaser"]["score"]}')
print(f'Full pack size:          {len(pack["full_pack"])} prompts')
print(f'Pack file path:          {pack["pack_path"]}')

# Verify the JSON file
pack_path = pack['pack_path']
if not os.path.isfile(pack_path):
    print(f'ERROR: Pack file not found at {pack_path}')
    sys.exit(1)

with open(pack_path) as f:
    data = json.load(f)

print(f'JSON file size: {os.path.getsize(pack_path)} bytes')
print(f'JSON prompts count: {len(data.get("prompts", []))}')
print(f'JSON has grade: {"grade" in data}')
print(f'JSON has email_hash: {"email_hash" in data}')
print(f'JSON has stripe_token: {"stripe_token" in data}')
print(f'JSON has prompts: {"prompts" in data}')

# Check for unresolved template vars
errors = []
for i, p in enumerate(data.get('prompts', [])):
    if '${' in p:
        errors.append(f'Unresolved template var in prompt {i}')
    if 'fill in your details' in p.lower():
        errors.append(f'Unfilled placeholder in prompt {i}')

if errors:
    print('ERRORS:')
    for e in errors:
        print(f'  - {e}')
    sys.exit(1)
else:
    print('All prompts clean — no unresolved template variables or placeholders ✓')

# Show teaser
print()
print('=== TEASER PROMPT (first 250 chars) ===')
print(pack['teaser']['prompt_md'][:250])
print()

# Verify the pack path is in audit_pipeline/prompts/packs/
expected_base = '/home/mike/nebula/audit_pipeline/prompts/packs/'
if pack_path.startswith(expected_base):
    print(f'Pack stored in correct directory ✓')
else:
    print(f'WARNING: pack path unexpected: {pack_path}')

print()
print('=== ALL CHECKS PASSED ===')
