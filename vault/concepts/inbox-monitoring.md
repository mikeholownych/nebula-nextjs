# Inbox Monitoring System

## Core Purpose
Classify and respond to replies from cold email campaigns

## Classification Logic
```python
import re

BUY_SIGNALS = re.compile(
    r'\b(yes|buy|get it|send link|checkout|purchase|let\'?s do it|'
    r'fix it|implement|start now|i\'?ll take|sign me up|'
    r'\$97|97 dollar|pay now|grab it|interested)\b',
    re.IGNORECASE
)

INFO_SIGNALS = re.compile(
    r'\b(tell me more|how does it|what exactly|how much|'
    r'show me|demo|example|samples|more info|details about|'
    r'how it works|what do you|explain)\b',
    re.IGNORECASE
)

def classify_reply(subject, preview):
    text = f"{subject} {preview}"
    if BUY_SIGNALS.search(text):
        return "purchase_intent"
    if INFO_SIGNALS.search(text):
        return "info_request"
    return "other"
```

## Auto-Response Rules
| Classification | Action | Content |
|---------------|--------|---------|
| `purchase_intent` | Send Stripe checkout link | "Here's the checkout link: {STRIPE_97}. Or self-serve DIY kit: {STRIPE_7}" |
| `info_request` | Send free audit tool link | "Here's the free audit tool — paste your URL: https://yoursite.com/audit.html" |
| `other` | No auto-reply, flag as warm | Log to HOT_LEAD.json for human/CEO review |

## Critical Rules
- **Never auto-post to public threads** — auto-reply is for private email replies only
- **Log every auto-reply** to a state file to avoid duplicate responses
- **Purchase intent = send link, not a call booking** — forbidden: calendar links, "reply yes", schedule a call
- **Info request = send the tool, not a pitch** — let the tool do the selling

## Implementation Pattern
The inbox monitor script should:
1. Pull warm replies from the inbox API
2. Classify each new reply
3. Auto-respond via SMTP (reply to thread)
4. Update HOT_LEAD.json with classification + action taken + new status