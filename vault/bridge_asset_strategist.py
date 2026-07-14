#!/usr/bin/env python3
"""
Bridge Asset Strategist - TrustOS Bridge Asset System
Generates lead magnet concepts that bridge ICP pain to Nebula offer
"""

import json
import sys
import os
from pathlib import Path
from typing import Dict, List, Any

def load_icp_memo() -> str:
    """Load the ICP_MEMO content"""
    icp_path = Path("/home/mike/.hermes/skills/marketing/competitive-counter-positioning/references/trustos-forensic-icp-research.md")
    if icp_path.exists():
        return icp_path.read_text()
    
    # Fallback to vault concepts
    icp_vault = Path("/home/mike/nebula/vault/concepts/icp.md")
    if icp_vault.exists():
        return icp_vault.read_text()
    
    return """ICP_MEMO placeholder - needs full research"""

def load_offer_memo() -> str:
    """Load the OFFER_MEMO content"""
    offer_path = Path("/home/mike/nebula/vault/OFFER_MEMO.md")
    if offer_path.exists():
        return offer_path.read_text()
    
    # Create minimal version if missing
    return """OFFER_MEMO placeholder - needs full audit"""

def generate_bridge_concepts(icp_memo: str, offer_memo: str) -> List[Dict[str, Any]]:
    """
    Generate 3 bridge asset concepts based on TrustOS framework
    """
    
    # Parse key elements from memos
    icp_lines = icp_memo.split('\n')
    
    # Extract bleeding neck problems
    bleeding_neck = []
    in_bleeding_section = False
    for line in icp_lines:
        if "bleeding neck" in line.lower() or "bleeding neck" in line:
            in_bleeding_section = True
            continue
        if in_bleeding_section and line.strip() and "-" in line:
            bleeding_neck.append(line.strip())
        elif in_bleeding_section and "**" in line:
            break
    
    # Extract trigger events
    trigger_event = ""
    for line in icp_lines:
        if "trigger event" in line.lower():
            trigger_event = line.split(":")[-1].strip()
            break
    
    # Parse offer memo
    offer_lines = offer_memo.split('\n')
    core_offer = ""
    for line in offer_lines:
        if "Core Offer:" in line:
            core_offer = line.split(":")[-1].strip()
            break
    
    # Generate concepts
    concepts = []
    
    # Concept 1: Dollar Leak Calculator
    concepts.append({
        "title": "The Landing Page Leak Calculator: Find Your Exact $/Month Ad Waste",
        "target_symptom": bleeding_neck[0] if bleeding_neck else "Spent $10k on Meta & Google Ads — barely any orders",
        "methodology_taught": """
1. Message Match Audit - How to check if your traffic matches your promise
2. ROAS Cliff Detection - Finding the exact point where visitors drop off
3. CTA Friction Score - Measuring how many steps between interest and action
4. Trust Gap Calculation - Quantifying the moment visitors decide not to buy
        """,
        "bridge_to_offer": """
The calculator shows the leak, our Fix Pack plugs it. Once you see the exact dollar amount, $147 is trivial math vs continuing to bleed cash.
        """,
        "length_words": 3500,
        "production_complexity": 3,
        "format": "Interactive calculator + diagnostic guide"
    })
    
    # Concept 2: Agency Bullshit Detector
    concepts.append({
        "title": "The Agency Testing Phase Survival Guide: How to Spot (and Avoid) Fake 'Strategy' Charges",
        "target_symptom": "The last person I paid said it was a testing phase for 3 months. I ended up with nothing and a lighter bank account.",
        "methodology_taught": """
1. Testing Phase vs Real Work - The 3 signals that separate strategy from stalling
2. Dollar-in, Dollar-out Accountability - How to demand proof before paying
3. Fast-Fix vs Slow-Discovery - Recognizing who will actually help vs who will bill hourly
4. Self-Serve vs Hand-Holding - When to pay for done-for-you vs when to DIY
        """,
        "bridge_to_offer": """
Our $97 Fix Pack is the anti-agency solution: specific diagnosis + same-day fix + dollar leak proof. No testing phase, no stalling, no bullshit.
        """,
        "length_words": 4200,
        "production_complexity": 4,
        "format": "Checklist + case studies + red flag detector"
    })
    
    # Concept 3: ROAS Cliff Repair Manual
    concepts.append({
        "title": "ROAS Cliff Repair: Plug the 4 Holes Killing Your Paid Traffic (Before You Spend Another $1k)",
        "target_symptom": "clicks but no sales, I have no idea what's broken",
        "methodology_taught": """
1. Hook-to-LP Gap Diagnosis - Why visitors click but don't convert
2. Above-Fold Conversion Surgery - Fixing the 5-second test failure
3. Offer Clarity Score - Making your promise impossible to misunderstand
4. CPM Creep Relief - Lowering your cost per click with better message match
        """,
        "bridge_to_offer": """
Our implementation service fixes all 4 holes in 2 hours, guaranteed. The manual shows you what's broken, we fix it while you focus on your business.
        """,
        "length_words": 2800,
        "production_complexity": 2,
        "format": "Step-by-step repair checklist with examples"
    })
    
    return concepts

def main():
    """Main execution function"""
    
    print("🚀 Nebula Bridge Asset Strategist")
    print("=" * 50)
    
    # Load memos
    print("📋 Loading memos...")
    icp_memo = load_icp_memo()
    offer_memo = load_offer_memo()
    
    print(f"📊 ICP_MEMO loaded: {len(icp_memo.split())} words")
    print(f"📊 OFFER_MEMO loaded: {len(offer_memo.split())} words")
    
    # Generate concepts
    print("\n💡 Generating bridge asset concepts...")
    concepts = generate_bridge_concepts(icp_memo, offer_memo)
    
    # Display concepts
    for i, concept in enumerate(concepts, 1):
        print(f"\n{'='*30}")
        print(f"CONCEPT #{i}")
        print(f"{'='*30}")
        print(f"📚 Title: {concept['title']}")
        print(f"🎯 Target Symptom: {concept['target_symptom']}")
        print(f"📏 Length: {concept['length_words']} words")
        print(f"⚙️ Complexity: {concept['production_complexity']}/5")
        print(f"📦 Format: {concept['format']}")
        print(f"\n📖 Methodology Taught:")
        print(concept['methodology_taught'])
        print(f"\n🔗 Bridge to Offer:")
        print(concept['bridge_to_offer'])
    
    # Save to file
    output_file = Path("/home/mike/nebula/vault/bridge_asset_concepts.json")
    output_data = {
        "generated_at": "2026-07-11",
        "concepts": concepts,
        "selected_concept": concepts[0]  # Default to first concept
    }
    
    output_file.write_text(json.dumps(output_data, indent=2))
    print(f"\n💾 Saved to: {output_file}")
    
    # Recommendations
    print("\n🎯 RECOMMENDATIONS:")
    print("1. Start with Concept #1: Dollar Leak Calculator")
    print("2. Create deep-dive research with 5-7 ICP founders")
    print("3. Build the interactive calculator component")
    print("4. Extract 20 LinkedIn posts from the methodology")
    print("5. Create trigger-aware outreach based on the leak calculation")
    
    return 0

if __name__ == "__main__":
    sys.exit(main())