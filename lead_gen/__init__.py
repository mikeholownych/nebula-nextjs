"""Lead generation pipeline - trigger-aware outbound for Nebula Components.

Five stages:
1. Hunter.io Discovery (seed domains → founder emails)
2. RB2B Visitor Tracking (pixel on site → visitor profiles)
3. Intent Scoring (Claude evaluates buying trigger signals)
4. AgentMail Outbound (personalized cold emails, fail-closed)
5. Reply Handling (n8n webhook → classify replies, notify SDR)

Phased rollout Sep 2–30.
"""

from . import discover, score_intent, outbound

__all__ = ["discover", "score_intent", "outbound"]
