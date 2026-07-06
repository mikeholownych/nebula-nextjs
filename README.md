# Nebula Components - Trigger-Aware Lead Generation Pipeline

## Overview
This repository contains the implementation of a trigger-aware lead generation pipeline for Nebula Components. The pipeline identifies buying triggers in online content and automates outreach to high-potential prospects.

## Core Components
1. **Trigger Lead Engine** - Python script that searches for buying triggers in Reddit, HN, LinkedIn, and local business sources
2. **Lead Magnets** - Five markdown assets for nurturing leads
3. **Content Calendar** - 30-day content calendar with trigger-based hooks
4. **Test Suite** - Unit tests for the trigger lead engine
5. **Audit Leads** - JSONL file for tracking audit requests
6. **Outreach Evidence** - JSONL file for tracking outreach results

## Setup
1. Create a virtual environment: `python3 -m venv venv`
2. Activate the virtual environment: `source venv/bin/activate`
3. Install dependencies: `pip install requests`
4. Run tests: `PYTHONPATH=. python3 tests/test_trigger_lead_engine.py -v`
5. Run the engine: `PYTHONPATH=. python3 scripts/trigger_lead_engine.py`

## Usage
The trigger lead engine can be run with different source types:
- `reddit_explicit_pain` - Search for buying triggers on Reddit
- `hn_explicit_pain` - Search for buying triggers on Hacker News
- `linkedin_signal` - Search for buying triggers on LinkedIn
- `local_business` - Search for local business signals

## Next Steps
1. Integrate with Notion for lead tracking
2. Connect to n8n for workflow automation
3. Set up cron jobs for automated lead generation
4. Implement email delivery system
5. Add analytics and reporting